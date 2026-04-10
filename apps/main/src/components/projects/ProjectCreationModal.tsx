import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@gridix/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import { Progress } from "@gridix/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@gridix/ui";
import {
  Upload,
  FileSpreadsheet,
  Download,
  Link,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
const ExcelColumnMapper = lazy(
  () =>
    import("@/features/data-import/create-project-from-excel/ui/ExcelColumnMapper"),
);
const ExcelUrlImporter = lazy(
  () => import("@/features/data-import/import-from-url/ui/ExcelUrlImporter"),
);
import { useLanguage } from "@/contexts/LanguageContext";
import { registerProjectCreationTourKindNav } from "@/features/onboarding/driver/projectCreationTourNavBridge";
import type { Tables } from "@gridix/types/database";
import type { MainProjectCreationKind } from "./mainProjectCreationKind";

/**
 * Radix закрывает Dialog при outside-dismiss. Во время Driver.js это ломает тур двумя способами:
 * 1) Попап тура в `body` — клики по «Далее»/«Назад» считаются снаружи контента.
 * 2) У шага с `disableActiveInteraction` контент модалки с `pointer-events: none` — клик
 *    «по модалке» проходит на оверлей и тоже даёт dismiss.
 *
 * Пока на `body` есть `driver-active`, внешние закрытия для этого окна отключаем (выход — кнопка
 * закрытия в хедере модалки или завершение тура).
 */
function suppressDialogOutsideDismissWhileDriverTour(event: {
  preventDefault: () => void;
  target: EventTarget | null;
}): void {
  if (
    event.target instanceof Element &&
    event.target.closest(".driver-popover")
  ) {
    event.preventDefault();
    return;
  }
  if (
    typeof document !== "undefined" &&
    document.body.classList.contains("driver-active")
  ) {
    event.preventDefault();
  }
}

interface ProjectCreationModalProps {
  open: boolean;
  onClose: () => void;
  /** For root flow: receives chosen kind. For sub-project flow: called with no args. */
  onManualCreate: (kind?: MainProjectCreationKind) => void;
  /** When set, Excel import creates a sub-project (or imports into it) under this project instead of a new root project. */
  parentProjectId?: string;
  onSubProjectImportSuccess?: (subProject: Tables<"sub_projects">) => void;
}

type ImportedCell = string | number | null | undefined;
interface ImportedRow {
  [key: string]: ImportedCell;
}

function KindPreviewBuilding() {
  return (
    <div
      className="relative flex h-32 w-full items-end justify-center overflow-hidden rounded-lg border border-border/60 bg-gradient-to-b from-muted/80 to-muted"
      aria-hidden
    >
      <div className="mb-2 flex w-[70%] flex-col justify-end gap-1 rounded-t-md border border-border/80 bg-background/90 px-2 pt-2 shadow-sm">
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-[2px] bg-muted-foreground/15"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function KindPreviewObject() {
  return (
    <div
      className="relative flex h-32 w-full items-end justify-center gap-2 overflow-hidden rounded-lg border border-border/60 bg-gradient-to-b from-muted/80 to-muted px-3 pb-2"
      aria-hidden
    >
      {[0.85, 1, 0.9].map((scale, i) => (
        <div
          key={i}
          className="flex w-14 flex-col items-center"
          style={{ transform: `scale(${scale})` }}
        >
          <div className="h-5 w-10 rounded-t-sm border border-border/80 bg-background/90 shadow-sm" />
          <div className="h-6 w-12 rounded-sm border border-x border-b border-border/80 bg-background/70" />
        </div>
      ))}
    </div>
  );
}

function KindPreviewGenplan() {
  return (
    <div
      className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-muted/80 via-muted to-muted/60 p-2"
      aria-hidden
    >
      <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-1.5">
        <div className="rounded-md border border-dashed border-border/70 bg-background/40" />
        <div className="rounded-md border border-border/60 bg-foreground/5" />
        <div className="rounded-md border border-dashed border-border/70 bg-background/40" />
        <div className="col-span-2 rounded-md border border-border/60 bg-background/60" />
        <div className="rounded-md border border-dashed border-border/70 bg-background/40" />
      </div>
    </div>
  );
}

const ProjectCreationModal = ({
  open,
  onClose,
  onManualCreate,
  parentProjectId,
  onSubProjectImportSuccess,
}: ProjectCreationModalProps) => {
  const { t } = useLanguage();
  const [importedData, setImportedData] = useState<ImportedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [showUrlImporter, setShowUrlImporter] = useState(false);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [importMethod, setImportMethod] = useState<"file" | "url">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRootFlow = !parentProjectId;
  const [rootStep, setRootStep] = useState<"kind" | "methods">("kind");
  const [selectedKind, setSelectedKind] =
    useState<MainProjectCreationKind | null>(null);

  useEffect(() => {
    if (!open) return;
    if (!isRootFlow) {
      setRootStep("methods");
      return;
    }
    setRootStep("kind");
    setSelectedKind(null);
  }, [open, isRootFlow]);

  useEffect(() => {
    if (!open || !isRootFlow) {
      registerProjectCreationTourKindNav(null);
      return;
    }
    registerProjectCreationTourKindNav({
      requestKindScreen: () => {
        setRootStep("kind");
        setSelectedKind(null);
      },
    });
    return () => {
      registerProjectCreationTourKindNav(null);
    };
  }, [open, isRootFlow]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls") &&
      !file.name.endsWith(".csv")
    ) {
      toast.error(t("admin.project.create.supportedFormats"));
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const reader = new FileReader();
      const isCsv = file.name.toLowerCase().endsWith(".csv");
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      reader.onload = async (e) => {
        try {
          const result = e.target?.result;
          if (!result) {
            toast.error(t("errors.file.read"));
            return;
          }

          const XLSX = await import("xlsx");
          const workbook = isCsv
            ? XLSX.read(
                typeof result === "string"
                  ? result
                  : new TextDecoder("utf-8").decode(result as ArrayBuffer),
                { type: "string" },
              )
            : XLSX.read(new Uint8Array(result as ArrayBuffer), {
                type: "array",
              });

          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            toast.error(t("errors.file.noData"));
            return;
          }
          const worksheet = workbook.Sheets[firstSheetName];
          if (!worksheet) {
            toast.error(t("errors.file.noData"));
            return;
          }

          const jsonData = XLSX.utils.sheet_to_json<ImportedRow>(worksheet, {
            defval: "",
          });

          if (jsonData.length === 0) {
            console.log("jsonData", worksheet);

            toast.error(t("errors.file.noData"));
            setIsProcessing(false);
            return;
          }

          const firstRow = jsonData[0];
          if (!firstRow) {
            toast.error(t("errors.file.noData"));
            return;
          }
          const headers = Object.keys(firstRow).filter(
            (header) => header.trim() !== "",
          );

          setExcelColumns(headers);
          setImportedData(jsonData);
          setShowColumnMapper(true);
          setProgress(100);
          toast.success(
            t("messages.fileProcessed").replace(
              "{{count}}",
              String(jsonData.length),
            ),
          );
        } catch (error) {
          console.error("Ошибка обработки файла:", error);
          toast.error(t("errors.file.process"));
        } finally {
          clearInterval(progressInterval);
          setIsProcessing(false);
          event.target.value = "";
        }
      };

      reader.onerror = () => {
        toast.error(t("errors.file.read"));
        clearInterval(progressInterval);
        setIsProcessing(false);
        event.target.value = "";
      };

      if (isCsv) {
        reader.readAsText(file, "UTF-8");
      } else {
        reader.readAsArrayBuffer(file);
      }

      toast.info(t("admin.project.create.import.processing"));
    } catch (error) {
      console.error("Ошибка:", error);
      toast.error(t("errors.file.upload"));
      setIsProcessing(false);
      event.target.value = "";
    }
  };

  const handleUrlImport = (data: ImportedRow[], columns: string[]) => {
    setImportedData(data);
    setExcelColumns(columns);
    setShowUrlImporter(false);
    setShowColumnMapper(true);
  };

  const downloadTemplate = () => {
    const csvContent = `Номер квартиры,Этаж,Комнаты,Площадь (м²),Цена (руб),Статус
101,1,1,45.5,5500000,свободна
102,1,2,68.2,7200000,свободна
103,1,3,92.1,9800000,продана
201,2,1,44.8,5400000,свободна
202,2,2,67.5,7100000,забронирована`;

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "apartment_template.csv";
    link.click();
    toast.success(t("messages.templateDownloaded"));
  };

  const effectiveRootKind: MainProjectCreationKind = selectedKind ?? "building";

  const handleManualCreateClick = () => {
    onManualCreate(isRootFlow ? effectiveRootKind : undefined);
    handleCloseModal();
  };

  const handleCloseModal = useCallback(() => {
    setImportedData([]);
    setShowColumnMapper(false);
    setShowUrlImporter(false);
    setExcelColumns([]);
    setProgress(0);
    setIsProcessing(false);
    setImportMethod("file");
    setRootStep("kind");
    setSelectedKind(null);
    onClose();
  }, [onClose]);

  if (showColumnMapper) {
    return (
      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent
          className="max-h-[90vh] max-w-6xl overflow-y-auto"
          onPointerDownOutside={suppressDialogOutsideDismissWhileDriverTour}
          onInteractOutside={suppressDialogOutsideDismissWhileDriverTour}
        >
          <DialogHeader></DialogHeader>
          <Suspense>
            <ExcelColumnMapper
              excelColumns={excelColumns}
              importedData={importedData}
              onComplete={handleCloseModal}
              parentProjectId={parentProjectId}
              onSubProjectImportSuccess={onSubProjectImportSuccess}
              rootProjectKind={isRootFlow ? effectiveRootKind : undefined}
            />
          </Suspense>
        </DialogContent>
      </Dialog>
    );
  }

  if (showUrlImporter) {
    return (
      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent
          className="max-h-[90vh] max-w-4xl overflow-y-auto"
          onPointerDownOutside={suppressDialogOutsideDismissWhileDriverTour}
          onInteractOutside={suppressDialogOutsideDismissWhileDriverTour}
        >
          <DialogHeader>
            <div className="flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUrlImporter(false)}
                className="gap-1.5 text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("admin.back")}
              </Button>
            </div>
          </DialogHeader>
          <Suspense>
            <ExcelUrlImporter
              onDataImported={handleUrlImport}
              onClose={() => setShowUrlImporter(false)}
            />
          </Suspense>
        </DialogContent>
      </Dialog>
    );
  }

  const kindOptions: {
    id: MainProjectCreationKind;
    preview: ReactNode;
  }[] = [
    { id: "building", preview: <KindPreviewBuilding /> },
    { id: "object", preview: <KindPreviewObject /> },
    { id: "genplan", preview: <KindPreviewGenplan /> },
  ];

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent
        className="project_creation_modal_usertour max-h-[90vh] max-w-5xl overflow-y-auto border-border/80"
        onPointerDownOutside={suppressDialogOutsideDismissWhileDriverTour}
        onInteractOutside={suppressDialogOutsideDismissWhileDriverTour}
      >
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {parentProjectId
              ? t("genplan.subProjects.createFlow.title")
              : t("admin.project.create.title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isRootFlow && rootStep === "kind"
              ? t("admin.project.create.kind.stepDescription")
              : parentProjectId
                ? t("genplan.subProjects.createFlow.description")
                : t("admin.project.create.description")}
          </DialogDescription>
        </DialogHeader>

        {isRootFlow && rootStep === "kind" && (
          <div className="project_creation_kind_usertour space-y-4 py-2">
            <p className="text-sm font-medium text-foreground">
              {t("admin.project.create.kind.question")}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {kindOptions.map(({ id, preview }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (id === "genplan") {
                      onManualCreate("genplan");
                      handleCloseModal();
                      return;
                    }
                    setSelectedKind(id);
                    setRootStep("methods");
                  }}
                  className="group flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition-all hover:border-foreground/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="p-3 pb-0">{preview}</div>
                  <div className="flex items-start justify-between gap-3 p-4 pt-3">
                    <div className="min-w-0 space-y-1">
                      <div className="font-medium leading-snug">
                        {t(`admin.project.create.kind.${id}.title`)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t(`admin.project.create.kind.${id}.description`)}
                      </p>
                    </div>
                    <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {(!isRootFlow || rootStep === "methods") && (
          <div className="space-y-5 py-2">
            {isRootFlow && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setRootStep("kind");
                  setSelectedKind(null);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                {t("admin.project.create.kind.back")}
              </Button>
            )}

            {isRootFlow && selectedKind && (
              <div className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {t("admin.project.create.kind.selectedLabel")}:{" "}
                </span>
                {t(`admin.project.create.kind.${selectedKind}.title`)}
              </div>
            )}

            {/* Ручное создание */}
            <Card
              className="project_manual_create_usertour cursor-pointer border-border/80 transition-colors hover:bg-muted/40"
              onClick={handleManualCreateClick}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  {t("admin.project.create.manual.title")}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("admin.project.create.manual.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full bg-foreground text-background hover:bg-foreground/90">
                  {t("admin.project.create.manual.start")}
                </Button>
              </CardContent>
            </Card>

            {/* Импорт из Excel */}
            <Card className="project_import_excel_usertour border-border/80">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  {t("admin.project.create.import.title")}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("admin.project.create.import.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <Tabs
                  value={importMethod}
                  onValueChange={(value) =>
                    setImportMethod(value as "file" | "url")
                  }
                >
                  <TabsList className="grid h-9 w-full grid-cols-2 bg-muted/60 p-1">
                    <TabsTrigger
                      value="file"
                      className="project_import_file_tab_usertour gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
                    >
                      <Upload className="h-3.5 w-3.5 opacity-70" />
                      {t("admin.project.create.import.uploadTab")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="url"
                      className="project_import_url_tab_usertour gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
                    >
                      <Link className="h-3.5 w-3.5 opacity-70" />
                      {t("admin.project.create.import.urlTab")}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="file" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="project_import_upload_usertour h-auto w-full justify-center whitespace-normal bg-foreground py-2.5 text-center text-background hover:bg-foreground/90"
                      >
                        <Upload className="mr-2 h-4 w-4 shrink-0 opacity-90" />
                        <span className="whitespace-normal break-words">
                          {isProcessing
                            ? t("admin.project.create.import.processing")
                            : t("admin.project.create.import.uploadButton")}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={downloadTemplate}
                        className="project_import_template_usertour h-auto w-full justify-center whitespace-normal border-border py-2.5 text-center hover:bg-muted/50"
                      >
                        <Download className="mr-2 h-4 w-4 shrink-0" />
                        <span className="whitespace-normal break-words">
                          {t("admin.project.create.import.template")}
                        </span>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="project_import_demo_usertour h-auto w-full justify-center whitespace-normal border-border py-2.5 text-center hover:bg-muted/50"
                      >
                        <a href="/Demo_chess_import.csv" download>
                          <Download className="mr-2 inline h-4 w-4" />
                          {t("admin.project.create.import.demo") ||
                            "Скачать демо"}
                        </a>
                      </Button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>
                            {t("admin.project.create.import.processing")}
                          </span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5 w-full" />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="url" className="mt-4 space-y-4">
                    <Button
                      onClick={() => setShowUrlImporter(true)}
                      className="w-full bg-foreground py-2.5 text-background hover:bg-foreground/90"
                    >
                      <Link className="mr-2 h-4 w-4" />
                      {t("admin.project.create.import.byLink")}
                    </Button>

                    <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                      <p className="text-sm font-medium text-foreground">
                        {t("admin.project.create.import.benefitsTitle")}
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                          <span className="text-foreground/40">•</span>
                          {t("admin.project.create.import.benefit.sync")}
                        </li>
                        <li className="flex gap-2">
                          <span className="text-foreground/40">•</span>
                          {t("admin.project.create.import.benefit.noReupload")}
                        </li>
                        <li className="flex gap-2">
                          <span className="text-foreground/40">•</span>
                          {t("admin.project.create.import.benefit.fresh")}
                        </li>
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">
                      {t("admin.project.create.supportedFormats")}
                    </span>{" "}
                    Excel (.xlsx, .xls), CSV{" "}
                    {t("admin.project.create.googleSheets")}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium text-foreground">
                      {t("admin.project.create.requiredData.title")}
                    </span>{" "}
                    {t("admin.project.create.requiredData.fields")}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium text-foreground">
                      {t("admin.project.create.googleSheets")}
                    </span>{" "}
                    {t("admin.project.create.infoText")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCreationModal;

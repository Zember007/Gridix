import { Suspense, lazy, useRef, useState } from "react";
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
  ArrowLeft,
  Building2,
  Download,
  FileSpreadsheet,
  Link,
  Pencil,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@gridix/utils/react";

const ExcelColumnMapper = lazy(
  () =>
    import("@/features/data-import/create-project-from-excel/ui/ExcelColumnMapper"),
);
const ExcelUrlImporter = lazy(
  () => import("@/features/data-import/import-from-url/ui/ExcelUrlImporter"),
);

type ImportedCell = string | number | null | undefined;
interface ImportedRow {
  [key: string]: ImportedCell;
}

interface SubProjectImportModalProps {
  open: boolean;
  onClose: () => void;
  onManualFill: () => void;
  projectId: string;
  subProjectId: string;
}

export function SubProjectImportModal({
  open,
  onClose,
  onManualFill,
  projectId,
  subProjectId,
}: SubProjectImportModalProps) {
  const { t } = useLanguage();
  const [importedData, setImportedData] = useState<ImportedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [showUrlImporter, setShowUrlImporter] = useState(false);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [importMethod, setImportMethod] = useState<"file" | "url">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setImportedData([]);
    setShowColumnMapper(false);
    setShowUrlImporter(false);
    setExcelColumns([]);
    setProgress(0);
    setIsProcessing(false);
    setImportMethod("file");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleManualFill = () => {
    handleClose();
    onManualFill();
  };

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
          console.error("File processing error:", error);
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
      console.error("Upload error:", error);
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
    const csvContent = `Номер квартиры,Этаж,Комнаты,Площадь (м²),Цена,Статус
101,1,1,45.5,5500000,свободна
102,1,2,68.2,7200000,свободна
103,1,3,92.1,9800000,продана`;

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "apartment_template.csv";
    link.click();
    toast.success(t("messages.templateDownloaded"));
  };

  if (showColumnMapper) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader />
          <Suspense>
            <ExcelColumnMapper
              excelColumns={excelColumns}
              importedData={importedData}
              onComplete={handleClose}
              parentProjectId={projectId}
              targetSubProjectId={subProjectId}
            />
          </Suspense>
        </DialogContent>
      </Dialog>
    );
  }

  if (showUrlImporter) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <div className="flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUrlImporter(false)}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {t("genplan.subProjects.addApartments")}
          </DialogTitle>
          <DialogDescription>
            {t("genplan.subProjects.addApartmentsDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Manual fill */}
          <Card
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={handleManualFill}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Pencil className="h-4 w-4 text-primary" />
                {t("admin.project.create.manual.title")}
              </CardTitle>
              <CardDescription>
                {t("admin.project.create.manual.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" size="sm" className="w-full">
                {t("admin.project.create.manual.start")}
              </Button>
            </CardContent>
          </Card>

          {/* Excel import */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                {t("admin.project.create.import.title")}
              </CardTitle>
              <CardDescription>
                {t("admin.project.create.import.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs
                value={importMethod}
                onValueChange={(v) => setImportMethod(v as "file" | "url")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <Upload className="h-3.5 w-3.5" />
                    {t("admin.project.create.import.uploadTab")}
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Link className="h-3.5 w-3.5" />
                    {t("admin.project.create.import.urlTab")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={isProcessing}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                      {isProcessing
                        ? t("admin.project.create.import.processing")
                        : t("admin.project.create.import.uploadButton")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      {t("admin.project.create.import.template")}
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
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {t("admin.project.create.import.processing")}
                        </span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="url" className="space-y-3">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setShowUrlImporter(true)}
                  >
                    <Link className="mr-1.5 h-3.5 w-3.5" />
                    {t("admin.project.create.import.byLink")}
                  </Button>
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>
                        {t("admin.project.create.import.benefitsTitle")}
                      </strong>
                    </p>
                    <ul className="mt-1 list-inside list-disc text-xs text-blue-600 dark:text-blue-400">
                      <li>{t("admin.project.create.import.benefit.sync")}</li>
                      <li>
                        {t("admin.project.create.import.benefit.noReupload")}
                      </li>
                      <li>{t("admin.project.create.import.benefit.fresh")}</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                <strong>{t("admin.project.create.supportedFormats")}</strong>{" "}
                Excel (.xlsx, .xls), CSV
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

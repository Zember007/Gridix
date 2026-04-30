import { useState, useRef } from "react";
import { Button } from "@gridix/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import { Progress } from "@gridix/ui";
import {
  Upload,
  FileSpreadsheet,
  Link as LinkIcon,
  ArrowLeft,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import ExcelApartmentSyncMapper from "@/features/data-import/sync-apartments/ui/ExcelApartmentSyncMapper";
import ExcelUrlImporter from "@/features/data-import/import-from-url/ui/ExcelUrlImporter";
import { adminThemeClasses as admin } from "@gridix/utils/lib";
import { useLanguage } from "@gridix/utils/react";

interface ProjectApartmentsExcelSyncDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  /** Default (or current) building scope — Excel updates only apartments in this sub-project. */
  subProjectId?: string;
  projectType: "building" | "object" | null;
  onSyncDone: () => void;
}

type ImportedCell = string | number | null | undefined;
interface ImportedRow {
  [key: string]: ImportedCell;
}

const ProjectApartmentsExcelSyncDialog = ({
  open,
  onClose,
  projectId,
  subProjectId,
  projectType,
  onSyncDone,
}: ProjectApartmentsExcelSyncDialogProps) => {
  const { t } = useLanguage();
  const [importedData, setImportedData] = useState<ImportedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [showUrlImporter, setShowUrlImporter] = useState(false);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      toast.error(
        t("admin.project.create.supportedFormats") ||
          "Поддерживаемые форматы: Excel (.xlsx, .xls) и CSV",
      );
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

      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (!result) {
            toast.error(t("errors.file.read") || "Ошибка при чтении файла");
            return;
          }

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
            toast.error(t("errors.file.noData") || "Файл не содержит данных");
            return;
          }
          const worksheet = workbook.Sheets[firstSheetName];
          if (!worksheet) {
            toast.error(t("errors.file.noData") || "Файл не содержит данных");
            return;
          }

          const jsonData = XLSX.utils.sheet_to_json<ImportedRow>(worksheet, {
            defval: "",
          });

          if (jsonData.length === 0) {
            toast.error(t("errors.file.noData") || "Файл не содержит данных");
            setIsProcessing(false);
            return;
          }

          const firstRow = jsonData[0];
          if (!firstRow) {
            toast.error(t("errors.file.noData") || "Файл не содержит данных");
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
            (
              t("messages.fileProcessed") ||
              "Файл обработан! Найдено {{count}} записей"
            ).replace("{{count}}", String(jsonData.length)),
          );
        } catch (error) {
          console.error("File processing error:", error);
          toast.error(t("errors.file.process") || "Ошибка при обработке файла");
        } finally {
          clearInterval(progressInterval);
          setIsProcessing(false);
          event.target.value = "";
        }
      };

      reader.onerror = () => {
        toast.error(t("errors.file.read") || "Ошибка при чтении файла");
        clearInterval(progressInterval);
        setIsProcessing(false);
        event.target.value = "";
      };

      if (isCsv) {
        reader.readAsText(file, "UTF-8");
      } else {
        reader.readAsArrayBuffer(file);
      }

      toast.info(
        t("admin.project.create.import.processing") || "Обработка файла...",
      );
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t("errors.file.upload") || "Ошибка при загрузке файла");
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

  const handleCloseModal = () => {
    setImportedData([]);
    setShowColumnMapper(false);
    setShowUrlImporter(false);
    setExcelColumns([]);
    setProgress(0);
    setIsProcessing(false);
    onClose();
  };

  if (showColumnMapper) {
    return (
      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <div className="flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowColumnMapper(false);
                  setImportedData([]);
                  setExcelColumns([]);
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back") || "Назад"}
              </Button>
            </div>
          </DialogHeader>
          <ExcelApartmentSyncMapper
            projectId={projectId}
            subProjectId={subProjectId}
            projectType={projectType}
            excelColumns={excelColumns}
            importedData={importedData}
            onComplete={handleCloseModal}
            onSyncDone={onSyncDone}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (showUrlImporter) {
    return (
      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <div className="flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUrlImporter(false)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back") || "Назад"}
              </Button>
            </div>
          </DialogHeader>
          <ExcelUrlImporter
            onDataImported={handleUrlImport}
            onClose={() => setShowUrlImporter(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-2xl gap-8 p-8">
        <DialogHeader className="space-y-3 text-left">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold leading-tight tracking-tight">
            <FileSpreadsheet
              className="h-8 w-8 shrink-0 text-[var(--admin-primary)]"
              aria-hidden
            />
            {t("excel.sync.dialog.title")}
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {t("excel.sync.dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className={`h-12 w-full shrink-0 ${admin.primary} ${admin.primaryHover}`}
            >
              <Upload className="mr-2 h-4 w-4" aria-hidden />
              {isProcessing
                ? t("admin.project.create.import.processing") || "Обработка..."
                : t("admin.project.create.import.uploadButton") ||
                  "Загрузить Excel файл"}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            {isProcessing && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {t("admin.project.create.import.processing") ||
                      "Обработка файла..."}
                  </span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="h-12 w-full shrink-0"
              disabled={isProcessing}
              onClick={() => setShowUrlImporter(true)}
            >
              <LinkIcon className="mr-2 h-4 w-4" aria-hidden />
              {t("excel.sync.import.secondaryLink")}
            </Button>
          </div>

          <div className="space-y-4 border-t border-border/60 pt-8 text-sm">
            <p className="leading-relaxed text-muted-foreground">
              {t("excel.sync.import.formatsNote")}
            </p>
            <aside
              className="flex gap-3 rounded-lg border border-border/80 bg-muted/35 p-4 text-foreground/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              role="note"
            >
              <Lightbulb
                className="mt-0.5 h-5 w-5 shrink-0 text-real-estate-600"
                aria-hidden
              />
              <p className="min-w-0 flex-1 leading-relaxed">
                <span className="sr-only">
                  {t("excel.sync.import.tipLabel")}{" "}
                </span>
                {t("excel.sync.import.updateRuleNote")}
              </p>
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectApartmentsExcelSyncDialog;

import { useState, useRef } from "react";
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
  Building2,
  Download,
  Link,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import ExcelColumnMapper from "@/components/data-import/ExcelColumnMapper";
import ExcelUrlImporter from "@/components/data-import/ExcelUrlImporter";
import * as XLSX from "xlsx";
import { adminThemeClasses as admin } from "@gridix/utils/lib";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProjectCreationModalProps {
  open: boolean;
  onClose: () => void;
  onManualCreate: () => void;
}

type ImportedCell = string | number | null | undefined;
interface ImportedRow {
  [key: string]: ImportedCell;
}

const ProjectCreationModal = ({
  open,
  onClose,
  onManualCreate,
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

      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (!result) {
            toast.error(t("errors.file.read"));
            return;
          }

          // CSV читаем как string, Excel как ArrayBuffer
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

          // Читаем данные как JSON с первой строкой в качестве заголовков
          const jsonData = XLSX.utils.sheet_to_json<ImportedRow>(worksheet, {
            defval: "", // Заполняем пустые ячейки пустой строкой
          });

          if (jsonData.length === 0) {
            console.log("jsonData", worksheet);

            toast.error(t("errors.file.noData"));
            setIsProcessing(false);
            return;
          }

          // Получаем заголовки из первой записи
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
          // чтобы onChange сработал при выборе того же файла повторно
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

  const handleManualCreateClick = () => {
    onManualCreate();
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setImportedData([]);
    setShowColumnMapper(false);
    setShowUrlImporter(false);
    setExcelColumns([]);
    setProgress(0);
    setIsProcessing(false);
    setImportMethod("file");
    onClose();
  };

  if (showColumnMapper) {
    return (
      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader></DialogHeader>
          <ExcelColumnMapper
            excelColumns={excelColumns}
            importedData={importedData}
            onComplete={handleCloseModal}
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
                <ArrowLeft className="h-4 w-4" />
                {t("admin.back")}
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
      <DialogContent className="project_creation_modal_usertour max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-real-estate-600" />
            {t("admin.project.create.title")}
          </DialogTitle>
          <DialogDescription>
            {t("admin.project.create.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Ручное создание */}
          <Card
            className="project_manual_create_usertour cursor-pointer transition-colors hover:bg-real-estate-50"
            onClick={handleManualCreateClick}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-real-estate-600" />
                {t("admin.project.create.manual.title")}
              </CardTitle>
              <CardDescription>
                {t("admin.project.create.manual.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className={`w-full ${admin.primary} ${admin.primaryHover}`}
              >
                {t("admin.project.create.manual.start")}
              </Button>
            </CardContent>
          </Card>

          {/* Импорт из Excel */}
          <Card className="project_import_excel_usertour">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-real-estate-600" />
                {t("admin.project.create.import.title")}
              </CardTitle>
              <CardDescription>
                {t("admin.project.create.import.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs
                value={importMethod}
                onValueChange={(value) =>
                  setImportMethod(value as "file" | "url")
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="file"
                    className="project_import_file_tab_usertour flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {t("admin.project.create.import.uploadTab")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="url"
                    className="project_import_url_tab_usertour flex items-center gap-2"
                  >
                    <Link className="h-4 w-4" />
                    {t("admin.project.create.import.urlTab")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className={`${admin.primary} ${admin.primaryHover} project_import_upload_usertour h-auto w-full justify-center whitespace-normal py-2 text-center`}
                    >
                      <Upload className="mr-2 h-4 w-4 shrink-0" />
                      <span className="whitespace-normal break-words">
                        {isProcessing
                          ? t("admin.project.create.import.processing")
                          : t("admin.project.create.import.uploadButton")}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadTemplate}
                      className="project_import_template_usertour h-auto w-full justify-center whitespace-normal border-real-estate-300 py-2 text-center text-real-estate-600 hover:bg-real-estate-50"
                    >
                      <Download className="mr-2 h-4 w-4 shrink-0" />
                      <span className="whitespace-normal break-words">
                        {t("admin.project.create.import.template")}
                      </span>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="project_import_demo_usertour h-auto w-full justify-center whitespace-normal py-2 text-center"
                    >
                      <a href="/Demo_chess_import.csv" download>
                        <Download className="mr-2 h-4 w-4" />
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
                      <div className="flex justify-between text-sm">
                        <span>
                          {t("admin.project.create.import.processing")}
                        </span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <Button
                    onClick={() => setShowUrlImporter(true)}
                    className={`w-full ${admin.primary} ${admin.primaryHover}`}
                  >
                    <Link className="mr-2 h-4 w-4" />
                    {t("admin.project.create.import.byLink")}
                  </Button>

                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-sm text-blue-700">
                      <strong>
                        {t("admin.project.create.import.benefitsTitle")}
                      </strong>
                    </p>
                    <ul className="mt-1 list-inside list-disc text-sm text-blue-600">
                      <li>{t("admin.project.create.import.benefit.sync")}</li>
                      <li>
                        {t("admin.project.create.import.benefit.noReupload")}
                      </li>
                      <li>{t("admin.project.create.import.benefit.fresh")}</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="rounded-md bg-real-estate-50 p-3 text-sm text-real-estate-600">
                <p>
                  <strong>{t("admin.project.create.supportedFormats")}</strong>{" "}
                  Excel (.xlsx, .xls), CSV{" "}
                  {t("admin.project.create.googleSheets")}
                </p>
                <p>
                  <strong>
                    {t("admin.project.create.requiredData.title")}
                  </strong>{" "}
                  {t("admin.project.create.requiredData.fields")}
                </p>
                <p>
                  <strong>{t("admin.project.create.googleSheets")}</strong>{" "}
                  {t("admin.project.create.infoText")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCreationModal;

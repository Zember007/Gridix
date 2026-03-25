import { useState } from "react";
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Switch } from "@gridix/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import {
  AlertCircle,
  Link,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  convertGoogleSheetsUrl,
  isGoogleSheetsUrl,
  validateGoogleSheetsAccess,
  getGoogleSheetsInstructions,
} from "@gridix/utils/lib";
import { useLanguage } from "@/contexts/LanguageContext";
import { adminThemeClasses as admin } from "@gridix/utils/lib";

interface ExcelUrlImporterProps {
  onDataImported: (data: any[], columns: string[]) => void;
  onClose: () => void;
}

const ExcelUrlImporter = ({
  onDataImported,
  onClose,
}: ExcelUrlImporterProps) => {
  const { t } = useLanguage();
  const [excelUrl, setExcelUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [testConnection, setTestConnection] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [urlType, setUrlType] = useState<"unknown" | "excel" | "google_sheets">(
    "unknown",
  );
  const [showInstructions, setShowInstructions] = useState(false);

  // Определяем тип URL при изменении
  const handleUrlChange = (url: string) => {
    setExcelUrl(url);
    setTestConnection("idle");

    if (!url.trim()) {
      setUrlType("unknown");
      return;
    }

    if (isGoogleSheetsUrl(url)) {
      setUrlType("google_sheets");
    } else {
      setUrlType("excel");
    }
  };

  const testExcelConnection = async () => {
    if (!excelUrl.trim()) {
      toast.error(t("excel.url.toast.enterLink"));
      return;
    }

    setTestConnection("testing");
    try {
      let urlToTest = excelUrl;

      // Если это Google Sheets, преобразуем URL
      if (isGoogleSheetsUrl(excelUrl)) {
        const validation = await validateGoogleSheetsAccess(excelUrl);
        if (!validation.isAccessible) {
          setTestConnection("error");
          toast.error(validation.error || t("excel.url.toast.checkError"));
          setShowInstructions(true);
          return;
        }
        urlToTest = validation.convertedUrl!;
      }

      const response = await fetch(urlToTest, {
        method: "HEAD",
        mode: "cors",
      });

      if (response.ok) {
        setTestConnection("success");
        if (urlType === "google_sheets") {
          toast.success(t("excel.url.toast.gsAccessible"));
        } else {
          toast.success(t("excel.url.toast.linkAccessible"));
        }
      } else {
        setTestConnection("error");
        toast.error(t("excel.url.toast.fileInaccessible"));
      }
    } catch (error) {
      setTestConnection("error");
      toast.error(t("excel.url.toast.checkError"));
    }
  };

  const importFromUrl = async () => {
    if (!excelUrl.trim()) {
      toast.error(t("excel.url.toast.enterLink"));
      return;
    }

    setIsLoading(true);
    try {
      let urlToFetch = excelUrl;

      // Если это Google Sheets, преобразуем URL для экспорта
      if (isGoogleSheetsUrl(excelUrl)) {
        try {
          urlToFetch = convertGoogleSheetsUrl(excelUrl);
        } catch (error) {
          toast.error(t("excel.url.toast.invalidGs"));
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch(urlToFetch);

      if (!response.ok) {
        throw new Error(t("excel.url.toast.fetchFailed"));
      }

      const arrayBuffer = await response.arrayBuffer();
      // Добавляем опции для правильного чтения чисел

      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error(t("errors.file.noData"));
      }
      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) {
        throw new Error(t("errors.file.noData"));
      }

      // Читаем данные как JSON с первой строкой в качестве заголовков
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: "", // Заполняем пустые ячейки пустой строкой
      }) as any[];

      if (jsonData.length === 0) {
        toast.error(t("errors.file.noData"));
        return;
      }

      // Получаем заголовки из первой записи
      const headers = Object.keys(jsonData[0]).filter(
        (header) => header.trim() !== "",
      );

      onDataImported(jsonData, headers);
      toast.success(t("excel.url.importedCount", { count: jsonData.length }));
    } catch (error) {
      console.error("Ошибка импорта:", error);
      toast.error(t("errors.file.process"));
    } finally {
      setIsLoading(false);
    }
  };

  const getSyncIntervalLabel = (seconds: string) => {
    const sec = parseInt(seconds);
    if (sec < 60) return `${sec} секунд`;
    if (sec < 3600) return `${Math.floor(sec / 60)} минут`;
    return `${Math.floor(sec / 3600)} часов`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {urlType === "google_sheets" ? (
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
            ) : (
              <Link className="h-5 w-5 text-real-estate-600" />
            )}
            {urlType === "google_sheets"
              ? t("excel.url.title.googleSheets")
              : t("excel.url.title.link")}
          </CardTitle>
          <CardDescription>
            {urlType === "google_sheets"
              ? t("excel.url.desc.googleSheets")
              : t("excel.url.desc.link")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="excel-url">
              {urlType === "google_sheets"
                ? t("excel.url.input.gs")
                : t("excel.url.input.excel")}
            </Label>
            <div className="mt-1 flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="excel-url"
                  value={excelUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder={
                    urlType === "google_sheets"
                      ? "https://docs.google.com/spreadsheets/d/..."
                      : "https://example.com/data.xlsx"
                  }
                  className="pr-10"
                />
                {urlType === "google_sheets" && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                onClick={testExcelConnection}
                disabled={testConnection === "testing"}
                className="shrink-0"
              >
                {testConnection === "testing" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  t("excel.url.check")
                )}
              </Button>
            </div>
            {testConnection === "success" && (
              <p className="mt-1 text-sm text-green-600">
                {t("excel.url.link.ok")}
              </p>
            )}
            {testConnection === "error" && (
              <p className="mt-1 text-sm text-red-600">
                {t("excel.url.link.fail")}
              </p>
            )}
          </div>

          {/* Динамические инструкции в зависимости от типа URL */}
          {urlType === "google_sheets" ? (
            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex gap-2">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div className="text-sm">
                  <p className="font-medium text-green-800">
                    {t("excel.url.detectedGs")}
                  </p>
                  <p className="mt-1 text-green-700">
                    {t("excel.url.autoConvert")}
                  </p>
                  {showInstructions && (
                    <div className="mt-3 rounded border bg-white p-3">
                      <p className="mb-2 font-medium text-gray-800">
                        {t("excel.url.howToSetup")}
                      </p>
                      <ol className="list-inside list-decimal space-y-1 text-xs text-gray-700">
                        <li>Откройте ваш Google Sheets документ</li>
                        <li>Нажмите "Поделиться" → "Изменить доступ"</li>
                        <li>Выберите "Доступен всем в интернете"</li>
                        <li>Режим доступа: "Читатель"</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-amber-50 p-4">
              <div className="flex gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">
                    {t("excel.url.req.title")}
                  </p>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-amber-700">
                    <li>{t("excel.url.req.p1")}</li>
                    <li>{t("excel.url.req.p2")}</li>
                    <li>{t("excel.url.req.p3")}</li>
                    <li>{t("excel.url.req.p4")}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={importFromUrl}
              disabled={isLoading || !excelUrl.trim()}
              className={`flex-1 ${admin.primary} ${admin.primaryHover}`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t("excel.url.importing")}
                </>
              ) : (
                <>
                  {urlType === "google_sheets" ? (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  ) : (
                    <Link className="mr-2 h-4 w-4" />
                  )}
                  {t("excel.url.importData")}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExcelUrlImporter;

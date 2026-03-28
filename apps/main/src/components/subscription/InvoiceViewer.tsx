import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Badge } from "@gridix/ui";
import { Alert, AlertDescription } from "@gridix/ui";
import {
  FileText,
  Download,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface InvoiceViewerProps {
  invoice: {
    id: string;
    invoice_number: string | null;
    invoice_url: string | null;
    invoice_generated_at: string | null;
    invoice_paid_at: string | null;
    status: string;
    final_price: number | null;
    payment_purpose: string | null;
    duration_months: number | null;
    subscription_plans?: {
      name: string;
    };
    projects?: {
      name: string;
    };
  };
  onDownload?: () => void;
}

export function InvoiceViewer({ invoice, onDownload }: InvoiceViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { t, language } = useLanguage();

  const handleDownload = async () => {
    if (!invoice.invoice_url) return;

    setIsDownloading(true);
    try {
      // Open PDF in new tab for download
      window.open(invoice.invoice_url, "_blank");
      onDownload?.();
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="mr-1 h-3 w-3" />
            {t("invoice.status.paid")}
          </Badge>
        );
      case "pending_payment":
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="mr-1 h-3 w-3" />
            {t("invoice.status.pending_payment")}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const localeMap: Record<string, string> = {
      ru: "ru-RU",
      tr: "tr-TR",
      he: "he-IL",
      ar: "ar",
      ka: "ka-GE",
      en: "en-US",
    };
    return new Date(dateString).toLocaleDateString(
      localeMap[language] || "en-US",
    );
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "—";
    return `${price.toFixed(2)} GEL`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("invoice.invoice_viewer.title")}
              </CardTitle>
              <CardDescription>
                {invoice.invoice_number ||
                  t("invoice.invoice_viewer.invoice_number_unassigned")}
              </CardDescription>
            </div>
            {getStatusBadge(invoice.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invoice Details */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {t("invoice.invoice_viewer.created_date")}:
                </span>
                <span>{formatDate(invoice.invoice_generated_at)}</span>
              </div>

              {invoice.invoice_paid_at && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">
                    {t("invoice.invoice_viewer.paid_date")}:
                  </span>
                  <span>{formatDate(invoice.invoice_paid_at)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {t("invoice.invoice_viewer.amount")}:
                </span>
                <span className="font-semibold">
                  {formatPrice(invoice.final_price)}
                </span>
              </div>

              {invoice.duration_months && (
                <div className="text-sm text-muted-foreground">
                  {t("invoice.invoice_viewer.duration")}:{" "}
                  {invoice.duration_months}{" "}
                  {t("invoice.invoice_viewer.months_short")}
                </div>
              )}
            </div>
          </div>

          {/* Service Details */}
          {(invoice.subscription_plans || invoice.projects) && (
            <div className="border-t pt-4">
              <h4 className="mb-2 font-medium">
                {t("invoice.invoice_viewer.service_details")}
              </h4>
              <div className="space-y-1 text-sm">
                {invoice.subscription_plans && (
                  <div>
                    <span className="text-muted-foreground">
                      {t("invoice.invoice_viewer.plan")}:
                    </span>{" "}
                    {invoice.subscription_plans.name}
                  </div>
                )}
                {invoice.projects && (
                  <div>
                    <span className="text-muted-foreground">
                      {t("invoice.invoice_viewer.project")}:
                    </span>{" "}
                    {invoice.projects.name}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Purpose */}
          {invoice.payment_purpose && (
            <div className="border-t pt-4">
              <h4 className="mb-2 font-medium">
                {t("invoice.invoice_viewer.payment_purpose")}
              </h4>
              <p className="text-sm text-muted-foreground">
                {invoice.payment_purpose}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-3">
              {invoice.invoice_url ? (
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading
                    ? t("invoice.invoice_viewer.downloading")
                    : t("invoice.invoice_viewer.download_pdf")}
                </Button>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t("invoice.invoice_viewer.not_generated")}
                  </AlertDescription>
                </Alert>
              )}

              {invoice.invoice_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(invoice.invoice_url!, "_blank")}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("invoice.invoice_viewer.open_pdf")}
                </Button>
              )}
            </div>
          </div>

          {/* Payment Instructions */}
          {invoice.status === "pending_payment" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    {t("invoice.invoice_viewer.payment_instructions")}:
                  </p>
                  <ol className="list-inside list-decimal space-y-1 text-sm">
                    {(
                      t("invoice.invoice_viewer.instructions_list", {
                        returnObjects: true,
                      }) as string[]
                    ).map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ol>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("invoice.invoice_viewer.support_contact")}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

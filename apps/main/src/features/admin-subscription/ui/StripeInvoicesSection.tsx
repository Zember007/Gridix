import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Receipt } from "lucide-react";
import {
  Button,
  Skeleton,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchStripeInvoices,
  StripeInvoiceItem,
} from "@/entities/subscription/api/subscriptionApi";

interface StripeInvoicesSectionProps {
  title?: string;
}

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    open: "bg-yellow-100 text-yellow-700",
    draft: "bg-slate-100 text-slate-500",
    uncollectible: "bg-red-100 text-red-700",
    void: "bg-slate-100 text-slate-400",
  };
  return map[status] ?? "bg-slate-100 text-slate-500";
};

const tableFrameClass =
  "border-border/70 text-card-foreground min-w-0 w-full overflow-hidden rounded-lg border bg-white shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]";

export const StripeInvoicesSection: React.FC<StripeInvoicesSectionProps> = ({
  title,
}) => {
  const { t, language } = useLanguage();
  const [invoices, setInvoices] = useState<StripeInvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const dateLocale = useMemo(() => {
    switch (language) {
      case "ru":
        return "ru-RU";
      case "tr":
        return "tr-TR";
      case "he":
        return "he-IL";
      case "ar":
        return "ar";
      case "ka":
        return "ka-GE";
      default:
        return "en-US";
    }
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchStripeInvoices();
        if (!cancelled) setInvoices(result.invoices ?? []);
      } catch {
        // silently ignore — section simply won't render
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const heading =
    title ||
    t("admin.subscriptionPage.stripeInvoices.title") ||
    "Stripe Invoices";
  const numberLabel = t("admin.subscriptionPage.stripeInvoices.number") || "#";
  const dateLabel = t("admin.subscriptionPage.stripeInvoices.date") || "Date";
  const amountLabel =
    t("admin.subscriptionPage.stripeInvoices.amount") || "Amount";
  const statusLabel =
    t("admin.subscriptionPage.stripeInvoices.status") || "Status";

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">{heading}</h2>
        <div className={tableFrameClass}>
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-left text-sm">
              <TableHeader className="bg-slate-50/50 text-xs font-bold uppercase text-slate-500">
                <TableRow>
                  <TableHead>{numberLabel}</TableHead>
                  <TableHead>{dateLabel}</TableHead>
                  <TableHead>{amountLabel}</TableHead>
                  <TableHead>{statusLabel}</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </table>
          </div>
        </div>
      </section>
    );
  }

  if (invoices.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900">{heading}</h2>
      <div className={tableFrameClass}>
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-left text-sm">
            <TableHeader className="bg-slate-50/50 text-xs font-bold uppercase text-slate-500">
              <TableRow>
                <TableHead>{numberLabel}</TableHead>
                <TableHead>{dateLabel}</TableHead>
                <TableHead>{amountLabel}</TableHead>
                <TableHead>{statusLabel}</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="group transition-colors hover:bg-slate-50"
                >
                  <TableCell className="whitespace-nowrap font-medium text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Receipt size={14} className="text-slate-400" />
                      {inv.number || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-slate-600">
                    {new Date(inv.created * 1000).toLocaleDateString(
                      dateLocale,
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium text-slate-800">
                    {(inv.total / 100).toFixed(2)} {inv.currency.toUpperCase()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${statusBadgeClass(inv.status)}`}
                    >
                      {inv.status}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {inv.hosted_invoice_url ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="inline-flex items-center gap-1.5 text-xs"
                          onClick={() =>
                            window.open(inv.hosted_invoice_url!, "_blank")
                          }
                        >
                          <ExternalLink size={12} />
                          {t("admin.subscriptionPage.stripeInvoices.view") ||
                            "View"}
                        </Button>
                      ) : null}
                      {inv.invoice_pdf ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="inline-flex items-center gap-1.5 text-xs"
                          onClick={() =>
                            window.open(inv.invoice_pdf!, "_blank")
                          }
                        >
                          <FileText size={12} />
                          {t("admin.subscriptionPage.stripeInvoices.viewPdf") ||
                            "PDF"}
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </table>
        </div>
      </div>
    </section>
  );
};

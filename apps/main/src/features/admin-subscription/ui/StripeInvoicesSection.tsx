import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Receipt } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Skeleton,
  Table,
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

  if (loading) {
    const heading =
      title ||
      t("admin.subscriptionPage.stripeInvoices.title") ||
      "Stripe Invoices";
    const numberLabel =
      t("admin.subscriptionPage.stripeInvoices.number") || "#";
    const dateLabel = t("admin.subscriptionPage.stripeInvoices.date") || "Date";
    const amountLabel =
      t("admin.subscriptionPage.stripeInvoices.amount") || "Amount";
    const statusLabel =
      t("admin.subscriptionPage.stripeInvoices.status") || "Status";

    return (
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">{heading}</h2>
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 lg:hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-36 rounded-xl border border-slate-100"
                />
              ))}
            </div>
            <div className="hidden min-w-0 lg:block">
              <Table className="w-full text-left text-sm">
                <TableHeader className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-500">
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
                    <TableRow key={i} className="border-b border-slate-50">
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
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (invoices.length === 0) return null;

  const numberLabel = t("admin.subscriptionPage.stripeInvoices.number") || "#";
  const dateLabel = t("admin.subscriptionPage.stripeInvoices.date") || "Date";
  const amountLabel =
    t("admin.subscriptionPage.stripeInvoices.amount") || "Amount";
  const statusLabel =
    t("admin.subscriptionPage.stripeInvoices.status") || "Status";

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">
        {title ||
          t("admin.subscriptionPage.stripeInvoices.title") ||
          "Stripe Invoices"}
      </h2>
      <Card className="min-w-0 overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3 lg:hidden">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-slate-900">
                      <Receipt size={14} className="shrink-0 text-slate-400" />
                      <span className="truncate">{inv.number || "—"}</span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${statusBadgeClass(inv.status)}`}
                  >
                    {inv.status}
                  </span>
                </div>

                <dl className="mt-3 divide-y divide-slate-100">
                  <div className="flex flex-col gap-1 py-3 first:pt-0">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {dateLabel}
                    </dt>
                    <dd className="text-sm font-medium text-slate-800">
                      {new Date(inv.created * 1000).toLocaleDateString(
                        dateLocale,
                      )}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 py-3">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {amountLabel}
                    </dt>
                    <dd className="font-mono text-sm font-bold text-slate-900">
                      {(inv.total / 100).toFixed(2)}{" "}
                      {inv.currency.toUpperCase()}
                    </dd>
                  </div>
                </dl>

                {(inv.hosted_invoice_url || inv.invoice_pdf) && (
                  <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3">
                    {inv.hosted_invoice_url && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="inline-flex w-full items-center justify-center gap-1.5 text-xs"
                        onClick={() =>
                          window.open(inv.hosted_invoice_url!, "_blank")
                        }
                      >
                        <ExternalLink size={12} />
                        {t("admin.subscriptionPage.stripeInvoices.view") ||
                          "View"}
                      </Button>
                    )}
                    {inv.invoice_pdf && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="inline-flex w-full items-center justify-center gap-1.5 text-xs"
                        onClick={() => window.open(inv.invoice_pdf!, "_blank")}
                      >
                        <FileText size={12} />
                        PDF
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden min-w-0 lg:block">
            <Table className="w-full text-left text-sm">
              <TableHeader className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-500">
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
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
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
                      {(inv.total / 100).toFixed(2)}{" "}
                      {inv.currency.toUpperCase()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${statusBadgeClass(inv.status)}`}
                      >
                        {inv.status}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {inv.hosted_invoice_url && (
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
                      )}
                      {inv.invoice_pdf && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="ml-2 inline-flex items-center gap-1.5 text-xs"
                          onClick={() =>
                            window.open(inv.invoice_pdf!, "_blank")
                          }
                        >
                          <FileText size={12} />
                          PDF
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

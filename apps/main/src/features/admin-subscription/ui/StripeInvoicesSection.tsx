import React, { useEffect, useState } from "react";
import { ExternalLink, FileText, Loader2, Receipt } from "lucide-react";
import { Button } from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchStripeInvoices,
  StripeInvoiceItem,
} from "@/entities/subscription/api/subscriptionApi";

interface StripeInvoicesSectionProps {
  title?: string;
}

export const StripeInvoicesSection: React.FC<StripeInvoicesSectionProps> = ({
  title,
}) => {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<StripeInvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

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
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          {title ||
            t("admin.subscriptionPage.stripeInvoices.title") ||
            "Stripe Invoices"}
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-slate-400" />
        </div>
      </section>
    );
  }

  if (invoices.length === 0) return null;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: "bg-green-100 text-green-700",
      open: "bg-yellow-100 text-yellow-700",
      draft: "bg-slate-100 text-slate-500",
      uncollectible: "bg-red-100 text-red-700",
      void: "bg-slate-100 text-slate-400",
    };
    return map[status] ?? "bg-slate-100 text-slate-500";
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">
        {title ||
          t("admin.subscriptionPage.stripeInvoices.title") ||
          "Stripe Invoices"}
      </h2>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">
                  {t("admin.subscriptionPage.stripeInvoices.number") || "#"}
                </th>
                <th className="px-5 py-3">
                  {t("admin.subscriptionPage.stripeInvoices.date") || "Date"}
                </th>
                <th className="px-5 py-3">
                  {t("admin.subscriptionPage.stripeInvoices.amount") ||
                    "Amount"}
                </th>
                <th className="px-5 py-3">
                  {t("admin.subscriptionPage.stripeInvoices.status") ||
                    "Status"}
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                >
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Receipt size={14} className="text-slate-400" />
                      {inv.number || "—"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                    {new Date(inv.created * 1000).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800">
                    {(inv.total / 100).toFixed(2)} {inv.currency.toUpperCase()}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${statusBadge(inv.status)}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
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
                        onClick={() => window.open(inv.invoice_pdf!, "_blank")}
                      >
                        <FileText size={12} />
                        PDF
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

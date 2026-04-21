import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText as FileTextIcon,
  CreditCard,
  ShieldCheck,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gridix/ui";
import {
  SubscriptionOrder,
  ProjectSubscription,
} from "@/entities/subscription/queries/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";

interface OrderHistoryProps {
  orders: SubscriptionOrder[];
  projects: ProjectSubscription[];
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  projects,
}) => {
  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");
  const { t, language } = useLanguage();

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const statusMatches =
          filter === "all"
            ? true
            : filter === "paid"
              ? order.status === "paid" || order.status === "admin_granted"
              : order.status === "pending" ||
                order.status === "pending_payment";

        return statusMatches;
      }),
    [orders, filter],
  );

  const getProjectNames = (ids: string[]) =>
    ids.map((id) => projects.find((p) => p.id === id)?.name || id).join(", ");

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

  const getStatusConfig = (status: string) => {
    if (status === "paid" || status === "admin_granted") {
      return {
        label: t("admin.subscriptionPage.history.status.paid"),
        className: "bg-green-50 text-green-700 border-green-200",
        icon: <CheckCircle2 size={14} />,
      };
    }
    if (status === "pending" || status === "pending_payment") {
      return {
        label: t("admin.subscriptionPage.history.status.pending"),
        className: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <Clock size={14} />,
      };
    }
    if (status === "cancelled") {
      return {
        label: t("admin.subscriptionPage.history.status.cancelled"),
        className: "bg-red-50 text-red-700 border-red-200",
        icon: <AlertCircle size={14} />,
      };
    }
    return {
      label: status,
      className: "bg-slate-50 text-slate-700 border-slate-200",
      icon: null,
    };
  };

  const getMethodIcon = (method?: string | null) => {
    if (method === "invoice") {
      return <FileTextIcon size={16} className="text-slate-600" />;
    }
    if (method === "card") {
      return <CreditCard size={16} className="text-blue-600" />;
    }
    if (method === "manual") {
      return <ShieldCheck size={16} className="text-purple-600" />;
    }
    return <CreditCard size={16} />;
  };

  const getPaymentMethodLabel = (method?: string | null) => {
    if (method === "invoice" || !method) {
      return t("admin.subscriptionPage.history.methodLabels.invoice");
    }

    if (method === "card") {
      return t("admin.subscriptionPage.history.methodLabels.card");
    }

    if (method === "manual") {
      return t("admin.subscriptionPage.history.methodLabels.manual");
    }

    return t("admin.subscriptionPage.history.methodLabels.unknown");
  };

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex flex-col gap-4 space-y-0 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="mb-0 text-lg font-bold text-slate-900">
          {t("admin.subscriptionPage.history.title")}
        </CardTitle>

        <div className="no-scrollbar flex w-full min-w-0 overflow-x-auto sm:w-auto sm:justify-end">
          <div className="inline-flex shrink-0 rounded-lg bg-slate-100 p-1">
            {(["all", "paid", "pending"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-md px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                  filter === f
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f === "all"
                  ? t("admin.subscriptionPage.history.filters.all")
                  : f === "paid"
                    ? t("admin.subscriptionPage.history.filters.paid")
                    : t("admin.subscriptionPage.history.filters.pending")}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        {filteredOrders.length > 0 && (
          <>
            <div className="space-y-3 lg:hidden">
              {filteredOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                const projectLabel = getProjectNames(order.projectIds);
                return (
                  <div
                    key={order.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900">
                          {order.date
                            ? new Date(order.date).toLocaleDateString(
                                dateLocale,
                              )
                            : "—"}
                        </div>
                        <div className="mt-1 break-all font-mono text-xs leading-snug text-slate-500">
                          {order.id}
                        </div>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${statusConfig.className}`}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>

                    <dl className="mt-3 divide-y divide-slate-100">
                      <div className="flex min-w-0 flex-col gap-1 py-3 first:pt-0">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {t("admin.subscriptionPage.history.table.projects")}
                        </dt>
                        <dd className="min-w-0 text-sm font-medium text-slate-800">
                          {projectLabel || (
                            <span className="italic text-slate-400">
                              {t(
                                "admin.subscriptionPage.history.unknownProject",
                              )}
                            </span>
                          )}
                          <span className="mt-0.5 block text-xs font-normal text-slate-500">
                            {t("admin.subscriptionPage.history.projectsCount", {
                              count: order.projectIds.length,
                            })}
                          </span>
                        </dd>
                      </div>
                      <div className="flex flex-col gap-1 py-3">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {t("admin.subscriptionPage.history.table.tariff")}
                        </dt>
                        <dd className="text-sm text-slate-800">
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase text-slate-700">
                            {order.planName || "—"}
                          </span>
                          {order.durationMonths ? (
                            <span className="mt-1 block text-xs text-slate-500">
                              {order.durationMonths}{" "}
                              {order.durationMonths === 1
                                ? t(
                                    "admin.subscriptionPage.pricing.monthsShort",
                                  )
                                : t(
                                    "admin.subscriptionPage.pricing.monthsShortPlural",
                                  )}
                            </span>
                          ) : null}
                        </dd>
                      </div>
                      <div className="flex flex-col gap-1 py-3">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {t("admin.subscriptionPage.history.table.method")}
                        </dt>
                        <dd
                          className="flex items-center justify-start gap-2 text-sm text-slate-700"
                          title={getPaymentMethodLabel(order.paymentMethod)}
                        >
                          {getMethodIcon(order.paymentMethod)}
                          <span>
                            {getPaymentMethodLabel(order.paymentMethod)}
                          </span>
                        </dd>
                      </div>
                      <div className="flex flex-col gap-1 py-3 last:pb-0">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {t("admin.subscriptionPage.history.table.amount")}
                        </dt>
                        <dd className="font-mono text-sm font-bold text-slate-900">
                          {order.amount != null
                            ? `$${order.amount.toLocaleString()}`
                            : "—"}
                        </dd>
                      </div>
                    </dl>

                    {order.invoiceUrl ? (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <a
                          href={order.invoiceUrl}
                          download={`Invoice-${order.id}.pdf`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <Download size={16} />
                          {t("admin.subscriptionPage.history.downloadInvoice")}
                        </a>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="hidden min-w-0 lg:block">
              <Table className="w-full text-left">
                <TableHeader className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase text-slate-500">
                  <TableRow>
                    <TableHead>
                      {t("admin.subscriptionPage.history.table.date")}
                    </TableHead>
                    <TableHead>
                      {t("admin.subscriptionPage.history.table.projects")}
                    </TableHead>
                    <TableHead>
                      {t("admin.subscriptionPage.history.table.tariff")}
                    </TableHead>
                    <TableHead>
                      {t("admin.subscriptionPage.history.table.method")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("admin.subscriptionPage.history.table.amount")}
                    </TableHead>
                    <TableHead className="text-center">
                      {t("admin.subscriptionPage.history.table.status")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("admin.subscriptionPage.history.table.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-50">
                  {filteredOrders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    return (
                      <TableRow
                        key={order.id}
                        className="group transition-colors hover:bg-slate-50"
                      >
                        <TableCell>
                          <div className="text-sm font-bold text-slate-900">
                            {order.date
                              ? new Date(order.date).toLocaleDateString(
                                  dateLocale,
                                )
                              : "—"}
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] text-slate-400">
                            {order.id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className="max-w-[200px] truncate text-sm font-medium text-slate-700"
                            title={getProjectNames(order.projectIds)}
                          >
                            {getProjectNames(order.projectIds) || (
                              <span className="italic text-slate-400">
                                {t(
                                  "admin.subscriptionPage.history.unknownProject",
                                )}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            {t("admin.subscriptionPage.history.projectsCount", {
                              count: order.projectIds.length,
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase text-slate-700">
                            {order.planName || "—"}
                          </div>
                          {order.durationMonths && (
                            <div className="ml-1 mt-1 text-xs text-slate-500">
                              {order.durationMonths}{" "}
                              {order.durationMonths === 1
                                ? t(
                                    "admin.subscriptionPage.pricing.monthsShort",
                                  )
                                : t(
                                    "admin.subscriptionPage.pricing.monthsShortPlural",
                                  )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div
                            className="flex items-center gap-2 text-sm text-slate-600"
                            title={getPaymentMethodLabel(order.paymentMethod)}
                          >
                            {getMethodIcon(order.paymentMethod)}
                            <span className="text-xs">
                              {getPaymentMethodLabel(order.paymentMethod)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-slate-900">
                          {order.amount != null
                            ? `$${order.amount.toLocaleString()}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${statusConfig.className}`}
                          >
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {order.invoiceUrl && (
                              <a
                                href={order.invoiceUrl}
                                download={`Invoice-${order.id}.pdf`}
                                className="rounded-lg p-2 text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                                title={t(
                                  "admin.subscriptionPage.history.downloadInvoice",
                                )}
                              >
                                <Download size={18} />
                              </a>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-slate-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Clock size={20} className="opacity-50" />
            </div>
            <p>{t("admin.subscriptionPage.history.empty")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

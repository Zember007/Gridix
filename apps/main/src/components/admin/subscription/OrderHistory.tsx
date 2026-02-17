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
  const { t } = useLanguage();

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

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold text-slate-900">
          {t("admin.subscriptionPage.history.title")}
        </h3>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Status filter */}
          <div className="no-scrollbar flex overflow-x-auto whitespace-nowrap rounded-lg bg-slate-100 p-1">
            {(["all", "paid", "pending"] as const).map((f) => (
              <button
                key={f}
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
      </div>

      <div className="overflow-x-auto">
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
                        ? new Date(order.date).toLocaleDateString("ru-RU")
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
                          {t("admin.subscriptionPage.history.unknownProject")}
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
                        {order.durationMonths} мес.
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex items-center gap-2 text-sm text-slate-600"
                      title={order.paymentMethod || "invoice"}
                    >
                      {getMethodIcon(order.paymentMethod)}
                      <span className="text-xs capitalize">
                        {order.paymentMethod || "invoice"}
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
                  <TableCell className="flex justify-end gap-2 text-right">
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredOrders.length === 0 && (
        <div className="flex flex-col items-center gap-3 p-12 text-center text-sm text-slate-400">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Clock size={20} className="opacity-50" />
          </div>
          <p>Заказов не найдено</p>
          <p>{t("admin.subscriptionPage.history.empty")}</p>
        </div>
      )}
    </div>
  );
};

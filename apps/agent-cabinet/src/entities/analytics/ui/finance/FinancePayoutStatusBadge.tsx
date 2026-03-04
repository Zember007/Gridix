interface Props {
  status: string | undefined;
  t: (key: string) => string;
}

export function FinancePayoutStatusBadge({ status, t }: Props) {
  const value = String(status);

  const className =
    value === "paid"
      ? "bg-green-50 text-green-700"
      : value === "pending"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-700";

  const label =
    value === "paid"
      ? t("common.analytics.finance.statusPaid")
      : value === "pending"
        ? t("common.analytics.finance.statusPending")
        : value;

  return (
    <span className={`rounded-lg px-2 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}

import { Wallet } from "lucide-react";

interface Props {
  t: (key: string) => string;
}

export function FinanceRegistryIntro({ t }: Props) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mt-0.5 shrink-0 rounded-lg border border-slate-100 bg-white p-2 text-slate-600">
        <Wallet size={20} />
      </div>
      <div className="min-w-0">
        <h3 className="font-bold text-slate-900">
          {t("common.analytics.finance.registryTitle")}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          {t("common.analytics.finance.registryDescription")}
        </p>
      </div>
    </div>
  );
}

import type {
  AnalyticsCrmData,
  AnalyticsFinanceData,
} from "@/entities/analytics";
import { CrmView, FinanceView } from "@/entities/analytics";
import { LoadingState } from "@/shared/ui/LoadingState";
import type { AnalyticsView } from "../model/types";

interface Props {
  activeWorkspaceId: string | null;
  view: AnalyticsView;
  crm: AnalyticsCrmData;
  finance: AnalyticsFinanceData;
  isLoading: boolean;
  isError: boolean;
  t: (key: string) => string;
}

export function AgentAnalyticsContent({
  activeWorkspaceId,
  view,
  crm,
  finance,
  isLoading,
  isError,
  t,
}: Props) {
  if (!activeWorkspaceId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900">
          {t("common.workspace.noActiveTitle")}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {t("common.workspace.pickInSidebar")}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState message={t("common.common.loading")} />;
  }

  if (isError) {
    return (
      <div className="text-sm text-red-600">
        {t("common.analytics.loadError")}
      </div>
    );
  }

  if (view === "crm") {
    return (
      <CrmView
        leadsCount={crm.leadsCount}
        byStage={crm.byStage}
        bySource={crm.bySource}
        conversionRate={crm.conversionRate}
        t={t}
      />
    );
  }

  return (
    <FinanceView
      paid={finance.paid}
      pending={finance.pending}
      payoutCount={finance.payoutCount}
      payouts={finance.payouts}
      t={t}
    />
  );
}

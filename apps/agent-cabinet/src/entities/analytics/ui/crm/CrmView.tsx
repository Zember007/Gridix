import type { AnalyticsCrmData } from "../../model/types";
import { CrmKpiCards } from "./CrmKpiCards";
import { CrmSourceBreakdown } from "./CrmSourceBreakdown";
import { CrmStageFunnel } from "./CrmStageFunnel";

interface Props extends AnalyticsCrmData {
  t: (key: string) => string;
}

export function CrmView({
  leadsCount,
  byStage,
  bySource,
  conversionRate,
  t,
}: Props) {
  return (
    <div className="min-w-0 space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
      <CrmKpiCards
        leadsCount={leadsCount}
        conversionRate={conversionRate}
        sourcesCount={bySource.length}
        t={t}
      />
      <CrmStageFunnel leadsCount={leadsCount} byStage={byStage} t={t} />
      <CrmSourceBreakdown bySource={bySource} t={t} />
    </div>
  );
}

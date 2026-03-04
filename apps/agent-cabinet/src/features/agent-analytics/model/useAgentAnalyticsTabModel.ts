import { useMemo, useState } from "react";
import { useWorkspace } from "@gridix/utils/react";
import {
  mapAnalyticsCrm,
  mapAnalyticsFinance,
  type AnalyticsCrmData,
  type AnalyticsFinanceData,
} from "@/entities/analytics";
import type { AnalyticsPeriod, AnalyticsView } from "./types";
import { useAgentAnalyticsQuery } from "./useAgentAnalyticsQuery";

interface AgentAnalyticsTabModel {
  activeWorkspaceId: string | null;
  selectedWorkspaceLabel: string | null;
  view: AnalyticsView;
  period: AnalyticsPeriod;
  crm: AnalyticsCrmData;
  finance: AnalyticsFinanceData;
  isLoading: boolean;
  isError: boolean;
  setView: (value: AnalyticsView) => void;
  setPeriod: (value: AnalyticsPeriod) => void;
}

export function useAgentAnalyticsTabModel(): AgentAnalyticsTabModel {
  const { activeWorkspaceId, availableWorkspaces } = useWorkspace();
  const [view, setView] = useState<AnalyticsView>("crm");
  const [period, setPeriod] = useState<AnalyticsPeriod>("30");

  const selectedWorkspaceLabel = useMemo(
    () =>
      availableWorkspaces.find(
        (workspace) => workspace.id === activeWorkspaceId,
      )?.label ?? null,
    [availableWorkspaces, activeWorkspaceId],
  );

  const analyticsQuery = useAgentAnalyticsQuery(activeWorkspaceId, period);

  const crm = useMemo(
    () => mapAnalyticsCrm(analyticsQuery.data),
    [analyticsQuery.data],
  );
  const finance = useMemo(
    () => mapAnalyticsFinance(analyticsQuery.data),
    [analyticsQuery.data],
  );

  return {
    activeWorkspaceId,
    selectedWorkspaceLabel,
    view,
    period,
    crm,
    finance,
    isLoading: analyticsQuery.isLoading,
    isError: analyticsQuery.isError,
    setView,
    setPeriod,
  };
}

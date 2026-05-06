import { Search, X } from "lucide-react";
import { Skeleton, ViewTransition } from "@gridix/ui";
import { LeadsKanban, LeadsList } from "@/entities/lead";
import { FunnelSetup } from "@/features/admin-funnel-setup";
import { EmptyState } from "@/shared/ui/EmptyState";

type FunnelName = { name: string };

type LeadsManagerContentProps = {
  t: (key: string) => string;
  isLoading: boolean;
  isFunnelSetupMode: boolean;
  funnelStages: React.ComponentProps<typeof LeadsList>["funnelStages"];
  funnelTriggers: React.ComponentProps<typeof FunnelSetup>["triggers"];
  users: React.ComponentProps<typeof FunnelSetup>["users"];
  onUpdateStage: React.ComponentProps<typeof FunnelSetup>["onUpdateStage"];
  onAddStage: React.ComponentProps<typeof FunnelSetup>["onAddStage"];
  onDeleteStage: React.ComponentProps<typeof FunnelSetup>["onDeleteStage"];
  onReorderStage: React.ComponentProps<typeof FunnelSetup>["onReorderStage"];
  onAddTrigger: React.ComponentProps<typeof FunnelSetup>["onAddTrigger"];
  onUpdateTrigger: React.ComponentProps<typeof FunnelSetup>["onUpdateTrigger"];
  onDeleteTrigger: React.ComponentProps<typeof FunnelSetup>["onDeleteTrigger"];
  onReorderTrigger: React.ComponentProps<
    typeof FunnelSetup
  >["onReorderTrigger"];
  missingApartmentStatusFunnels: FunnelName[];
  isFunnelTriggersWarningDismissed: boolean;
  setIsFunnelSetupMode: (value: boolean) => void;
  setIsFunnelTriggersWarningDismissed: (value: boolean) => void;
  filteredAndSortedLeads: React.ComponentProps<typeof LeadsList>["leads"];
  resetFilters: () => void;
  viewMode: "list" | "kanban";
  setSelectedLead: React.ComponentProps<typeof LeadsList>["onSelect"];
  selectedIds: React.ComponentProps<typeof LeadsList>["selectedIds"];
  toggleSelection: React.ComponentProps<typeof LeadsList>["onToggleSelection"];
  toggleAllSelection: React.ComponentProps<typeof LeadsList>["onToggleAll"];
  cardConfig: React.ComponentProps<typeof LeadsKanban>["cardConfig"];
  handleCreateLead: React.ComponentProps<typeof LeadsKanban>["onCreate"];
  handleStatusChange: React.ComponentProps<
    typeof LeadsKanban
  >["onStatusChange"];
  readOnly?: boolean;
};

export const LeadsManagerContent = ({
  t,
  isLoading,
  isFunnelSetupMode,
  funnelStages,
  funnelTriggers,
  users,
  onUpdateStage,
  onAddStage,
  onDeleteStage,
  onReorderStage,
  onAddTrigger,
  onUpdateTrigger,
  onDeleteTrigger,
  onReorderTrigger,
  missingApartmentStatusFunnels,
  isFunnelTriggersWarningDismissed,
  setIsFunnelSetupMode,
  setIsFunnelTriggersWarningDismissed,
  filteredAndSortedLeads,
  resetFilters,
  viewMode,
  setSelectedLead,
  selectedIds,
  toggleSelection,
  toggleAllSelection,
  cardConfig,
  handleCreateLead,
  handleStatusChange,
  readOnly = false,
}: LeadsManagerContentProps) => {
  const viewKey = isLoading
    ? "loading"
    : isFunnelSetupMode
      ? "funnel-setup"
      : viewMode;

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--admin-background-secondary)]">
      <ViewTransition viewKey={viewKey} className="min-h-full">
        {isLoading ? (
          <div className="h-full px-3 py-3 sm:px-6 sm:py-4 lg:py-6">
            <div className="mb-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-3 w-64 max-w-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-28" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-sm">
              <div className="grid grid-cols-[40px_1.4fr_1fr_1fr_120px] gap-3 border-b border-[var(--admin-border)] px-4 py-3 max-lg:grid-cols-[40px_1fr_120px]">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24 max-lg:hidden" />
                <Skeleton className="h-4 w-24 max-lg:hidden" />
                <Skeleton className="h-4 w-20" />
              </div>
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[40px_1.4fr_1fr_1fr_120px] gap-3 border-b border-[var(--admin-border)] px-4 py-4 last:border-b-0 max-lg:grid-cols-[40px_1fr_120px]"
                >
                  <Skeleton className="h-4 w-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-4 w-24 max-lg:hidden" />
                  <Skeleton className="h-4 w-28 max-lg:hidden" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ) : isFunnelSetupMode ? (
          <FunnelSetup
            stages={funnelStages}
            triggers={funnelTriggers}
            users={users}
            onUpdateStage={onUpdateStage}
            onAddStage={onAddStage}
            onDeleteStage={onDeleteStage}
            onReorderStage={onReorderStage}
            onAddTrigger={onAddTrigger}
            onUpdateTrigger={onUpdateTrigger}
            onDeleteTrigger={onDeleteTrigger}
            onReorderTrigger={onReorderTrigger}
          />
        ) : (
          <div className="relative flex h-full min-h-0 flex-col">
            {missingApartmentStatusFunnels.length > 0 &&
              !isFunnelTriggersWarningDismissed && (
                <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-0 motion-safe:duration-300 motion-safe:ease-out motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-reduce:animate-none sm:px-6">
                  <div className="bg-amber-50/98 pointer-events-auto w-full max-w-xl rounded-xl border border-amber-200/90 p-4 shadow-lg shadow-amber-900/10 backdrop-blur-md transition-transform duration-300 ease-out motion-reduce:transition-none">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 flex-1 justify-between gap-3 max-sm:flex-col">
                        <div>
                          <p className="text-sm font-extrabold text-amber-900">
                            {t("leads.warnings.funnelTriggersTitle")}
                          </p>
                          <p className="mt-2 text-xs leading-snug text-amber-900/90 sm:line-clamp-2">
                            <span className="font-bold">
                              {t("leads.warnings.missingFunnels")}:
                            </span>{" "}
                            {missingApartmentStatusFunnels
                              .map((funnel) => funnel.name)
                              .join(", ")}
                          </p>
                        </div>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => setIsFunnelSetupMode(true)}
                            className="inline-flex h-fit w-fit shrink-0 whitespace-nowrap rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-[transform,background-color] duration-200 ease-out hover:bg-amber-700 active:scale-[0.98] motion-reduce:transition-none"
                          >
                            {t("leads.warnings.funnelTriggersCta")}
                          </button>
                        )}
                      </div>
                      <div className="flex shrink-0 items-start gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsFunnelTriggersWarningDismissed(true);
                          }}
                          className="rounded-lg p-2 text-amber-900/60 transition-colors duration-200 hover:bg-amber-100/80 hover:text-amber-950"
                          aria-label={t("common.hide") as string}
                          title={t("common.hide") as string}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            <div
              className={`min-h-0 flex-1 ${missingApartmentStatusFunnels.length > 0 && !isFunnelTriggersWarningDismissed ? "pb-36 sm:pb-32" : ""}`}
            >
              {filteredAndSortedLeads.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={t("leads.emptyState.notFound")}
                  description={t("leads.emptyState.tryChangingFilters")}
                  action={{
                    label: t("leads.emptyState.resetFilters"),
                    onClick: resetFilters,
                  }}
                />
              ) : viewMode === "list" ? (
                <LeadsList
                  leads={filteredAndSortedLeads}
                  funnelStages={funnelStages}
                  onSelect={setSelectedLead}
                  selectedIds={selectedIds}
                  onToggleSelection={toggleSelection}
                  onToggleAll={toggleAllSelection}
                />
              ) : (
                <LeadsKanban
                  leads={filteredAndSortedLeads}
                  funnelStages={funnelStages}
                  users={users}
                  cardConfig={cardConfig}
                  onSelect={setSelectedLead}
                  onCreate={handleCreateLead}
                  onStatusChange={handleStatusChange}
                  readOnly={readOnly}
                />
              )}
            </div>
          </div>
        )}
      </ViewTransition>
    </main>
  );
};

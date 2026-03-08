import { Search, X } from "lucide-react";
import { LeadsKanban, LeadsList } from "@/entities/lead";
import { FunnelSetup } from "@/features/admin-funnel-setup";
import { EmptyState } from "@/components/admin/EmptyState";
import Spinner from "@/shared/ui/Spinner";

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
}: LeadsManagerContentProps) => {
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--admin-background-secondary)]">
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Spinner size="md" />
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
        <div className="h-full p-4">
          {missingApartmentStatusFunnels.length > 0 &&
            !isFunnelTriggersWarningDismissed && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 justify-between gap-3 max-sm:flex-col">
                    <div>
                      <p className="text-sm font-extrabold text-amber-900">
                        {t("leads.warnings.funnelTriggersTitle")}
                      </p>
                      <p className="mt-2 text-xs text-amber-800 sm:truncate">
                        <span className="font-bold">
                          {t("leads.warnings.missingFunnels")}:
                        </span>{" "}
                        {missingApartmentStatusFunnels
                          .map((funnel) => funnel.name)
                          .join(", ")}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsFunnelSetupMode(true)}
                      className="inline-flex h-full w-fit whitespace-nowrap rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-700"
                    >
                      {t("leads.warnings.funnelTriggersCta")}
                    </button>
                  </div>
                  <div className="flex shrink-0 items-start gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFunnelTriggersWarningDismissed(true);
                      }}
                      className="rounded-lg p-2 text-amber-800/70 transition-colors hover:bg-amber-100 hover:text-amber-900"
                      aria-label={t("common.hide") as string}
                      title={t("common.hide") as string}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

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
            />
          )}
        </div>
      )}
    </main>
  );
};

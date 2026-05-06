import { CardAppearanceModal } from "@/features/card-appearance-config";
import { CreateLeadModal } from "@/features/create-lead";
import { ImportModal } from "@/features/import-leads";
import { DuplicateFinderModal } from "@/features/merge-duplicate-leads";

type LeadsManagerModalsProps = {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (value: boolean) => void;
  handleCreateLead: React.ComponentProps<typeof CreateLeadModal>["onCreate"];
  filteredAndSortedLeads: React.ComponentProps<typeof CreateLeadModal>["leads"];
  projectOptions: React.ComponentProps<
    typeof CreateLeadModal
  >["projectOptions"];
  defaultProjectId?: React.ComponentProps<
    typeof CreateLeadModal
  >["defaultProjectId"];
  isCardAppearanceModalOpen: boolean;
  setIsCardAppearanceModalOpen: (value: boolean) => void;
  cardConfig: React.ComponentProps<typeof CardAppearanceModal>["config"];
  handleSaveCardConfig: React.ComponentProps<
    typeof CardAppearanceModal
  >["onSave"];
  users: React.ComponentProps<typeof CardAppearanceModal>["users"];
  isImportModalOpen: boolean;
  setIsImportModalOpen: (value: boolean) => void;
  handleImportLeads: React.ComponentProps<typeof ImportModal>["onImport"];
  isDuplicateFinderOpen: boolean;
  setIsDuplicateFinderOpen: (value: boolean) => void;
  handleMergeLeads: React.ComponentProps<
    typeof DuplicateFinderModal
  >["onMerge"];
};

export const LeadsManagerModals = ({
  isCreateModalOpen,
  setIsCreateModalOpen,
  handleCreateLead,
  filteredAndSortedLeads,
  projectOptions,
  defaultProjectId,
  isCardAppearanceModalOpen,
  setIsCardAppearanceModalOpen,
  cardConfig,
  handleSaveCardConfig,
  users,
  isImportModalOpen,
  setIsImportModalOpen,
  handleImportLeads,
  isDuplicateFinderOpen,
  setIsDuplicateFinderOpen,
  handleMergeLeads,
}: LeadsManagerModalsProps) => {
  return (
    <>
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateLead}
        leads={filteredAndSortedLeads}
        projectOptions={projectOptions}
        defaultProjectId={defaultProjectId}
      />
      <CardAppearanceModal
        isOpen={isCardAppearanceModalOpen}
        onClose={() => setIsCardAppearanceModalOpen(false)}
        config={cardConfig}
        onSave={handleSaveCardConfig}
        users={users}
      />
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportLeads}
      />
      <DuplicateFinderModal
        isOpen={isDuplicateFinderOpen}
        onClose={() => setIsDuplicateFinderOpen(false)}
        leads={filteredAndSortedLeads}
        onMerge={handleMergeLeads}
      />
    </>
  );
};

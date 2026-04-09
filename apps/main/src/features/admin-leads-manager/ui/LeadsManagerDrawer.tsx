import { LeadDrawer } from "@/entities/lead";

type LeadsManagerDrawerProps = {
  selectedLead: React.ComponentProps<typeof LeadDrawer>["lead"];
  funnelStages: React.ComponentProps<typeof LeadDrawer>["funnelStages"];
  setSelectedLead: (
    lead: React.ComponentProps<typeof LeadDrawer>["lead"],
  ) => void;
  handleStatusChange: React.ComponentProps<typeof LeadDrawer>["onStatusChange"];
  handleUpdateLead: React.ComponentProps<typeof LeadDrawer>["onUpdateLead"];
  handleAddTask: React.ComponentProps<typeof LeadDrawer>["onAddTask"];
  handleCompleteTask: React.ComponentProps<typeof LeadDrawer>["onCompleteTask"];
  handleToggleTask: React.ComponentProps<typeof LeadDrawer>["onToggleTask"];
  handleDeleteTask: React.ComponentProps<typeof LeadDrawer>["onDeleteTask"];
  handleAddNote: React.ComponentProps<typeof LeadDrawer>["onAddNote"];
  handleAddTag: React.ComponentProps<typeof LeadDrawer>["onAddTag"];
  handleRemoveTag: React.ComponentProps<typeof LeadDrawer>["onRemoveTag"];
  readOnly?: boolean;
};

export const LeadsManagerDrawer = ({
  selectedLead,
  funnelStages,
  setSelectedLead,
  handleStatusChange,
  handleUpdateLead,
  handleAddTask,
  handleCompleteTask,
  handleToggleTask,
  handleDeleteTask,
  handleAddNote,
  handleAddTag,
  handleRemoveTag,
  readOnly = false,
}: LeadsManagerDrawerProps) => {
  return (
    <LeadDrawer
      lead={selectedLead}
      funnelStages={funnelStages}
      onClose={() => setSelectedLead(null)}
      onStatusChange={handleStatusChange}
      onUpdateLead={handleUpdateLead}
      onAddTask={handleAddTask}
      onCompleteTask={handleCompleteTask}
      onToggleTask={handleToggleTask}
      onDeleteTask={handleDeleteTask}
      onAddNote={handleAddNote}
      onAddTag={handleAddTag}
      onRemoveTag={handleRemoveTag}
      readOnly={readOnly}
    />
  );
};

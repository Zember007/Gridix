import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit,
  GripVertical,
  ArrowRight,
  Package,
  Settings,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  FunnelStage,
  FunnelTrigger,
  LeadUser,
} from "@/entities/crm/model/types";
import { useDragScroll } from "@/hooks/useDragScroll";
import { FunnelTriggerCard } from "./FunnelTriggerCard";
import { FunnelTriggerEditor } from "./FunnelTriggerEditor";

interface FunnelSetupProps {
  stages: FunnelStage[];
  triggers: FunnelTrigger[];
  users: LeadUser[];
  onUpdateStage: (stageId: string, updates: Partial<FunnelStage>) => void;
  onAddStage: (insertAfterId: string) => void;
  onDeleteStage: (stageId: string) => void;
  onReorderStage: (draggedId: string, targetId: string) => void;
  onAddTrigger: (
    stageId: string,
    data: Omit<FunnelTrigger, "id" | "stageId">,
  ) => void;
  onUpdateTrigger: (
    triggerId: string,
    updates: Partial<Omit<FunnelTrigger, "id" | "stageId">>,
  ) => void;
  onDeleteTrigger: (triggerId: string) => void;
  onReorderTrigger: (
    draggedTriggerId: string,
    targetTriggerId: string | null,
    targetStageId: string,
  ) => void;
}

const COLORS = [
  "slate",
  "red",
  "orange",
  "amber",
  "green",
  "emerald",
  "teal",
  "cyan",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

const StageMenu: React.FC<{ onEdit: () => void; onDelete: () => void }> = ({
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <Settings size={16} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-30 mt-2 w-40 rounded-xl border border-slate-100 bg-white py-1 shadow-xl animate-in fade-in zoom-in-95">
          <button
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Edit size={14} /> {t("leads.funnel.rename")}
          </button>
          <button
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> {t("leads.funnel.deleteStage")}
          </button>
        </div>
      )}
    </div>
  );
};

export const FunnelSetup: React.FC<FunnelSetupProps> = ({
  stages,
  triggers,
  users,
  onUpdateStage,
  onAddStage,
  onDeleteStage,
  onReorderStage,
  onAddTrigger,
  onUpdateTrigger,
  onDeleteTrigger,
  onReorderTrigger,
}) => {
  const { t } = useTranslation();
  const { ref, ...scrollHandlers } = useDragScroll<HTMLDivElement>();
  const [editingStage, setEditingStage] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(
    null,
  );
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const [editingTrigger, setEditingTrigger] = useState<FunnelTrigger | null>(
    null,
  );
  const [addingTriggerToStageId, setAddingTriggerToStageId] = useState<
    string | null
  >(null);

  const [draggedTriggerId, setDraggedTriggerId] = useState<string | null>(null);
  const [dropTargetInfo, setDropTargetInfo] = useState<{
    stageId: string;
    beforeTriggerId: string | null;
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setActiveColorPicker(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStartEdit = (stage: FunnelStage) => {
    setEditingStage({ id: stage.id, name: stage.name });
  };

  const handleSaveEdit = () => {
    if (editingStage && editingStage.name.trim()) {
      onUpdateStage(editingStage.id, { name: editingStage.name.trim() });
    }
    setEditingStage(null);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    stageId: string,
  ) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", stageId);
    setDraggedStageId(stageId);
  };

  const handleDragEnd = () => {
    setDraggedStageId(null);
    setDragOverStageId(null);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetStageId: string,
  ) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId && draggedId !== targetStageId) {
      onReorderStage(draggedId, targetStageId);
    }
    setDraggedStageId(null);
    setDragOverStageId(null);
  };

  const handleTriggerDragStart = (e: React.DragEvent, triggerId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("triggerId", triggerId);
    setDraggedTriggerId(triggerId);
  };

  const handleTriggerDragEnd = () => {
    setDraggedTriggerId(null);
    setDropTargetInfo(null);
  };

  const handleTriggerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData("triggerId");
    if (draggedId && dropTargetInfo) {
      onReorderTrigger(
        draggedId,
        dropTargetInfo.beforeTriggerId,
        dropTargetInfo.stageId,
      );
    }
    handleTriggerDragEnd();
  };

  const Placeholder = () => (
    <div className="my-2 flex h-16 animate-pulse items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/50 text-xs font-bold text-blue-600 transition-all">
      <ArrowRight size={14} /> {t("leads.funnel.moveHere")}
    </div>
  );

  return (
    <div
      ref={ref}
      {...scrollHandlers}
      className="custom-scrollbar flex h-full cursor-grab select-none overflow-auto bg-slate-50/50 p-6"
    >
      <div className="flex h-full items-start gap-4">
        {stages.map((stage) => {
          const stageTriggers = triggers.filter((t) => t.stageId === stage.id);
          const isDropTargetStage =
            draggedTriggerId && dropTargetInfo?.stageId === stage.id;

          return (
            <React.Fragment key={stage.id}>
              <div
                className="flex h-full flex-col"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStageId(stage.id);
                }}
                onDragLeave={() => setDragOverStageId(null)}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, stage.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex h-full w-[320px] flex-shrink-0 flex-col rounded-2xl border transition-all duration-200 ${
                    draggedStageId === stage.id
                      ? "scale-95 border-dashed border-slate-400 opacity-40"
                      : "border-slate-200 bg-white shadow-sm hover:shadow-md"
                  } ${
                    dragOverStageId === stage.id && draggedStageId !== stage.id
                      ? "ring-2 ring-blue-500 ring-offset-2"
                      : ""
                  } `}
                >
                  {/* Stage Header */}
                  <div
                    className={`flex items-center justify-between gap-3 rounded-t-2xl border-b border-slate-100 bg-white p-4`}
                  >
                    <div className="cursor-grab rounded p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing">
                      <GripVertical size={18} />
                    </div>

                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveColorPicker(
                            stage.id === activeColorPicker ? null : stage.id,
                          )
                        }
                        className={`h-6 w-6 rounded-full ring-2 ring-transparent ring-offset-2 transition-transform hover:scale-110 hover:ring-slate-200 bg-${stage.color}-500`}
                      ></button>

                      {/* Color Picker Popover */}
                      {activeColorPicker === stage.id && (
                        <div
                          ref={colorPickerRef}
                          className="absolute left-0 top-full z-50 mt-3 grid w-48 grid-cols-5 gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-2xl animate-in fade-in zoom-in-95"
                        >
                          {COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => {
                                onUpdateStage(stage.id, { color });
                                setActiveColorPicker(null);
                              }}
                              className={`h-6 w-6 rounded-full border border-slate-100 transition-transform hover:scale-110 bg-${color}-500`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {editingStage?.id === stage.id ? (
                      <input
                        value={editingStage.name}
                        onChange={(e) =>
                          setEditingStage({
                            ...editingStage,
                            name: e.target.value,
                          })
                        }
                        onBlur={handleSaveEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") setEditingStage(null);
                        }}
                        className="flex-1 rounded border border-blue-500 bg-slate-50 px-2 py-1.5 text-sm font-bold uppercase tracking-wide text-slate-900 outline-none"
                        autoFocus
                      />
                    ) : (
                      <h3
                        onDoubleClick={() => handleStartEdit(stage)}
                        className="flex-1 cursor-text truncate rounded border border-transparent px-2 py-1.5 text-sm font-bold uppercase tracking-wide text-slate-700 transition-colors hover:border-slate-200"
                        title={t("leads.funnel.doubleClickToEdit")}
                      >
                        {stage.name}
                      </h3>
                    )}
                    <StageMenu
                      onEdit={() => handleStartEdit(stage)}
                      onDelete={() => onDeleteStage(stage.id)}
                    />
                  </div>

                  {/* Triggers Area */}
                  <div
                    className="custom-scrollbar flex flex-1 flex-col overflow-y-auto bg-slate-50/30 p-3"
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (draggedTriggerId)
                        setDropTargetInfo({
                          stageId: stage.id,
                          beforeTriggerId: null,
                        });
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={handleTriggerDrop}
                  >
                    <div className="flex-1 space-y-3">
                      {stageTriggers.length === 0 &&
                        !addingTriggerToStageId && (
                          <div className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center">
                            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                              <Package size={18} />
                            </div>
                            <p className="text-xs font-medium text-slate-500">
                              {t("leads.funnel.noAutomations")}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {t("leads.funnel.automationDesc")}
                            </p>
                          </div>
                        )}

                      {stageTriggers.map((trigger) => (
                        <React.Fragment key={trigger.id}>
                          {isDropTargetStage &&
                            dropTargetInfo?.beforeTriggerId === trigger.id && (
                              <Placeholder />
                            )}
                          {editingTrigger?.id === trigger.id ? (
                            <FunnelTriggerEditor
                              trigger={editingTrigger}
                              stages={stages}
                              users={users}
                              onSave={(data) => {
                                onUpdateTrigger(trigger.id, data);
                                setEditingTrigger(null);
                              }}
                              onCancel={() => setEditingTrigger(null)}
                            />
                          ) : (
                            <div
                              onDragEnter={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (
                                  draggedTriggerId &&
                                  draggedTriggerId !== trigger.id
                                ) {
                                  setDropTargetInfo({
                                    stageId: stage.id,
                                    beforeTriggerId: trigger.id,
                                  });
                                }
                              }}
                            >
                              <FunnelTriggerCard
                                trigger={trigger}
                                stages={stages}
                                users={users}
                                onEdit={setEditingTrigger}
                                onDelete={onDeleteTrigger}
                                onDragStart={handleTriggerDragStart}
                                onDragEnd={handleTriggerDragEnd}
                                isDragging={draggedTriggerId === trigger.id}
                              />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                      {isDropTargetStage &&
                        dropTargetInfo?.beforeTriggerId === null &&
                        stageTriggers.length > 0 && <Placeholder />}

                      {addingTriggerToStageId === stage.id && (
                        <FunnelTriggerEditor
                          key="new-editor"
                          stages={stages}
                          users={users}
                          onSave={(data) => {
                            onAddTrigger(stage.id, data);
                            setAddingTriggerToStageId(null);
                          }}
                          onCancel={() => setAddingTriggerToStageId(null)}
                        />
                      )}
                    </div>

                    {!addingTriggerToStageId && (
                      <button
                        onClick={() => {
                          setEditingTrigger(null);
                          setAddingTriggerToStageId(stage.id);
                        }}
                        className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:text-blue-600 hover:shadow-md"
                      >
                        <div className="rounded-full bg-slate-100 p-1 transition-colors group-hover:bg-blue-100">
                          <Plus size={14} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide">
                          {t("leads.funnel.addTrigger")}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Insert Stage Button Between Columns */}
              <div className="group flex h-full w-12 flex-shrink-0 flex-col items-center justify-start pt-4 opacity-0 transition-opacity hover:opacity-100">
                <button
                  onClick={() => onAddStage(stage.id)}
                  className="transform rounded-full bg-slate-200 p-3 text-slate-500 shadow-sm transition-all hover:scale-110 hover:bg-blue-600 hover:text-white hover:shadow-lg"
                  title={t("leads.funnel.insertStage")}
                >
                  <Plus size={20} />
                </button>
                <div className="mt-2 h-full w-px rounded-full bg-blue-300/50"></div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

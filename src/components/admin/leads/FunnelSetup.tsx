import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  GripVertical,
  ArrowRight,
  Zap,
  Settings,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FunnelStage, FunnelTrigger, LeadUser } from '@/types/crm';
import { useDragScroll } from '@/hooks/useDragScroll';
import { FunnelTriggerCard } from './FunnelTriggerCard';
import { FunnelTriggerEditor } from './FunnelTriggerEditor';

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
    data: Omit<FunnelTrigger, 'id' | 'stageId'>,
  ) => void;
  onUpdateTrigger: (
    triggerId: string,
    updates: Partial<Omit<FunnelTrigger, 'id' | 'stageId'>>,
  ) => void;
  onDeleteTrigger: (triggerId: string) => void;
  onReorderTrigger: (
    draggedTriggerId: string,
    targetTriggerId: string | null,
    targetStageId: string,
  ) => void;
}

const COLORS = [
  'slate',
  'red',
  'orange',
  'amber',
  'green',
  'emerald',
  'teal',
  'cyan',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Settings size={16} />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-30 py-1 animate-in fade-in zoom-in-95">
          <button
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
            className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Edit size={14} /> {t('leads.funnel.rename')}
          </button>
          <button
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
            className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> {t('leads.funnel.deleteStage')}
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, stageId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', stageId);
    setDraggedStageId(stageId);
  };

  const handleDragEnd = () => {
    setDraggedStageId(null);
    setDragOverStageId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStageId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== targetStageId) {
      onReorderStage(draggedId, targetStageId);
    }
    setDraggedStageId(null);
    setDragOverStageId(null);
  };

  const handleTriggerDragStart = (e: React.DragEvent, triggerId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('triggerId', triggerId);
    setDraggedTriggerId(triggerId);
  };

  const handleTriggerDragEnd = () => {
    setDraggedTriggerId(null);
    setDropTargetInfo(null);
  };

  const handleTriggerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData('triggerId');
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
    <div className="h-16 border-2 border-dashed border-blue-400 rounded-xl bg-blue-50/50 flex items-center justify-center gap-2 text-xs text-blue-600 font-bold my-2 transition-all animate-pulse">
      <ArrowRight size={14} /> {t('leads.funnel.moveHere')}
    </div>
  );

  return (
    <div
      ref={ref}
      {...scrollHandlers}
      className="h-full overflow-auto bg-slate-50/50 p-6 flex cursor-grab select-none custom-scrollbar"
    >
      <div className="flex h-full items-start gap-4">
        {stages.map((stage) => {
          const stageTriggers = triggers.filter((t) => t.stageId === stage.id);
          const isDropTargetStage =
            draggedTriggerId && dropTargetInfo?.stageId === stage.id;

          return (
            <React.Fragment key={stage.id}>
              <div
                className="flex flex-col h-full"
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
                  className={`w-[320px] flex-shrink-0 flex flex-col h-full rounded-2xl border transition-all duration-200 
                                        ${
                                          draggedStageId === stage.id
                                            ? 'opacity-40 scale-95 border-dashed border-slate-400'
                                            : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                                        } 
                                        ${
                                          dragOverStageId === stage.id &&
                                          draggedStageId !== stage.id
                                            ? 'ring-2 ring-blue-500 ring-offset-2'
                                            : ''
                                        }
                                    `}
                >
                  {/* Stage Header */}
                  <div
                    className={`p-4 rounded-t-2xl border-b border-slate-100 flex items-center justify-between gap-3 bg-white`}
                  >
                    <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-slate-500">
                      <GripVertical size={18} />
                    </div>

                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveColorPicker(
                            stage.id === activeColorPicker ? null : stage.id,
                          )
                        }
                        className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ring-2 ring-offset-2 ring-transparent hover:ring-slate-200 bg-${stage.color}-500`}
                      ></button>

                      {/* Color Picker Popover */}
                      {activeColorPicker === stage.id && (
                        <div
                          ref={colorPickerRef}
                          className="absolute top-full left-0 mt-3 p-3 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 grid grid-cols-5 gap-2 w-48 animate-in fade-in zoom-in-95"
                        >
                          {COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => {
                                onUpdateStage(stage.id, { color });
                                setActiveColorPicker(null);
                              }}
                              className={`w-6 h-6 rounded-full border border-slate-100 hover:scale-110 transition-transform bg-${color}-500`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {editingStage?.id === stage.id ? (
                      <input
                        value={editingStage.name}
                        onChange={(e) =>
                          setEditingStage({ ...editingStage, name: e.target.value })
                        }
                        onBlur={handleSaveEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingStage(null);
                        }}
                        className="flex-1 bg-slate-50 border border-blue-500 rounded px-2 py-1.5 text-sm font-bold uppercase tracking-wide outline-none text-slate-900"
                        autoFocus
                      />
                    ) : (
                      <h3
                        onDoubleClick={() => handleStartEdit(stage)}
                        className="font-bold text-sm text-slate-700 uppercase flex-1 truncate cursor-text border border-transparent hover:border-slate-200 rounded px-2 py-1.5 transition-colors tracking-wide"
                        title={t('leads.funnel.doubleClickToEdit')}
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
              {/*     <div
                    className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col bg-slate-50/30"
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
                    <div className="space-y-3 flex-1">
                      {stageTriggers.length === 0 &&
                        !addingTriggerToStageId && (
                          <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-xl">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                              <Zap size={18} />
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              Нет автоматизаций
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Добавьте действия при переходе на этот этап
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
                        className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 shadow-sm rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:shadow-md transition-all group"
                      >
                        <div className="bg-slate-100 group-hover:bg-blue-100 p-1 rounded-full transition-colors">
                          <Plus size={14} />
                        </div>
                        <span className="font-bold text-xs uppercase tracking-wide">
                          Добавить триггер
                        </span>
                      </button>
                    )}
                  </div> */}
                </div>
              </div>

              {/* Insert Stage Button Between Columns */}
              <div className="group flex flex-col justify-start pt-4 items-center h-full w-12 flex-shrink-0 opacity-0 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onAddStage(stage.id)}
                  className="p-3 bg-slate-200 hover:bg-blue-600 text-slate-500 hover:text-white rounded-full shadow-sm hover:shadow-lg transition-all transform hover:scale-110"
                  title={t('leads.funnel.insertStage')}
                >
                  <Plus size={20} />
                </button>
                <div className="h-full w-px bg-blue-300/50 mt-2 rounded-full"></div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

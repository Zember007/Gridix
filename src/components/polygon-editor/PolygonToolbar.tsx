
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MousePointer, Circle, Square, Pentagon, Move, RotateCcw, Undo2, Save, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type PolygonTool = 'select' | 'polygon' | 'circle' | 'rectangle' | 'move' | 'pan';

interface PolygonToolbarProps {
  activeTool: PolygonTool;
  onToolChange: (tool: PolygonTool) => void;
  canUndo: boolean;
  onUndo: () => void;
  onClear: () => void;
  onSave: () => void;
  onCancel: () => void;
  isEditing: boolean;
}

const PolygonToolbar = ({
  activeTool,
  onToolChange,
  canUndo,
  onUndo,
  onClear,
  onSave,
  onCancel,
  isEditing
}: PolygonToolbarProps) => {
  const tools = [
    { id: 'select' as const, icon: MousePointer, label: 'Выбор и редактирование', shortcut: 'V' },
    { id: 'polygon' as const, icon: Pentagon, label: 'Полигон (точки)', shortcut: 'P' },
    { id: 'rectangle' as const, icon: Square, label: 'Прямоугольник', shortcut: 'R' },
    { id: 'move' as const, icon: Move, label: 'Перемещение', shortcut: 'M' },
  ];

  return (
    <div className="flex items-center gap-2 p-2 bg-white border rounded-lg shadow-sm">
      {/* Инструменты */}
      <div className="flex items-center gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === tool.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onToolChange(tool.id)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tool.label} ({tool.shortcut})</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Действия */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Отменить (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Очистить</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {isEditing && (
        <>
          <Separator orientation="vertical" className="h-6" />
          
          {/* Сохранение */}
          <div className="flex items-center gap-1">
            <Button
              variant="default"
              size="sm"
              onClick={onSave}
            >
              <Save className="h-4 w-4 mr-1" />
              Сохранить
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              Отмена
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PolygonToolbar;

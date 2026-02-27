import { useRef, useCallback, useEffect, useState } from "react";
import type { Shape } from "@/components/visualization/polygon-editor/GeometryShapes";

interface UseShapeUndoRedoReturn {
  currentShape: Shape | null;
  setCurrentShape: React.Dispatch<React.SetStateAction<Shape | null>>;
  handleCurrentShapeUpdate: (shape: Shape | null) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  resetStacks: () => void;
  undoStackRef: React.MutableRefObject<Shape[]>;
  redoStackRef: React.MutableRefObject<Shape[]>;
}

export function useShapeUndoRedo(isEditing: boolean): UseShapeUndoRedoReturn {
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const undoStackRef = useRef<Shape[]>([]);
  const redoStackRef = useRef<Shape[]>([]);

  const resetStacks = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
  }, []);

  const handleCurrentShapeUpdate = useCallback((shape: Shape | null) => {
    setCurrentShape((prev) => {
      if (prev && shape && prev.id === shape.id) {
        const prevPts = JSON.stringify(prev.points);
        const nextPts = JSON.stringify(shape.points);
        if (prevPts !== nextPts) {
          undoStackRef.current = [...undoStackRef.current, prev];
          redoStackRef.current = [];
        }
      }
      return shape;
    });
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current[undoStackRef.current.length - 1];
    if (!prev) return;
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    setCurrentShape((cur) => {
      if (cur) {
        redoStackRef.current = [...redoStackRef.current, cur];
      }
      return prev;
    });
  }, []);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current[redoStackRef.current.length - 1];
    if (!next) return;
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    setCurrentShape((cur) => {
      if (cur) {
        undoStackRef.current = [...undoStackRef.current, cur];
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, handleUndo, handleRedo]);

  return {
    currentShape,
    setCurrentShape,
    handleCurrentShapeUpdate,
    handleUndo,
    handleRedo,
    resetStacks,
    undoStackRef,
    redoStackRef,
  };
}

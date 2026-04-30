import type {
  ComponentProps,
  MouseEvent,
  ReactNode,
  Ref,
  RefObject,
} from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import PolygonAnnotator from "@/components/visualization/polygon-editor/PolygonAnnotatorLazy";
import type { PolygonAnnotatorRef } from "@/components/visualization/polygon-editor/PolygonAnnotatorLazy";
type PolygonAnnotatorProps = ComponentProps<typeof PolygonAnnotator>;

export interface BuildingPolygonWorkspaceProps {
  viewerWrapRef: RefObject<HTMLDivElement | null>;
  updateMousePos: (e: MouseEvent) => void;
  clearHoveredAnnotation: () => void;
  polygonCardTitle: string;
  polygonCardDescription: ReactNode;
  selectionBlock: ReactNode;
  selectionBlockNeedsPaddingForError?: boolean;
  guidedProgressBlock: ReactNode;
  canvasTitle: string;
  showEditingToolbar: boolean;
  editingToolbar: ReactNode | null;
  polygonAnnotatorRef: RefObject<PolygonAnnotatorRef | null>;
  polygonAnnotatorProps: Omit<PolygonAnnotatorProps, "ref">;
  hoverPopup: ReactNode;
  guidedOverlay: ReactNode;
  /** Renders beside the canvas title row (typically a settings trigger). */
  canvasCornerActions?: ReactNode;
}

export function BuildingPolygonWorkspace({
  viewerWrapRef,
  updateMousePos,
  clearHoveredAnnotation,
  polygonCardTitle,
  polygonCardDescription,
  selectionBlock,
  selectionBlockNeedsPaddingForError = false,
  guidedProgressBlock,
  canvasTitle,
  showEditingToolbar,
  editingToolbar,
  polygonAnnotatorRef,
  polygonAnnotatorProps,
  hoverPopup,
  guidedOverlay,
  canvasCornerActions,
}: BuildingPolygonWorkspaceProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{polygonCardTitle}</CardTitle>
        <CardDescription>{polygonCardDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`flex flex-wrap items-end gap-4 ${selectionBlockNeedsPaddingForError ? "pb-5" : ""}`}
        >
          {selectionBlock}
        </div>

        {guidedProgressBlock}

        <div
          ref={viewerWrapRef as Ref<HTMLDivElement>}
          className="relative rounded-lg border bg-muted/30 p-4"
          onMouseMove={updateMousePos}
          onMouseLeave={clearHoveredAnnotation}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h4 className="min-w-0 flex-1 text-sm font-medium">
              {canvasTitle}
            </h4>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {canvasCornerActions}
              {showEditingToolbar ? editingToolbar : null}
            </div>
          </div>

          <PolygonAnnotator
            ref={polygonAnnotatorRef as Ref<PolygonAnnotatorRef>}
            {...polygonAnnotatorProps}
          />

          {hoverPopup}
          {guidedOverlay}
        </div>
      </CardContent>
    </Card>
  );
}

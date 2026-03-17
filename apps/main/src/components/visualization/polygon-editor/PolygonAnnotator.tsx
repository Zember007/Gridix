import {
  useMemo,
  useEffect,
  useState,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Annotorious,
  OpenSeadragonAnnotator,
  OpenSeadragonViewer,
  useAnnotations,
  useAnnotator,
  useViewer,
  useHover,
  DrawingStyle,
  Annotation,
  UserSelectAction,
} from "@annotorious/react";
import "@annotorious/react/annotorious-react.css";
import { Shape, Point } from "./GeometryShapes";
import {
  getImageSize,
  shapeToPercents,
  shapeToPixels,
} from "@gridix/utils/lib";
import polylabel from "polylabel";

// Тип для selector с геометрией
interface AnnotationSelector {
  type: "POLYGON" | "RECTANGLE";
  geometry: {
    bounds?: {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    };
    points?: Array<[number, number]>;
  };
}

interface PolygonAnnotatorProps {
  imageUrl: string;
  shapes?: Shape[];
  currentShape?: Shape | null;
  selectedVertexIndex?: number | null;
  onSelectVertexIndex?: (index: number | null) => void;
  onCurrentShapeUpdate?: (shape: Shape | null) => void;
  drawingEnabled?: boolean;
  engine?: "annotorious" | "controlled";
  mode?: "edit" | "view";
  onSelectAnnotationId?: (id: string | null) => void;
  onClickAnnotationId?: (id: string) => void;
  onHoverAnnotationId?: (id: string | null) => void;
  zoomToSelection?: boolean;
  getStyleById?: (id: string) => DrawingStyle;
  showLabels?: boolean;
  labelsById?: Record<string, string | number | null | undefined>;
  className?: string;
}

export interface PolygonAnnotatorRef {
  getCurrentShape: () => Promise<Shape | null>;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pointInPolygon(point: Point, polygon: Point[]) {
  let isInside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];
    if (!pi || !pj) continue;
    const xi = pi.x;
    const yi = pi.y;
    const xj = pj.x;
    const yj = pj.y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersect) isInside = !isInside;
  }
  return isInside;
}

function projectPointToSegment(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) {
    return {
      projected: { x: start.x, y: start.y },
      distance: Math.hypot(point.x - start.x, point.y - start.y),
    };
  }
  const t = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy),
    0,
    1,
  );
  const projX = start.x + t * dx;
  const projY = start.y + t * dy;
  return {
    projected: { x: projX, y: projY },
    distance: Math.hypot(point.x - projX, point.y - projY),
  };
}

const ControlledPolygonAnnotator = forwardRef<
  PolygonAnnotatorRef,
  PolygonAnnotatorProps
>(
  (
    {
      imageUrl,
      shapes = [],
      currentShape = null,
      selectedVertexIndex = null,
      onSelectVertexIndex,
      onCurrentShapeUpdate,
      drawingEnabled,
      mode = "edit",
      onClickAnnotationId,
      onHoverAnnotationId,
      getStyleById,
      className,
    },
    ref,
  ) => {
    const isDrawingEnabled = drawingEnabled ?? mode !== "view";
    const hostRef = useRef<HTMLDivElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const currentShapeRef = useRef<Shape | null>(currentShape);
    const dragStateRef = useRef<{
      pointerId: number;
      vertexIndex: number;
    } | null>(null);
    const polygonDragStateRef = useRef<{
      pointerId: number;
      startClientX: number;
      startClientY: number;
      startPoints: Point[];
      sourceShapeId: string;
    } | null>(null);
    const dragStartPointRef = useRef<{ x: number; y: number } | null>(null);
    const didVertexDragMoveRef = useRef(false);
    const didPolygonDragMoveRef = useRef(false);
    const suppressNextCanvasClickRef = useRef(false);
    const [renderBox, setRenderBox] = useState<{
      left: number;
      top: number;
      width: number;
      height: number;
    } | null>(null);
    const [insertPreview, setInsertPreview] = useState<{
      edgeIndex: number;
      pointPercent: Point;
      pointPx: { x: number; y: number };
    } | null>(null);
    const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);
    const prevHoverIdRef = useRef<string | null>(null);

    currentShapeRef.current = currentShape;

    useImperativeHandle(
      ref,
      () => ({
        getCurrentShape: async () => currentShapeRef.current,
      }),
      [],
    );

    const recomputeRenderBox = useCallback(() => {
      const host = hostRef.current;
      const image = imageRef.current;
      if (!host || !image) return;
      const hostRect = host.getBoundingClientRect();
      const naturalW = image.naturalWidth || 1;
      const naturalH = image.naturalHeight || 1;
      const hostRatio = hostRect.width / hostRect.height;
      const imageRatio = naturalW / naturalH;
      let width = hostRect.width;
      let height = hostRect.height;
      let left = 0;
      let top = 0;
      if (imageRatio > hostRatio) {
        height = hostRect.width / imageRatio;
        top = (hostRect.height - height) / 2;
      } else {
        width = hostRect.height * imageRatio;
        left = (hostRect.width - width) / 2;
      }
      setRenderBox({ left, top, width, height });
    }, []);

    useEffect(() => {
      recomputeRenderBox();
      const host = hostRef.current;
      if (!host) return;
      const ro = new ResizeObserver(() => recomputeRenderBox());
      ro.observe(host);
      window.addEventListener("resize", recomputeRenderBox);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", recomputeRenderBox);
      };
    }, [recomputeRenderBox]);

    const toPercentPoint = useCallback(
      (clientX: number, clientY: number): Point | null => {
        const host = hostRef.current;
        if (!host || !renderBox) return null;
        const rect = host.getBoundingClientRect();
        const x = clientX - rect.left - renderBox.left;
        const y = clientY - rect.top - renderBox.top;
        if (x < 0 || y < 0 || x > renderBox.width || y > renderBox.height)
          return null;
        return {
          x: clamp((x / renderBox.width) * 100, 0, 100),
          y: clamp((y / renderBox.height) * 100, 0, 100),
        };
      },
      [renderBox],
    );

    const shapeToPixels = useCallback(
      (shape: Shape) => {
        if (!renderBox) return [];
        return shape.points.map((p) => ({
          x: renderBox.left + (p.x / 100) * renderBox.width,
          y: renderBox.top + (p.y / 100) * renderBox.height,
        }));
      },
      [renderBox],
    );

    const findClickedShapeId = useCallback(
      (point: Point) => {
        const ordered = currentShape
          ? [currentShape, ...shapes.filter((s) => s.id !== currentShape.id)]
          : shapes;
        for (const shape of ordered) {
          if (!shape.points || shape.points.length < 3) continue;
          const polygon = shape.points.map((p) => ({ x: p.x, y: p.y }));
          if (pointInPolygon(point, polygon)) return shape.id;
        }
        return null;
      },
      [currentShape, shapes],
    );

    const emitHoverId = useCallback(
      (id: string | null) => {
        if (prevHoverIdRef.current === id) return;
        prevHoverIdRef.current = id;
        onHoverAnnotationId?.(id);
      },
      [onHoverAnnotationId],
    );

    const getEdgeInsertionCandidate = useCallback(
      (clickPx: { x: number; y: number }) => {
        if (!currentShape || !renderBox) return null;
        const currentPointsPx = shapeToPixels(currentShape);
        if (currentPointsPx.length < 3) return null;

        const minVertexDistance = currentPointsPx.reduce((acc, point) => {
          return Math.min(
            acc,
            Math.hypot(clickPx.x - point.x, clickPx.y - point.y),
          );
        }, Number.POSITIVE_INFINITY);
        if (minVertexDistance <= 10) return null;

        let bestEdgeIndex = -1;
        let bestEdgeDistance = Number.POSITIVE_INFINITY;
        let bestProjected: { x: number; y: number } | null = null;

        for (let i = 0; i < currentPointsPx.length; i += 1) {
          const start = currentPointsPx[i];
          const end = currentPointsPx[(i + 1) % currentPointsPx.length];
          if (!start || !end) continue;
          const projection = projectPointToSegment(clickPx, start, end);
          if (projection.distance < bestEdgeDistance) {
            bestEdgeDistance = projection.distance;
            bestEdgeIndex = i;
            bestProjected = projection.projected;
          }
        }

        if (bestEdgeIndex < 0 || !bestProjected || bestEdgeDistance > 12)
          return null;

        return {
          edgeIndex: bestEdgeIndex,
          pointPx: bestProjected,
          pointPercent: {
            x: clamp(
              ((bestProjected.x - renderBox.left) / renderBox.width) * 100,
              0,
              100,
            ),
            y: clamp(
              ((bestProjected.y - renderBox.top) / renderBox.height) * 100,
              0,
              100,
            ),
          },
        };
      },
      [currentShape, renderBox, shapeToPixels],
    );

    const handleCanvasClick = useCallback(
      (event: React.MouseEvent<SVGSVGElement>) => {
        if (suppressNextCanvasClickRef.current) {
          suppressNextCanvasClickRef.current = false;
          return;
        }

        const percentPoint = toPercentPoint(event.clientX, event.clientY);
        if (!percentPoint) return;

        if (isDrawingEnabled && !currentShape) {
          const d = 2;
          const seedColor = shapes[0]?.color || "#3b82f6";
          const seedShape: Shape = {
            id: `draft-${Date.now()}`,
            type: "polygon",
            color: seedColor,
            isSelected: true,
            points: [
              {
                x: clamp(percentPoint.x - d, 0, 100),
                y: clamp(percentPoint.y - d, 0, 100),
              },
              {
                x: clamp(percentPoint.x + d, 0, 100),
                y: clamp(percentPoint.y - d, 0, 100),
              },
              {
                x: clamp(percentPoint.x + d, 0, 100),
                y: clamp(percentPoint.y + d, 0, 100),
              },
              {
                x: clamp(percentPoint.x - d, 0, 100),
                y: clamp(percentPoint.y + d, 0, 100),
              },
            ],
          };
          onCurrentShapeUpdate?.(seedShape);
          return;
        }

        if (mode === "edit" && currentShape && !isDrawingEnabled) {
          const host = hostRef.current;
          if (host) {
            const rect = host.getBoundingClientRect();
            const clickPx = {
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            };
            const candidate =
              insertPreview ?? getEdgeInsertionCandidate(clickPx);
            if (candidate) {
              const nextPoints = [...currentShape.points];
              nextPoints.splice(
                candidate.edgeIndex + 1,
                0,
                candidate.pointPercent,
              );
              onCurrentShapeUpdate?.({
                ...currentShape,
                points: nextPoints,
              });
              return;
            }
          }
        }

        const clickedId = findClickedShapeId(percentPoint);
        if (clickedId) onClickAnnotationId?.(clickedId);
      },
      [
        currentShape,
        findClickedShapeId,
        isDrawingEnabled,
        insertPreview,
        getEdgeInsertionCandidate,
        mode,
        onClickAnnotationId,
        onCurrentShapeUpdate,
        toPercentPoint,
      ],
    );

    const updateVertexFromEvent = useCallback(
      (event: PointerEvent, vertexIndex: number) => {
        if (!currentShapeRef.current) return;
        const nextPoint = toPercentPoint(event.clientX, event.clientY);
        if (!nextPoint) return;
        const nextPoints = currentShapeRef.current.points.map((p, i) =>
          i === vertexIndex ? nextPoint : p,
        );
        onCurrentShapeUpdate?.({
          ...currentShapeRef.current,
          points: nextPoints,
        });
      },
      [onCurrentShapeUpdate, toPercentPoint],
    );

    const updatePolygonFromEvent = useCallback(
      (event: PointerEvent) => {
        const drag = polygonDragStateRef.current;
        const activeShape = currentShapeRef.current;
        if (!drag || !activeShape || !renderBox) return;
        if (activeShape.id !== drag.sourceShapeId) return;

        const dxPixels = event.clientX - drag.startClientX;
        const dyPixels = event.clientY - drag.startClientY;
        const rawDxPercent = (dxPixels / renderBox.width) * 100;
        const rawDyPercent = (dyPixels / renderBox.height) * 100;

        const minX = Math.min(...drag.startPoints.map((point) => point.x));
        const maxX = Math.max(...drag.startPoints.map((point) => point.x));
        const minY = Math.min(...drag.startPoints.map((point) => point.y));
        const maxY = Math.max(...drag.startPoints.map((point) => point.y));

        const boundedDxPercent = clamp(rawDxPercent, -minX, 100 - maxX);
        const boundedDyPercent = clamp(rawDyPercent, -minY, 100 - maxY);

        const nextPoints = drag.startPoints.map((point) => ({
          x: clamp(point.x + boundedDxPercent, 0, 100),
          y: clamp(point.y + boundedDyPercent, 0, 100),
        }));

        onCurrentShapeUpdate?.({
          ...activeShape,
          points: nextPoints,
        });
      },
      [onCurrentShapeUpdate, renderBox],
    );

    useEffect(() => {
      const handlePointerMove = (event: PointerEvent) => {
        const vertexDrag = dragStateRef.current;
        if (vertexDrag) {
          event.preventDefault();
          const start = dragStartPointRef.current;
          if (start) {
            const movedDistance = Math.hypot(
              event.clientX - start.x,
              event.clientY - start.y,
            );
            if (movedDistance > 2) {
              didVertexDragMoveRef.current = true;
            }
          }
          updateVertexFromEvent(event, vertexDrag.vertexIndex);
          return;
        }

        const polygonDrag = polygonDragStateRef.current;
        if (!polygonDrag) return;
        event.preventDefault();
        const movedDistance = Math.hypot(
          event.clientX - polygonDrag.startClientX,
          event.clientY - polygonDrag.startClientY,
        );
        if (movedDistance > 2) {
          didPolygonDragMoveRef.current = true;
        }
        updatePolygonFromEvent(event);
      };
      const handlePointerUp = (event: PointerEvent) => {
        const vertexDrag = dragStateRef.current;
        if (vertexDrag && vertexDrag.pointerId === event.pointerId) {
          event.preventDefault();
          if (didVertexDragMoveRef.current) {
            suppressNextCanvasClickRef.current = true;
          }
          dragStartPointRef.current = null;
          didVertexDragMoveRef.current = false;
          dragStateRef.current = null;
          return;
        }

        const polygonDrag = polygonDragStateRef.current;
        if (!polygonDrag || polygonDrag.pointerId !== event.pointerId) return;
        event.preventDefault();
        if (didPolygonDragMoveRef.current) {
          suppressNextCanvasClickRef.current = true;
        }
        didPolygonDragMoveRef.current = false;
        polygonDragStateRef.current = null;
      };
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
      };
    }, [updatePolygonFromEvent, updateVertexFromEvent]);

    const renderedShapes = currentShape
      ? [...shapes.filter((s) => s.id !== currentShape.id), currentShape]
      : shapes;

    return (
      <div className={className ?? "h-[600px] w-full"}>
        <div
          ref={hostRef}
          className="relative h-full w-full overflow-hidden rounded-lg border bg-black/5"
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt=""
            className="pointer-events-none h-full w-full select-none object-contain"
            draggable={false}
            onLoad={recomputeRenderBox}
          />
          {renderBox && (
            <svg
              className="absolute inset-0 h-full w-full"
              style={{ touchAction: mode === "edit" ? "none" : "auto" }}
              onClick={handleCanvasClick}
              onMouseMove={(event) => {
                const percentPoint = toPercentPoint(
                  event.clientX,
                  event.clientY,
                );
                const hoveredId = percentPoint
                  ? findClickedShapeId(percentPoint)
                  : null;
                emitHoverId(hoveredId);
                setHoveredShapeId(hoveredId);
                if (
                  mode !== "edit" ||
                  !currentShape ||
                  isDrawingEnabled ||
                  dragStateRef.current ||
                  polygonDragStateRef.current
                ) {
                  if (insertPreview) setInsertPreview(null);
                  return;
                }
                const host = hostRef.current;
                if (!host) return;
                const rect = host.getBoundingClientRect();
                const candidate = getEdgeInsertionCandidate({
                  x: event.clientX - rect.left,
                  y: event.clientY - rect.top,
                });
                setInsertPreview(candidate);
              }}
              onMouseLeave={() => {
                setInsertPreview(null);
                emitHoverId(null);
                setHoveredShapeId(null);
              }}
            >
              {renderedShapes.map((shape) => {
                if (!shape.points || shape.points.length < 3) return null;
                const pointsPx = shapeToPixels(shape);
                const pointsAttr = pointsPx
                  .map((p) => `${p.x},${p.y}`)
                  .join(" ");
                const style = getStyleById?.(shape.id);
                const isActive = currentShape?.id === shape.id;
                const isHovered = hoveredShapeId === shape.id;
                const isDraggableHover =
                  mode === "edit" && isActive && !isDrawingEnabled && isHovered;
                const isPolygonHoverHighlight =
                  isHovered &&
                  (mode === "view" ||
                    (mode === "edit" && !isDrawingEnabled && !isActive));
                const baseFill =
                  (style?.fill as string) || shape.color || "#3b82f6";
                const baseStroke =
                  (style?.stroke as string) || shape.color || "#3b82f6";
                const baseFillOpacity =
                  typeof style?.fillOpacity === "number"
                    ? style.fillOpacity
                    : isActive
                      ? 0.35
                      : 0.2;
                const baseStrokeWidth =
                  typeof style?.strokeWidth === "number"
                    ? style.strokeWidth
                    : isActive
                      ? 3
                      : 2;
                return (
                  <polygon
                    key={shape.id}
                    points={pointsAttr}
                    fill={isPolygonHoverHighlight ? "#3b82f6" : baseFill}
                    fillOpacity={
                      isDraggableHover
                        ? Math.max(baseFillOpacity, 0.45)
                        : isPolygonHoverHighlight
                          ? Math.max(baseFillOpacity, 0.5)
                          : baseFillOpacity
                    }
                    stroke={isPolygonHoverHighlight ? "#3b82f6" : baseStroke}
                    strokeWidth={
                      isDraggableHover
                        ? Math.max(baseStrokeWidth, 4)
                        : isPolygonHoverHighlight
                          ? Math.max(baseStrokeWidth, 3.5)
                          : baseStrokeWidth
                    }
                    strokeOpacity={1}
                    style={{
                      cursor:
                        mode === "edit" && isActive && !isDrawingEnabled
                          ? "move"
                          : mode === "view"
                            ? "pointer"
                            : isPolygonHoverHighlight
                              ? "pointer"
                              : "default",
                      transition:
                        "fill-opacity 120ms ease, stroke-width 120ms ease",
                    }}
                    onPointerDown={(event) => {
                      if (
                        mode !== "edit" ||
                        !isActive ||
                        isDrawingEnabled ||
                        event.button !== 0
                      ) {
                        return;
                      }
                      if (!currentShapeRef.current) return;
                      event.preventDefault();
                      event.stopPropagation();
                      setInsertPreview(null);
                      polygonDragStateRef.current = {
                        pointerId: event.pointerId,
                        startClientX: event.clientX,
                        startClientY: event.clientY,
                        startPoints: currentShapeRef.current.points.map(
                          (point) => ({
                            x: point.x,
                            y: point.y,
                          }),
                        ),
                        sourceShapeId: currentShapeRef.current.id,
                      };
                      didPolygonDragMoveRef.current = false;
                    }}
                  />
                );
              })}

              {currentShape &&
                shapeToPixels(currentShape).map((point, index) => {
                  const isActive = selectedVertexIndex === index;
                  return (
                    <circle
                      key={`vertex-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r={isActive ? 5 : 4}
                      fill={isActive ? "#2563eb" : "#ef4444"}
                      stroke="#ffffff"
                      strokeWidth={isActive ? 2 : 1}
                      style={{ cursor: mode === "edit" ? "grab" : "default" }}
                      onPointerDown={(e) => {
                        if (mode !== "edit") return;
                        e.preventDefault();
                        e.stopPropagation();
                        setInsertPreview(null);
                        onSelectVertexIndex?.(index);
                        dragStartPointRef.current = {
                          x: e.clientX,
                          y: e.clientY,
                        };
                        didVertexDragMoveRef.current = false;
                        dragStateRef.current = {
                          pointerId: e.pointerId,
                          vertexIndex: index,
                        };
                      }}
                    />
                  );
                })}
              {mode === "edit" &&
                currentShape &&
                !isDrawingEnabled &&
                insertPreview && (
                  <circle
                    cx={insertPreview.pointPx.x}
                    cy={insertPreview.pointPx.y}
                    r={5}
                    fill="#9ca3af"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    style={{ pointerEvents: "none" }}
                  />
                )}
            </svg>
          )}
        </div>
      </div>
    );
  },
);

ControlledPolygonAnnotator.displayName = "ControlledPolygonAnnotator";

const AnnotatorContent = forwardRef<PolygonAnnotatorRef, PolygonAnnotatorProps>(
  (
    {
      imageUrl,
      shapes = [],
      currentShape,
      selectedVertexIndex = null,
      onCurrentShapeUpdate,
      drawingEnabled,
      mode = "edit",
      onSelectAnnotationId,
      onClickAnnotationId,
      onHoverAnnotationId,
      zoomToSelection = false,
      getStyleById,
      showLabels = false,
      labelsById,
    },
    ref,
  ) => {
    const annotations = useAnnotations<Annotation>();
    const annotator = useAnnotator();
    const viewer = useViewer();
    const hovered = useHover<Annotation>();
    const viewerHostRef = useRef<HTMLDivElement | null>(null);

    const prevShapesRef = useRef<Shape[]>([]);
    const prevCurrentShapeIdRef = useRef<string | null>(null);
    const prevCurrentShapePointsSignatureRef = useRef<string | null>(null);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<
      string | null
    >(null);
    const labelOverlaysRef = useRef<HTMLElement[]>([]);
    const vertexOverlaysRef = useRef<HTMLElement[]>([]);
    const prevHoverIdRef = useRef<string | null>(null);
    const selectionRetryTimeoutsRef = useRef<number[]>([]);
    const selectionSyncRunIdRef = useRef(0);
    const pointerFlushTimeoutsRef = useRef<number[]>([]);
    const lastAnnotationClickTsRef = useRef(0);
    // Keep a ref to annotations so imperative methods always read the latest value
    const annotationsRef = useRef<Annotation[]>([]);
    annotationsRef.current = annotations;
    // Prefer OpenSeadragon-provided image size to avoid CORS issues with `new Image()`
    const [osdImageSize, setOsdImageSize] = useState<{
      width: number;
      height: number;
    } | null>(null);
    const isDrawingEnabled = drawingEnabled ?? mode !== "view";

    useEffect(() => {
      // Reset size when image URL changes (viewer will re-open)
      setOsdImageSize(null);
    }, [imageUrl]);

    useEffect(() => {
      if (!viewer) return;

      const updateFromViewer = () => {
        try {
          const item = viewer.world?.getItemAt?.(0);
          const size = item?.getContentSize?.();
          if (
            size &&
            typeof size.x === "number" &&
            typeof size.y === "number"
          ) {
            const width = Math.round(size.x);
            const height = Math.round(size.y);
            if (width > 0 && height > 0) {
              setOsdImageSize({ width, height });
            }
          }
        } catch {
          // ignore
        }
      };

      // Try immediately (if already open) and also on each open
      updateFromViewer();
      viewer.addHandler?.("open", updateFromViewer);

      return () => {
        viewer.removeHandler?.("open", updateFromViewer);
      };
    }, [viewer]);

    useEffect(() => {
      if (!viewer) return;
      const hostEl = viewerHostRef.current;
      if (!hostEl) return;

      let frameId: number | null = null;
      let timeoutId: number | null = null;

      const forceViewerResize = () => {
        try {
          viewer.forceResize?.();
          viewer.viewport?.applyConstraints?.();
        } catch {
          // ignore intermittent OpenSeadragon resize errors
        }
      };

      const queueViewerResize = () => {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
        }
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }

        // Two RAF ticks reduce drift during parent width transitions.
        frameId = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            forceViewerResize();
          });
        });

        // Re-run once after transition settles (sidebar open/close animation).
        timeoutId = window.setTimeout(forceViewerResize, 320);
      };

      const observer = new ResizeObserver(queueViewerResize);
      observer.observe(hostEl);
      if (hostEl.parentElement) {
        observer.observe(hostEl.parentElement);
      }

      window.addEventListener("resize", queueViewerResize);
      window.addEventListener("orientationchange", queueViewerResize);

      return () => {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
        }
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
        observer.disconnect();
        window.removeEventListener("resize", queueViewerResize);
        window.removeEventListener("orientationchange", queueViewerResize);
      };
    }, [viewer]);

    const getEffectiveImageSize = useCallback(async () => {
      if (osdImageSize) return osdImageSize;
      return await getImageSize(imageUrl);
    }, [imageUrl, osdImageSize]);

    const clearTimeoutIds = useCallback((ids: number[]) => {
      ids.forEach((id) => {
        window.clearTimeout(id);
        window.cancelAnimationFrame(id);
      });
      ids.length = 0;
    }, []);

    // View mode: propagate hover changes (for external tooltips)
    useEffect(() => {
      if (mode !== "view") return;
      const nextId = hovered?.id ?? null;
      if (prevHoverIdRef.current === nextId) return;
      prevHoverIdRef.current = nextId;
      onHoverAnnotationId?.(nextId);
    }, [hovered, mode, onHoverAnnotationId]);

    const convertShapeToAnnotation = useCallback(
      async (shape: Shape): Promise<Annotation> => {
        const { width, height } = await getEffectiveImageSize();

        // Конвертируем shape в пиксели
        const inPixels = shapeToPixels(shape, width, height);

        // Вычисляем bounds
        const xCoords = inPixels.points.map((p) => p.x);
        const yCoords = inPixels.points.map((p) => p.y);
        const bounds = {
          minX: Math.min(...xCoords),
          minY: Math.min(...yCoords),
          maxX: Math.max(...xCoords),
          maxY: Math.max(...yCoords),
        };

        // Преобразуем точки в формат [[x, y], [x, y], ...]
        const points = inPixels.points.map((p) => [p.x, p.y]);

        // Создаем аннотацию в нужном формате
        const annotation: Annotation = {
          id: shape.id,
          bodies: [],
          target: {
            annotation: shape.id,
            selector: {
              type: "POLYGON",
              geometry: {
                bounds,
                points,
              },
            },
            creator: {
              isGuest: true,
              id: "system",
            },
            created: new Date(),
          },
        };

        return annotation;
      },
      [getEffectiveImageSize],
    );

    const annotationToShape = useCallback(
      async (annotation: Annotation): Promise<Shape | null> => {
        try {
          const { width, height } = await getEffectiveImageSize();

          // Annotorious can return different selector shapes depending on how the annotation was created:
          // - Our persisted shapes use a custom selector: { type: 'POLYGON' | 'RECTANGLE', geometry: { points/bounds } }
          // - User-drawn annotations typically use W3C selectors like SvgSelector / FragmentSelector (xywh=pixel:...)
          const target = (
            annotation as unknown as { target?: { selector?: unknown } }
          ).target;
          const rawSelector = target?.selector;
          const selectorCandidates: unknown[] = Array.isArray(rawSelector)
            ? rawSelector
            : rawSelector
              ? [rawSelector]
              : [];

          const parseSvgPolygonPoints = (svg: string): Point[] | null => {
            const polygonMatch = svg.match(
              /<polygon[^>]*\bpoints=['"]([^'"]+)['"][^>]*>/i,
            );
            if (!polygonMatch?.[1]) return null;

            const nums =
              polygonMatch[1].match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
            if (nums.length < 6) return null; // at least 3 points

            const pts: Point[] = [];
            for (let i = 0; i + 1 < nums.length; i += 2) {
              const x = nums[i];
              const y = nums[i + 1];
              if (
                typeof x === "number" &&
                typeof y === "number" &&
                Number.isFinite(x) &&
                Number.isFinite(y)
              ) {
                pts.push({ x, y });
              }
            }
            return pts.length >= 3 ? pts : null;
          };

          const parseSvgRect = (
            svg: string,
          ): {
            minX: number;
            minY: number;
            maxX: number;
            maxY: number;
          } | null => {
            const rectMatch = svg.match(/<rect\b[^>]*>/i);
            if (!rectMatch) return null;
            const tag = rectMatch[0];

            const getAttr = (name: string) => {
              const m = tag.match(
                new RegExp(`\\b${name}=['"]([^'"]+)['"]`, "i"),
              );
              return m?.[1];
            };

            const x = Number(getAttr("x"));
            const y = Number(getAttr("y"));
            const w = Number(getAttr("width"));
            const h = Number(getAttr("height"));
            if (![x, y, w, h].every((n) => Number.isFinite(n))) return null;
            return { minX: x, minY: y, maxX: x + w, maxY: y + h };
          };

          const parseFragmentXywh = (
            value: string,
          ): {
            minX: number;
            minY: number;
            maxX: number;
            maxY: number;
          } | null => {
            // Examples:
            // - "xywh=pixel:160,120,30,40"
            // - "xywh=160,120,30,40"
            const m = value.match(
              /xywh=(?:pixel:)?\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)/i,
            );
            if (!m) return null;
            const x = Number(m[1]);
            const y = Number(m[2]);
            const w = Number(m[3]);
            const h = Number(m[4]);
            if (![x, y, w, h].every((n) => Number.isFinite(n))) return null;
            return { minX: x, minY: y, maxX: x + w, maxY: y + h };
          };

          let pointsInPixels: Point[] = [];
          let inferredType: "polygon" | "rectangle" = "polygon";

          for (const candidate of selectorCandidates) {
            if (!candidate || typeof candidate !== "object") continue;
            const sel = candidate as Record<string, unknown>;
            const type = typeof sel.type === "string" ? sel.type : undefined;

            // Custom persisted selector (used for shapes coming from DB)
            if (
              (type === "POLYGON" || type === "RECTANGLE") &&
              typeof sel.geometry === "object" &&
              sel.geometry
            ) {
              const custom = sel as unknown as AnnotationSelector;
              const geometry = custom.geometry;
              if (custom.type === "POLYGON" && geometry.points) {
                pointsInPixels = geometry.points.map(([x, y]) => ({ x, y }));
                inferredType = "polygon";
                break;
              }
              if (custom.type === "RECTANGLE" && geometry.bounds) {
                const { minX, minY, maxX, maxY } = geometry.bounds;
                pointsInPixels = [
                  { x: minX, y: minY },
                  { x: maxX, y: minY },
                  { x: maxX, y: maxY },
                  { x: minX, y: maxY },
                ];
                inferredType = "rectangle";
                break;
              }
            }

            // W3C SvgSelector (used by user-drawn annotations in Annotorious)
            if (type === "SvgSelector" && typeof sel.value === "string") {
              const svg = sel.value;
              const pts = parseSvgPolygonPoints(svg);
              if (pts) {
                pointsInPixels = pts;
                inferredType = "polygon";
                break;
              }
              const bounds = parseSvgRect(svg);
              if (bounds) {
                pointsInPixels = [
                  { x: bounds.minX, y: bounds.minY },
                  { x: bounds.maxX, y: bounds.minY },
                  { x: bounds.maxX, y: bounds.maxY },
                  { x: bounds.minX, y: bounds.maxY },
                ];
                inferredType = "rectangle";
                break;
              }
            }

            // W3C FragmentSelector with xywh bounds (rectangles)
            if (type === "FragmentSelector" && typeof sel.value === "string") {
              const bounds = parseFragmentXywh(sel.value);
              if (bounds) {
                pointsInPixels = [
                  { x: bounds.minX, y: bounds.minY },
                  { x: bounds.maxX, y: bounds.minY },
                  { x: bounds.maxX, y: bounds.maxY },
                  { x: bounds.minX, y: bounds.maxY },
                ];
                inferredType = "rectangle";
                break;
              }
            }
          }

          if (!pointsInPixels || pointsInPixels.length === 0) {
            console.warn(
              "Unsupported/invalid annotation selector:",
              annotation,
            );
            return null;
          }

          // Preserve color from currentShape or shapes props instead of hardcoded fallback
          const existingColor =
            (currentShape && currentShape.id === annotation.id
              ? currentShape.color
              : undefined) ??
            shapes.find((s) => s.id === annotation.id)?.color ??
            "#3b82f6";

          // Создаем shape в пикселях
          const shapeInPixels: Shape = {
            id: annotation.id,
            type: inferredType,
            points: pointsInPixels,
            color: existingColor,
            isSelected: false,
          };

          // Конвертируем из пикселей в проценты
          const shapeInPercents = shapeToPercents(shapeInPixels, width, height);

          return shapeInPercents;
        } catch (error) {
          console.error("Error converting annotation to shape:", error);
          return null;
        }
      },
      [currentShape, getEffectiveImageSize, shapes],
    );

    // Экспортируем метод для получения актуального currentShape из аннотатора
    useImperativeHandle(
      ref,
      () => ({
        getCurrentShape: async () => {
          if (!annotator) {
            return null;
          }

          if (!currentShape) {
            // Пытаемся получить первую аннотацию, если currentShape нет
            const latestAnnotations = annotationsRef.current;
            if (latestAnnotations.length > 0) {
              const shape = await annotationToShape(
                latestAnnotations[0] as Annotation,
              );
              return shape;
            }
            return null;
          }

          // Сохраняем ID текущей аннотации
          const currentShapeId = currentShape.id;

          try {
            // Программно снимаем выделение, чтобы закоммитить все изменения
            annotator.setSelected();

            // Небольшая задержка для применения изменений
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Используем ref для получения актуальных аннотаций (не stale замыкание)
            const latestAnnotations = annotationsRef.current;
            const updatedAnnotation = latestAnnotations.find(
              (a) => a.id === currentShapeId,
            );

            if (updatedAnnotation) {
              const shape = await annotationToShape(
                updatedAnnotation as Annotation,
              );
              return shape;
            }

            // Если не нашли аннотацию, возвращаем currentShape
            return currentShape;
          } catch (error) {
            console.error("[getCurrentShape] Error:", error);
            return currentShape;
          }
        },
      }),
      [annotator, currentShape, annotationToShape],
    );

    // IMPORTANT! Memo-ize your options to avoid
    // unexpected re-renders of the OSD viewer.
    const options = useMemo(
      () => ({
        tileSources: {
          type: "image",
          url: imageUrl,
        },
        // OpenSeadragon настройки для правильного отображения
        showNavigationControl: true,
        showNavigator: true,
        navigatorPosition: "BOTTOM_RIGHT",
        defaultZoomLevel: 0.8,
        minZoomLevel: 0.5,
        maxZoomLevel: 10,
        visibilityRatio: 1.0,
        constrainDuringPan: true,
        homeFillsViewer: false,
        degrees: 0,
        // Отключаем zoom при клике
        gestureSettingsMouse: {
          clickToZoom: false,
          dblClickToZoom: false,
          scrollToZoom: true,
          pinchToZoom: true,
        },
        gestureSettingsTouch: {
          clickToZoom: false,
          dblClickToZoom: false,
          pinchToZoom: true,
        },
      }),
      [imageUrl],
    );

    const saveShapesToAnnotations = useCallback(
      async (shapes: Shape[]) => {
        const annotations = await Promise.all(
          shapes.map(convertShapeToAnnotation),
        );
        annotator.setAnnotations(annotations, true);
      },
      [annotator, convertShapeToAnnotation],
    );

    // Синхронизируем shapes при изменении списка (не при каждом рендере)
    useEffect(() => {
      if (!annotator) return;

      // In edit mode, currentShape effect is responsible for syncing annotations.
      // If we also sync `shapes` while a currentShape exists, we can accidentally wipe
      // the freshly drawn annotation (because `shapes` doesn't include it yet).
      if (mode !== "view" && currentShape) {
        return;
      }

      // Проверяем, изменились ли ID shapes
      const shapesIds = shapes
        .map((s) => s.id)
        .sort()
        .join(",");
      const prevShapesIds = prevShapesRef.current
        .map((s) => s.id)
        .sort()
        .join(",");

      // Если ID не изменились, ничего не делаем (избегаем циклических обновлений)
      if (shapesIds === prevShapesIds && prevShapesRef.current.length > 0) {
        return;
      }

      prevShapesRef.current = shapes;

      // Показываем только неактивные shapes (фоновые)
      const backgroundShapes = shapes
        .filter((shape) => !currentShape || shape.id !== currentShape.id)
        .map((shape) => ({ ...shape, isSelected: false }));

      saveShapesToAnnotations(backgroundShapes);
    }, [shapes, annotator, saveShapesToAnnotations, currentShape, mode]);

    // Отдельно обрабатываем изменение currentShape (когда начинаем/завершаем редактирование)
    useEffect(() => {
      if (!annotator) return;
      selectionSyncRunIdRef.current += 1;
      const runId = selectionSyncRunIdRef.current;
      clearTimeoutIds(selectionRetryTimeoutsRef.current);

      const currentShapeId = currentShape?.id || null;
      const currentPointsSignature = currentShape
        ? JSON.stringify(currentShape.points)
        : null;

      // Skip re-sync only when neither shape id nor geometry changed.
      if (
        currentShapeId === prevCurrentShapeIdRef.current &&
        currentPointsSignature === prevCurrentShapePointsSignatureRef.current
      ) {
        return;
      }

      prevCurrentShapeIdRef.current = currentShapeId;
      prevCurrentShapePointsSignatureRef.current = currentPointsSignature;

      // Показываем все shapes: фоновые + текущий редактируемый
      const allShapes: Shape[] = [];

      shapes.forEach((shape) => {
        if (!currentShape || shape.id !== currentShape.id) {
          allShapes.push({ ...shape, isSelected: false });
        }
      });

      if (currentShape && currentShape.points.length > 0) {
        allShapes.push({ ...currentShape, isSelected: true });
      }

      saveShapesToAnnotations(allShapes).then(() => {
        if (runId !== selectionSyncRunIdRef.current) return;
        // После загрузки аннотаций, выделяем currentShape для редактирования
        if (currentShape && currentShape.id) {
          const targetId = currentShape.id;
          // Retry selection: Annotorious may not register the annotation immediately
          // after setAnnotations(). Try up to 5 times with increasing delays.
          let attempt = 0;
          const trySelect = () => {
            if (runId !== selectionSyncRunIdRef.current) return;
            attempt++;
            try {
              annotator.setSelected(targetId, true);
            } catch {
              // ignore; we'll retry below
            } finally {
              if (attempt < 5) {
                const timeoutId = window.setTimeout(trySelect, 80 * attempt);
                selectionRetryTimeoutsRef.current.push(timeoutId);
              }
            }
          };
          const timeoutId = window.setTimeout(trySelect, 80);
          selectionRetryTimeoutsRef.current.push(timeoutId);
        } else {
          // Снимаем выделение если currentShape === null
          annotator.setSelected();
        }
      });
      return () => {
        selectionSyncRunIdRef.current += 1;
        clearTimeoutIds(selectionRetryTimeoutsRef.current);
      };
    }, [
      annotator,
      clearTimeoutIds,
      currentShape,
      saveShapesToAnnotations,
      shapes,
    ]);

    // Подписываемся на события создания/обновления/выделения аннотаций
    useEffect(() => {
      if (!annotator) return;

      const handleCreate = async (annotation: Annotation) => {
        const shape = await annotationToShape(annotation);

        if (shape) {
          // Если мы в режиме редактирования и создаем новый полигон
          if (isDrawingEnabled && onCurrentShapeUpdate) {
            // Помечаем новый shape как незавершенный (редактируемый)
            const editableShape = { ...shape, isSelected: false };
            onCurrentShapeUpdate(editableShape);
          }
        }
      };

      const handleUpdate = async (annotation: Annotation) => {
        const shape = await annotationToShape(annotation);

        if (shape) {
          // Если обновляемая аннотация - это currentShape
          if (
            currentShape &&
            annotation.id === currentShape.id &&
            onCurrentShapeUpdate
          ) {
            // Сохраняем статус isSelected при обновлении
            const updatedShape = {
              ...shape,
              isSelected: currentShape.isSelected,
            };
            onCurrentShapeUpdate(updatedShape);
          }
        }
      };

      const handleDelete = (annotation: Annotation) => {
        // Если удалили currentShape, сбрасываем его
        if (
          currentShape &&
          annotation.id === currentShape.id &&
          onCurrentShapeUpdate
        ) {
          onCurrentShapeUpdate(null);
        }
      };

      const handleSelectionChanged = async (selected: Annotation[]) => {
        if (selected.length > 0) {
          const annotation = selected[0];
          const selectedId = annotation?.id ?? null;

          // Viewer mode: selection only (+ optional zoom), no editing callbacks
          if (mode === "view") {
            setSelectedAnnotationId(selectedId);
            onSelectAnnotationId?.(selectedId);

            if (zoomToSelection && viewer && annotation) {
              const selector = annotation.target?.selector as
                | AnnotationSelector
                | undefined;
              const bounds = selector?.geometry?.bounds;
              if (bounds) {
                const padFactor = 1.2;
                const cx = (bounds.minX + bounds.maxX) / 2;
                const cy = (bounds.minY + bounds.maxY) / 2;
                const w = Math.max(1, (bounds.maxX - bounds.minX) * padFactor);
                const h = Math.max(1, (bounds.maxY - bounds.minY) * padFactor);
                const minX = cx - w / 2;
                const minY = cy - h / 2;

                const rect = viewer.viewport.imageToViewportRectangle(
                  minX,
                  minY,
                  w,
                  h,
                );
                viewer.viewport.fitBounds(rect, false);
              }
            }
            return;
          }

          // Edit mode: selecting sets currentShape (existing behavior)
          const shape = await annotationToShape(annotation);
          if (shape && onCurrentShapeUpdate) onCurrentShapeUpdate(shape);
        } else if (!isDrawingEnabled) {
          // Снято выделение и мы не в режиме редактирования
          if (mode === "view") {
            setSelectedAnnotationId(null);
            onSelectAnnotationId?.(null);
          } else {
            onCurrentShapeUpdate?.(null);
          }
        }
      };

      const handleClickAnnotation = (annotation: Annotation) => {
        lastAnnotationClickTsRef.current = Date.now();
        if (annotation?.id) {
          onClickAnnotationId?.(annotation.id);
        }
      };

      if (mode !== "view") {
        annotator.on("createAnnotation", handleCreate);
        annotator.on("updateAnnotation", handleUpdate);
        annotator.on("deleteAnnotation", handleDelete);
      }
      annotator.on("clickAnnotation", handleClickAnnotation);
      annotator.on("selectionChanged", handleSelectionChanged);

      return () => {
        if (mode !== "view") {
          annotator.off("createAnnotation", handleCreate);
          annotator.off("updateAnnotation", handleUpdate);
          annotator.off("deleteAnnotation", handleDelete);
        }
        annotator.off("clickAnnotation", handleClickAnnotation);
        annotator.off("selectionChanged", handleSelectionChanged);
      };
    }, [
      annotator,
      onClickAnnotationId,
      onCurrentShapeUpdate,
      annotationToShape,
      isDrawingEnabled,
      currentShape,
      mode,
      onSelectAnnotationId,
      zoomToSelection,
      viewer,
    ]);

    // Стиль для аннотаций (используем функцию для динамического стиля)
    const annotationStyle = useCallback(
      (annotation: Annotation): DrawingStyle => {
        const base = getStyleById?.(annotation.id) ?? {};
        const isSelected =
          (mode === "view" &&
            selectedAnnotationId &&
            annotation.id === selectedAnnotationId) ||
          (mode !== "view" &&
            currentShape &&
            annotation.id === currentShape.id);

        const baseFillOpacity = base.fillOpacity ?? (isSelected ? 0.5 : 0.25);
        const baseStrokeWidth = base.strokeWidth ?? 2;

        return {
          fill: base.fill ?? (isSelected ? "#3b82f6" : "#00ff00"),
          fillOpacity: isSelected
            ? Math.min(1, baseFillOpacity + 0.15)
            : baseFillOpacity,
          stroke: base.stroke ?? (isSelected ? "#3b82f6" : "#00ff00"),
          strokeOpacity: base.strokeOpacity ?? 1,
          strokeWidth: isSelected
            ? Math.max(baseStrokeWidth, 3)
            : baseStrokeWidth,
        };
      },
      [currentShape, getStyleById, mode, selectedAnnotationId],
    );

    // Labels (viewer mode): render as OSD overlays anchored to polygon visual centers
    useEffect(() => {
      if (mode !== "view") return;
      if (!showLabels) return;
      if (!viewer) return;
      if (!labelsById) return;

      let cancelled = false;

      const clear = () => {
        labelOverlaysRef.current.forEach((el) => {
          try {
            viewer.removeOverlay(el);
          } catch {
            // ignore
          }
        });
        labelOverlaysRef.current = [];
      };

      const run = async () => {
        clear();

        const { width, height } = await getEffectiveImageSize();
        if (cancelled) return;

        const overlays: HTMLElement[] = [];

        for (const shape of shapes) {
          const labelRaw = labelsById[shape.id];
          const label =
            labelRaw === null || labelRaw === undefined ? "" : String(labelRaw);
          if (!label) continue;
          if (!shape.points || shape.points.length < 3) continue;

          const inPixels = shapeToPixels(shape, width, height);
          const center = polylabel(
            [inPixels.points.map((p) => [p.x, p.y])],
            0.5,
          );
          const cx = center?.[0];
          const cy = center?.[1];
          if (typeof cx !== "number" || typeof cy !== "number") continue;

          const el = document.createElement("div");
          el.textContent = label;
          el.style.transform = "translate(-50%, -50%)";
          el.style.color = "#ffffff";
          el.style.fontWeight = "700";
          el.style.fontSize = "12px";
          el.style.lineHeight = "1";
          el.style.textShadow = "1px 1px 2px rgba(0,0,0,0.7)";
          el.style.pointerEvents = "none";
          el.style.userSelect = "none";
          el.style.whiteSpace = "nowrap";

          const location = viewer.viewport.imageToViewportCoordinates(cx, cy);
          viewer.addOverlay(el, location);
          overlays.push(el);
        }

        labelOverlaysRef.current = overlays;
      };

      void run();

      return () => {
        cancelled = true;
        clear();
      };
    }, [getEffectiveImageSize, labelsById, mode, shapes, showLabels, viewer]);

    useEffect(() => {
      if (mode === "view") return;
      if (!viewer) return;

      const clearVertexOverlays = () => {
        vertexOverlaysRef.current.forEach((overlay) => {
          try {
            viewer.removeOverlay(overlay);
          } catch {
            // ignore
          }
        });
        vertexOverlaysRef.current = [];
      };

      if (!currentShape || currentShape.points.length === 0) {
        clearVertexOverlays();
        return;
      }

      let cancelled = false;

      const renderVertexOverlays = async () => {
        const { width, height } = await getEffectiveImageSize();
        if (cancelled) return;

        const shapeInPixels = shapeToPixels(currentShape, width, height);
        if (!shapeInPixels.points.length) {
          clearVertexOverlays();
          return;
        }

        clearVertexOverlays();
        const nextOverlays: HTMLElement[] = [];

        shapeInPixels.points.forEach((point, index) => {
          const isActive =
            selectedVertexIndex !== null && selectedVertexIndex === index;
          const overlayEl = document.createElement("div");

          overlayEl.style.width = isActive ? "14px" : "8px";
          overlayEl.style.height = isActive ? "14px" : "8px";
          overlayEl.style.borderRadius = "9999px";
          overlayEl.style.border = isActive
            ? "2px solid #ffffff"
            : "1px solid #ffffff";
          overlayEl.style.background = isActive ? "#2563eb" : "#ef4444";
          overlayEl.style.boxShadow = isActive
            ? "0 0 0 2px rgba(37,99,235,0.35)"
            : "0 0 0 1px rgba(239,68,68,0.35)";
          overlayEl.style.transform = "translate(-50%, -50%)";
          overlayEl.style.pointerEvents = "none";
          overlayEl.style.zIndex = isActive ? "30" : "20";

          const location = viewer.viewport.imageToViewportCoordinates(
            point.x,
            point.y,
          );
          viewer.addOverlay(overlayEl, location);
          nextOverlays.push(overlayEl);
        });

        vertexOverlaysRef.current = nextOverlays;
      };

      void renderVertexOverlays();

      return () => {
        cancelled = true;
        clearVertexOverlays();
      };
    }, [
      currentShape,
      getEffectiveImageSize,
      mode,
      selectedVertexIndex,
      viewer,
    ]);

    // Force Annotorious to commit in-progress handle edits on every pointerup.
    // Annotorious only fires `updateAnnotation` when the annotation is deselected,
    // so we briefly deselect and reselect to flush pending geometry changes.
    useEffect(() => {
      if (mode === "view" || isDrawingEnabled || !annotator) return;

      const hostEl = viewerHostRef.current;
      if (!hostEl) return;

      const handlePointerUp = () => {
        // Prevent stale deselect/reselect when user quickly switches polygons.
        if (Date.now() - lastAnnotationClickTsRef.current < 220) return;
        const id = prevCurrentShapeIdRef.current;
        if (!id) return;
        queueMicrotask(() => {
          const rafId = window.requestAnimationFrame(() => {
            if (Date.now() - lastAnnotationClickTsRef.current < 220) return;
            try {
              annotator.setSelected();
            } catch {
              // ignore
            }
            const secondTimeoutId = window.setTimeout(() => {
              if (Date.now() - lastAnnotationClickTsRef.current < 220) return;
              if (id !== prevCurrentShapeIdRef.current) return;
              try {
                annotator.setSelected(id, true);
              } catch {
                // ignore
              }
            }, 60);
            pointerFlushTimeoutsRef.current.push(secondTimeoutId);
          });
          pointerFlushTimeoutsRef.current.push(rafId);
        });
      };

      hostEl.addEventListener("pointerup", handlePointerUp);
      return () => {
        hostEl.removeEventListener("pointerup", handlePointerUp);
        clearTimeoutIds(pointerFlushTimeoutsRef.current);
      };
    }, [annotator, clearTimeoutIds, isDrawingEnabled, mode]);

    return (
      <div
        ref={viewerHostRef}
        className="relative flex h-full w-full flex-col gap-2"
      >
        {/* Область аннотирования */}
        <div className="flex-1 overflow-hidden rounded-lg border">
          <OpenSeadragonAnnotator
            style={annotationStyle}
            drawingMode="click"
            drawingEnabled={isDrawingEnabled}
            tool={mode === "view" || !isDrawingEnabled ? undefined : "polygon"}
            userSelectAction={
              mode === "view" ? UserSelectAction.SELECT : UserSelectAction.EDIT
            }
          >
            <OpenSeadragonViewer options={options} className="h-full w-full" />
          </OpenSeadragonAnnotator>
        </div>
      </div>
    );
  },
);

AnnotatorContent.displayName = "AnnotatorContent";

const PolygonAnnotator = forwardRef<PolygonAnnotatorRef, PolygonAnnotatorProps>(
  (props, ref) => {
    if (props.engine === "controlled") {
      return <ControlledPolygonAnnotator {...props} ref={ref} />;
    }

    return (
      <div className={props.className ?? "h-[600px] w-full"}>
        <Annotorious>
          <AnnotatorContent {...props} ref={ref} />
        </Annotorious>
      </div>
    );
  },
);

PolygonAnnotator.displayName = "PolygonAnnotator";

export default PolygonAnnotator;

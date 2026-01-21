import { useMemo, useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
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
    UserSelectAction
} from '@annotorious/react';
import '@annotorious/react/annotorious-react.css';
import { Shape, Point } from './GeometryShapes';
import { getImageSize, shapeToPercents, shapeToPixels } from '@/hooks/use-polygon';
import polylabel from 'polylabel';

// Тип для selector с геометрией
interface AnnotationSelector {
    type: 'POLYGON' | 'RECTANGLE';
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
    onCurrentShapeUpdate?: (shape: Shape | null) => void;
    drawingEnabled?: boolean;
    mode?: 'edit' | 'view';
    onSelectAnnotationId?: (id: string | null) => void;
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

const AnnotatorContent = forwardRef<PolygonAnnotatorRef, PolygonAnnotatorProps>(({
    imageUrl,
    shapes = [],
    currentShape,
    onCurrentShapeUpdate,
    drawingEnabled = true,
    mode = 'edit',
    onSelectAnnotationId,
    onHoverAnnotationId,
    zoomToSelection = false,
    getStyleById,
    showLabels = false,
    labelsById
}, ref) => {
    const annotations = useAnnotations<Annotation>();
    const annotator = useAnnotator();
    const viewer = useViewer();
    const hovered = useHover<Annotation>();
    
    const prevShapesRef = useRef<Shape[]>([]);
    const prevCurrentShapeIdRef = useRef<string | null>(null);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
    const labelOverlaysRef = useRef<HTMLElement[]>([]);
    const prevHoverIdRef = useRef<string | null>(null);

    // View mode: propagate hover changes (for external tooltips)
    useEffect(() => {
        if (mode !== 'view') return;
        const nextId = hovered?.id ?? null;
        if (prevHoverIdRef.current === nextId) return;
        prevHoverIdRef.current = nextId;
        onHoverAnnotationId?.(nextId);
    }, [hovered, mode, onHoverAnnotationId]);

    const convertShapeToAnnotation = useCallback(async (shape: Shape): Promise<Annotation> => {
        const { width, height } = await getImageSize(imageUrl);

        // Конвертируем shape в пиксели
        const inPixels = shapeToPixels(shape, width, height);

        // Вычисляем bounds
        const xCoords = inPixels.points.map(p => p.x);
        const yCoords = inPixels.points.map(p => p.y);
        const bounds = {
            minX: Math.min(...xCoords),
            minY: Math.min(...yCoords),
            maxX: Math.max(...xCoords),
            maxY: Math.max(...yCoords)
        };

        // Преобразуем точки в формат [[x, y], [x, y], ...]
        const points = inPixels.points.map(p => [p.x, p.y]);

        // Создаем аннотацию в нужном формате
        const annotation: Annotation = {
            id: shape.id,
            bodies: [],
            target: {
                annotation: shape.id,
                selector: {
                    type: 'POLYGON',
                    geometry: {
                        bounds,
                        points
                    }
                },
                creator: {
                    isGuest: true,
                    id: 'system'
                },
                created: new Date()
            }
        };

        return annotation;
    }, [imageUrl]);

    const annotationToShape = useCallback(async (annotation: Annotation): Promise<Shape | null> => {
        try {
            const { width, height } = await getImageSize(imageUrl);

            // Извлекаем геометрию из аннотации
            const selector = annotation.target.selector as AnnotationSelector;

            if (!selector || !selector.geometry) {
                console.warn('Invalid annotation selector:', annotation);
                return null;
            }

            const geometry = selector.geometry;
            let pointsInPixels: Point[] = [];

            // Обрабатываем разные типы геометрии
            if (selector.type === 'POLYGON' && geometry.points) {
                // Для полигона точки уже есть в формате [[x, y], ...]
                pointsInPixels = geometry.points.map(([x, y]: [number, number]) => ({ x, y }));
            } else if (selector.type === 'RECTANGLE' && geometry.bounds) {
                // Для прямоугольника создаем точки из bounds
                const { minX, minY, maxX, maxY } = geometry.bounds;
                pointsInPixels = [
                    { x: minX, y: minY },
                    { x: maxX, y: minY },
                    { x: maxX, y: maxY },
                    { x: minX, y: maxY }
                ];
            } else {
                console.warn('Unknown geometry type:', selector.type);
                return null;
            }

            // Создаем shape в пикселях
            const shapeInPixels: Shape = {
                id: annotation.id,
                type: selector.type === 'RECTANGLE' ? 'rectangle' : 'polygon',
                points: pointsInPixels,
                color: '#00ff00',
                isSelected: false
            };

            // Конвертируем из пикселей в проценты
            const shapeInPercents = shapeToPercents(shapeInPixels, width, height);

            return shapeInPercents;
        } catch (error) {
            console.error('Error converting annotation to shape:', error);
            return null;
        }
    }, [imageUrl]);

    // Экспортируем метод для получения актуального currentShape из аннотатора
    useImperativeHandle(ref, () => ({
        getCurrentShape: async () => {
            
            if (!annotator) {
                return null;
            }
            
            if (!currentShape) {
                // Пытаемся получить первую аннотацию, если currentShape нет
                if (annotations.length > 0) {
                    const shape = await annotationToShape(annotations[0] as Annotation);
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
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Получаем все аннотации и находим нужную по ID
                const allAnnotations = annotations;
                const updatedAnnotation = allAnnotations.find(a => a.id === currentShapeId);
                
                if (updatedAnnotation) {
                    // Конвертируем аннотацию в Shape с актуальными координатами
                    const shape = await annotationToShape(updatedAnnotation as Annotation);
                    
                    // Восстанавливаем выделение
                    annotator.setSelected(currentShapeId);
                    
                    return shape;
                }
                
                // Если не нашли аннотацию, возвращаем currentShape
                return currentShape;
            } catch (error) {
                console.error('[getCurrentShape] Error:', error);
                return currentShape;
            }
        }
    }), [annotator, currentShape, annotationToShape, annotations]);

    // IMPORTANT! Memo-ize your options to avoid
    // unexpected re-renders of the OSD viewer.
    const options = useMemo(() => ({
        tileSources: {
            type: 'image',
            url: imageUrl
        },
        // OpenSeadragon настройки для правильного отображения
        showNavigationControl: true,
        showNavigator: true,
        navigatorPosition: 'BOTTOM_RIGHT',
        defaultZoomLevel: 0.5,
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
            pinchToZoom: true
        },
        gestureSettingsTouch: {
            clickToZoom: false,
            dblClickToZoom: false,
            pinchToZoom: true
        }
    }), [imageUrl]);



    const saveShapesToAnnotations = useCallback(async (shapes: Shape[]) => {
        const annotations = await Promise.all(shapes.map(convertShapeToAnnotation));
        annotator.setAnnotations(annotations, true);
    }, [annotator, convertShapeToAnnotation]);

    // Синхронизируем shapes при изменении списка (не при каждом рендере)
    useEffect(() => {
        if (!annotator) return;
        
        // Проверяем, изменились ли ID shapes
        const shapesIds = shapes.map(s => s.id).sort().join(',');
        const prevShapesIds = prevShapesRef.current.map(s => s.id).sort().join(',');
        
        // Если ID не изменились, ничего не делаем (избегаем циклических обновлений)
        if (shapesIds === prevShapesIds && prevShapesRef.current.length > 0) {
            return;
        }
        
        prevShapesRef.current = shapes;
        
        // Показываем только неактивные shapes (фоновые)
        const backgroundShapes = shapes
            .filter(shape => !currentShape || shape.id !== currentShape.id)
            .map(shape => ({ ...shape, isSelected: false }));
        
        saveShapesToAnnotations(backgroundShapes);
    }, [shapes, annotator, saveShapesToAnnotations, currentShape]);
    
    // Отдельно обрабатываем изменение currentShape (когда начинаем/завершаем редактирование)
    useEffect(() => {
        if (!annotator) return;
        
        const currentShapeId = currentShape?.id || null;
        
        // Если ID currentShape не изменился, ничего не делаем
        if (currentShapeId === prevCurrentShapeIdRef.current) {
            return;
        }
        
        prevCurrentShapeIdRef.current = currentShapeId;
        
        // Показываем все shapes: фоновые + текущий редактируемый
        const allShapes: Shape[] = [];
        
        shapes.forEach(shape => {
            if (!currentShape || shape.id !== currentShape.id) {
                allShapes.push({ ...shape, isSelected: false });
            }
        });
        
        if (currentShape && currentShape.points.length > 0) {
            allShapes.push({ ...currentShape, isSelected: true });
        }
        
        saveShapesToAnnotations(allShapes).then(() => {
            // После загрузки аннотаций, выделяем currentShape для редактирования
            if (currentShape && currentShape.id) {
                setTimeout(() => {
                    const annotation = annotations.find(a => a.id === currentShape.id);
                    if (annotation) {
                        annotator.setSelected(annotation.id);
                    }
                }, 100);
            } else {
                // Снимаем выделение если currentShape === null
                annotator.setSelected();
            }
        });
    }, [currentShape, shapes, annotator, saveShapesToAnnotations, annotations]);






    // Подписываемся на события создания/обновления/выделения аннотаций
    useEffect(() => {
        if (!annotator) return;

        const handleCreate = async (annotation: Annotation) => {
            const shape = await annotationToShape(annotation);
            
            if (shape) {
                // Если мы в режиме редактирования и создаем новый полигон
                if (drawingEnabled && onCurrentShapeUpdate) {
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
                if (currentShape && annotation.id === currentShape.id && onCurrentShapeUpdate) {
                    // Сохраняем статус isSelected при обновлении
                    const updatedShape = { ...shape, isSelected: currentShape.isSelected };
                    onCurrentShapeUpdate(updatedShape);
                }
            }
        };

        const handleDelete = (annotation: Annotation) => {
            
            // Если удалили currentShape, сбрасываем его
            if (currentShape && annotation.id === currentShape.id && onCurrentShapeUpdate) {
                onCurrentShapeUpdate(null);
            }
        };

        const handleSelectionChanged = async (selected: Annotation[]) => {
            
            if (selected.length > 0) {
                const annotation = selected[0];
                const selectedId = annotation?.id ?? null;

                // Viewer mode: selection only (+ optional zoom), no editing callbacks
                if (mode === 'view') {
                    setSelectedAnnotationId(selectedId);
                    onSelectAnnotationId?.(selectedId);

                    if (zoomToSelection && viewer && annotation) {
                        const selector = annotation.target?.selector as AnnotationSelector | undefined;
                        const bounds = selector?.geometry?.bounds;
                        if (bounds) {
                            const padFactor = 1.2;
                            const cx = (bounds.minX + bounds.maxX) / 2;
                            const cy = (bounds.minY + bounds.maxY) / 2;
                            const w = Math.max(1, (bounds.maxX - bounds.minX) * padFactor);
                            const h = Math.max(1, (bounds.maxY - bounds.minY) * padFactor);
                            const minX = cx - w / 2;
                            const minY = cy - h / 2;

                            const rect = viewer.viewport.imageToViewportRectangle(minX, minY, w, h);
                            viewer.viewport.fitBounds(rect, false);
                        }
                    }
                    return;
                }

                // Edit mode: selecting sets currentShape (existing behavior)
                const shape = await annotationToShape(annotation);
                if (shape && onCurrentShapeUpdate) onCurrentShapeUpdate(shape);
            } else if (!drawingEnabled) {
                // Снято выделение и мы не в режиме редактирования
                if (mode === 'view') {
                    setSelectedAnnotationId(null);
                    onSelectAnnotationId?.(null);
                } else {
                    onCurrentShapeUpdate?.(null);
                }
            }
        };

        if (mode !== 'view') {
            annotator.on('createAnnotation', handleCreate);
            annotator.on('updateAnnotation', handleUpdate);
            annotator.on('deleteAnnotation', handleDelete);
        }
        annotator.on('selectionChanged', handleSelectionChanged);
        
        

        return () => {
            if (mode !== 'view') {
                annotator.off('createAnnotation', handleCreate);
                annotator.off('updateAnnotation', handleUpdate);
                annotator.off('deleteAnnotation', handleDelete);
            }
            annotator.off('selectionChanged', handleSelectionChanged);
        };
    }, [
        annotator,
        onCurrentShapeUpdate,
        annotationToShape,
        drawingEnabled,
        currentShape,
        mode,
        onSelectAnnotationId,
        zoomToSelection,
        viewer
    ]);

    // Стиль для аннотаций (используем функцию для динамического стиля)
    const annotationStyle = useCallback((annotation: Annotation): DrawingStyle => {
        const base = getStyleById?.(annotation.id) ?? {};
        const isSelected =
            (mode === 'view' && selectedAnnotationId && annotation.id === selectedAnnotationId) ||
            (mode !== 'view' && currentShape && annotation.id === currentShape.id);

        const baseFillOpacity = base.fillOpacity ?? (isSelected ? 0.5 : 0.25);
        const baseStrokeWidth = base.strokeWidth ?? 2;

        return {
            fill: base.fill ?? (isSelected ? '#3b82f6' : '#00ff00'),
            fillOpacity: isSelected ? Math.min(1, baseFillOpacity + 0.15) : baseFillOpacity,
            stroke: base.stroke ?? (isSelected ? '#3b82f6' : '#00ff00'),
            strokeOpacity: base.strokeOpacity ?? 1,
            strokeWidth: isSelected ? Math.max(baseStrokeWidth, 3) : baseStrokeWidth,
        };
    }, [currentShape, getStyleById, mode, selectedAnnotationId]);

    // Labels (viewer mode): render as OSD overlays anchored to polygon visual centers
    useEffect(() => {
        if (mode !== 'view') return;
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

            const { width, height } = await getImageSize(imageUrl);
            if (cancelled) return;

            const overlays: HTMLElement[] = [];

            for (const shape of shapes) {
                const labelRaw = labelsById[shape.id];
                const label = labelRaw === null || labelRaw === undefined ? '' : String(labelRaw);
                if (!label) continue;
                if (!shape.points || shape.points.length < 3) continue;

                const inPixels = shapeToPixels(shape, width, height);
                const center = polylabel([inPixels.points.map(p => [p.x, p.y])], 0.5);
                const cx = center?.[0];
                const cy = center?.[1];
                if (typeof cx !== 'number' || typeof cy !== 'number') continue;

                const el = document.createElement('div');
                el.textContent = label;
                el.style.transform = 'translate(-50%, -50%)';
                el.style.color = '#ffffff';
                el.style.fontWeight = '700';
                el.style.fontSize = '12px';
                el.style.lineHeight = '1';
                el.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
                el.style.pointerEvents = 'none';
                el.style.userSelect = 'none';
                el.style.whiteSpace = 'nowrap';

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
    }, [imageUrl, labelsById, mode, shapes, showLabels, viewer]);




    return (
        <div className="h-full w-full flex flex-col gap-2">
        

       

            {/* Область аннотирования */}
            <div className="flex-1 border rounded-lg overflow-hidden">
                <OpenSeadragonAnnotator
                    tool={mode === 'view' ? null : 'polygon'}
                    style={annotationStyle}
                    drawingEnabled={mode === 'view' ? false : drawingEnabled}
                    userSelectAction={mode === 'view' ? UserSelectAction.SELECT : undefined}
                >
                    <OpenSeadragonViewer
                        options={options}
                        className="w-full h-full"
                    />
                </OpenSeadragonAnnotator>
            </div>
        </div>
    );
});

AnnotatorContent.displayName = 'AnnotatorContent';

const PolygonAnnotator = forwardRef<PolygonAnnotatorRef, PolygonAnnotatorProps>((props, ref) => {
    return (
        <div className={props.className ?? "h-[600px] w-full"}>
            <Annotorious>
                <AnnotatorContent {...props} ref={ref} />
            </Annotorious>
        </div>
    );
});

PolygonAnnotator.displayName = 'PolygonAnnotator';

export default PolygonAnnotator;
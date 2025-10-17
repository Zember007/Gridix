import { useMemo, useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import {
    Annotorious,
    ImageAnnotation,
    OpenSeadragonAnnotator,
    OpenSeadragonViewer,
    useAnnotations,
    useAnnotator,
    DrawingStyle,
    Annotation
} from '@annotorious/react';
import '@annotorious/react/annotorious-react.css';
import { Button } from '@/components/ui/button';
import { Shape, Point } from './GeometryShapes';
import { getImageSize, shapeToPercents, shapeToPixels } from '@/hooks/use-polygon';

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
    showToolbar?: boolean;
    drawingEnabled?: boolean;
}

export interface PolygonAnnotatorRef {
    getCurrentShape: () => Promise<Shape | null>;
}

const AnnotatorContent = forwardRef<PolygonAnnotatorRef, PolygonAnnotatorProps>(({
    imageUrl,
    shapes = [],
    currentShape,
    onCurrentShapeUpdate,
    showToolbar = true,
    drawingEnabled = true
}, ref) => {
    const annotations = useAnnotations();
    const annotator = useAnnotator();
    const [drawingTool, setDrawingTool] = useState<'rectangle' | 'polygon'>('polygon');
    const isInternalUpdate = useRef(false);
    const prevShapesRef = useRef<Shape[]>([]);
    const prevCurrentShapeIdRef = useRef<string | null>(null);

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
            if (!annotator || !currentShape) return null;
            
            // Сохраняем ID текущей аннотации
            const currentShapeId = currentShape.id;
            
            // Программно снимаем выделение, чтобы закоммитить все изменения
            annotator.setSelected();
            
            // Небольшая задержка для применения изменений
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Получаем все аннотации и находим нужную по ID
            const allAnnotations = annotations;
            const updatedAnnotation = allAnnotations.find(a => a.id === currentShapeId);
            
            if (updatedAnnotation) {
                // Конвертируем аннотацию в Shape с актуальными координатами
                const shape = await annotationToShape(updatedAnnotation as ImageAnnotation);
                
                // Восстанавливаем выделение
                annotator.setSelected(currentShapeId);
                
                return shape;
            }
            
            // Если не нашли аннотацию, возвращаем currentShape
            return currentShape;
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
        defaultZoomLevel: 1,
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



    // Этот useEffect больше не нужен - мы не синхронизируем обратно в родителя
    // из-за аннотаций, которые сами пришли от родителя. Обновления идут только
    // через события создания/обновления/удаления аннотаций пользователем.

    // Функция для конвертации Shape в Annotation



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
        
        console.log('Shapes IDs changed, updating annotator');
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
        
        console.log('CurrentShape ID changed:', prevCurrentShapeIdRef.current, '->', currentShapeId);
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
                        console.log('Selecting annotation for editing:', currentShape.id);
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

        const handleCreate = async (annotation: ImageAnnotation) => {
            console.log('Annotation created:', annotation);
            const shape = await annotationToShape(annotation);
            
            if (shape) {
                // Если мы в режиме редактирования и создаем новый полигон
                if (drawingEnabled && onCurrentShapeUpdate) {
                    onCurrentShapeUpdate(shape);
                }
            }
        };

        const handleUpdate = async (annotation: ImageAnnotation) => {
            console.log('Annotation updated:', annotation);
            const shape = await annotationToShape(annotation);
            
            if (shape) {
                // Если обновляемая аннотация - это currentShape
                if (currentShape && annotation.id === currentShape.id && onCurrentShapeUpdate) {
                    onCurrentShapeUpdate(shape);
                }
            }
        };

        const handleDelete = (annotation: ImageAnnotation) => {
            console.log('Annotation deleted:', annotation);
            
            // Если удалили currentShape, сбрасываем его
            if (currentShape && annotation.id === currentShape.id && onCurrentShapeUpdate) {
                onCurrentShapeUpdate(null);
            }
        };

        const handleSelectionChanged = async (selected: ImageAnnotation[]) => {
            console.log('Selection changed:', selected);
            
            if (selected.length > 0) {
                // Пользователь выделил аннотацию - делаем её currentShape
                const annotation = selected[0];
                const shape = await annotationToShape(annotation);
                
                if (shape && onCurrentShapeUpdate) {
                    console.log('Setting currentShape from selection:', shape);
                    onCurrentShapeUpdate(shape);
                }
            } else if (!drawingEnabled) {
                // Снято выделение и мы не в режиме редактирования
                if (onCurrentShapeUpdate) {
                    onCurrentShapeUpdate(null);
                }
            }
        };

        annotator.on('createAnnotation', handleCreate);
        annotator.on('updateAnnotation', handleUpdate);
        annotator.on('deleteAnnotation', handleDelete);
        annotator.on('selectionChanged', handleSelectionChanged);
        
        

        return () => {
            annotator.off('createAnnotation', handleCreate);
            annotator.off('updateAnnotation', handleUpdate);
            annotator.off('deleteAnnotation', handleDelete);
            annotator.off('selectionChanged', handleSelectionChanged);
        };
    }, [annotator, onCurrentShapeUpdate, annotationToShape, drawingEnabled, currentShape]);

    // Стиль для аннотаций (используем функцию для динамического стиля)
    const annotationStyle = useCallback((annotation: ImageAnnotation): DrawingStyle => {
        // Если аннотация соответствует currentShape, выделяем её
        const isEditing = currentShape && annotation.id === currentShape.id;
        
        return {
            fill: isEditing ? '#3b82f688' : '#00ff0044',
            stroke: isEditing ? '#3b82f6' : '#00ff00',
            strokeWidth: isEditing ? 3 : 2
        };
    }, [currentShape]);




    return (
        <div className="h-full w-full flex flex-col gap-2">
            {/* Панель инструментов */}
            {showToolbar && (
                <div className="flex gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Button
                        onClick={() => setDrawingTool('rectangle')}
                        variant={drawingTool === 'rectangle' ? 'default' : 'outline'}
                        size="sm"
                    >
                        Прямоугольник
                    </Button>
                    <Button
                        onClick={() => setDrawingTool('polygon')}
                        variant={drawingTool === 'polygon' ? 'default' : 'outline'}
                        size="sm"
                    >
                        Полигон
                    </Button>
                    <div className="flex-1" />
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        Аннотаций: {annotations.length}
                    </div>
                </div>
            )}

       

            {/* Область аннотирования */}
            <div className="flex-1 border rounded-lg overflow-hidden">
                <OpenSeadragonAnnotator
                    tool={drawingTool}
                    style={annotationStyle}
                    drawingEnabled={drawingEnabled}
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
        <div className="h-[600px] w-full">
            <Annotorious>
                <AnnotatorContent {...props} ref={ref} />
            </Annotorious>
        </div>
    );
});

PolygonAnnotator.displayName = 'PolygonAnnotator';

export default PolygonAnnotator;
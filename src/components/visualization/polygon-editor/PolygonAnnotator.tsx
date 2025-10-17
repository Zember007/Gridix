import { useMemo, useEffect, useState, useCallback } from 'react';
import {
    Annotorious,
    ImageAnnotation,
    OpenSeadragonAnnotator,
    OpenSeadragonViewer,
    useAnnotations,
    useAnnotator,
    DrawingStyle,
    RectangleGeometry,
    PolygonGeometry
} from '@annotorious/react';
import '@annotorious/react/annotorious-react.css';
import { Button } from '@/components/ui/button';
import { Shape, Point } from './GeometryShapes';

interface PolygonAnnotatorProps {
    imageUrl: string;
    shapes?: Shape[];
    currentShape?: Shape | null;
    onShapeUpdate?: (shapes: Shape[]) => void;
    onCurrentShapeUpdate?: (shape: Shape | null) => void;
    showToolbar?: boolean;
}

const AnnotatorContent = ({ 
    imageUrl, 
    shapes = [],
    currentShape,
    onShapeUpdate,
    onCurrentShapeUpdate,
    showToolbar = true
}: PolygonAnnotatorProps) => {
    const annotations = useAnnotations();
    const annotator = useAnnotator();
    const [drawingTool, setDrawingTool] = useState<'rectangle' | 'polygon'>('polygon');

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

    // Конвертируем ImageAnnotation в Shape
    const annotationToShape = useCallback((annotation: ImageAnnotation): Shape | null => {
        try {
            const target = annotation.target;
            if (!target.selector) return null;

            const selector = target.selector;
            let points: Point[] = [];

            // Обрабатываем разные типы селекторов
            if ('geometry' in selector) {
                const geometry = selector.geometry;
                
                // Rectangle shape
                if ('x' in geometry && 'y' in geometry && 'w' in geometry && 'h' in geometry) {
                    const rectGeometry = geometry.bounds;
                    const { minX, minY, maxX, maxY } = rectGeometry;
                    // Преобразуем прямоугольник в 4 точки полигона
                    points = [
                        { x: minX, y: minY },
                        { x: maxX, y: minY },
                        { x: maxX, y: maxY },
                        { x: minX, y: maxY }
                    ];
                } 
                // Polygon shape
                else if ('points' in geometry) {
                    const polyGeometry = geometry as PolygonGeometry;
                    // PolygonGeometry.points это Array<Array<number>>, где каждый внутренний массив [x, y]
                    // Преобразуем в массив Point объектов
                    points = polyGeometry.points.map((pointArray: number[]) => ({
                        x: pointArray[0],
                        y: pointArray[1]
                    }));
                }
            }

            if (points.length === 0) return null;

            return {
                id: annotation.id,
                type: 'polygon',
                points,
                color: '#3b82f6',
                isSelected: false
            };
        } catch (error) {
            console.error('Error converting annotation to shape:', error);
            return null;
        }
    }, []);

    // Синхронизируем аннотации с внешним состоянием shapes
    useEffect(() => {
        if (!annotator || !onShapeUpdate) return;

        const shapes = annotations
            .map(annotationToShape)
            .filter((s): s is Shape => s !== null);
        
        if (shapes.length > 0) {
            onShapeUpdate(shapes);
        }
    }, [annotations, annotator, onShapeUpdate, annotationToShape]);

    // Логируем аннотации для отладки
    useEffect(() => {
        console.log('Current annotations:', annotations);
        console.log('Current shapes:', shapes);
    }, [annotations, shapes]);

    // Подписываемся на события создания/обновления аннотаций
    useEffect(() => {
        if (!annotator) return;

        const handleCreate = (annotation: ImageAnnotation) => {
            console.log('Annotation created:', annotation);
            const shape = annotationToShape(annotation);
            if (shape && onCurrentShapeUpdate) {
                onCurrentShapeUpdate(shape);
            }
        };

        const handleUpdate = (annotation: ImageAnnotation) => {
            console.log('Annotation updated:', annotation);
            const shape = annotationToShape(annotation);
            if (shape && onCurrentShapeUpdate) {
                onCurrentShapeUpdate(shape);
            }
        };

        const handleDelete = (annotation: ImageAnnotation) => {
            console.log('Annotation deleted:', annotation);
            if (onCurrentShapeUpdate) {
                onCurrentShapeUpdate(null);
            }
        };

        annotator.on('createAnnotation', handleCreate);
        annotator.on('updateAnnotation', handleUpdate);
        annotator.on('deleteAnnotation', handleDelete);

        return () => {
            annotator.off('createAnnotation', handleCreate);
            annotator.off('updateAnnotation', handleUpdate);
            annotator.off('deleteAnnotation', handleDelete);
        };
    }, [annotator, onCurrentShapeUpdate, annotationToShape]);

    // Стиль для аннотаций
    const annotationStyle = useMemo((): DrawingStyle => ({
        fill: '#00ff0088',
        stroke: '#00ff00',
        strokeWidth: 2
    }), []);

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
                    drawingEnabled={true}
                >
                    <OpenSeadragonViewer
                        options={options}
                        className="w-full h-full"
                    />
                </OpenSeadragonAnnotator>
            </div>
        </div>
    );
};

const PolygonAnnotator = (props: PolygonAnnotatorProps) => {
    return (
        <div className="h-[600px] w-full">
            <Annotorious>
                <AnnotatorContent {...props} />
            </Annotorious>
        </div>
    );
};

export default PolygonAnnotator;
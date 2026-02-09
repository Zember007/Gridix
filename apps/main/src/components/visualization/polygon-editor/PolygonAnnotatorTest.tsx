'use client';

import { useMemo } from 'react';
import {
    Annotorious,
    OpenSeadragonAnnotator,
    OpenSeadragonViewer,
    DrawingStyle,
    Annotation,
    UserSelectAction
} from '@annotorious/react';
import '@annotorious/react/annotorious-react.css';

const TEST_IMAGE_URL =
    'https://cednalyslckqlqctuzfs.supabase.co/storage/v1/object/public/project-images/81a92689-74d7-48e4-b0a5-ab9c7bfdeb95-facade-1770297824619.webp';

const defaultStyle: DrawingStyle = {
    fill: '#3b82f6',
    fillOpacity: 0.25,
    stroke: '#3b82f6',
    strokeOpacity: 1,
    strokeWidth: 2
};

/**
 * Тестовый компонент для отрисовки полигонов на изображении.
 * Без логики синхронизации, currentShape, колбэков — только рисование.
 */
function PolygonAnnotatorTestContent() {
    const options = useMemo(
        () => ({
            tileSources: {
                type: 'image',
                url: TEST_IMAGE_URL
            },

        }),
        []
    );

    const annotationStyle = useMemo((): ((annotation: Annotation) => DrawingStyle) => {
        return () => defaultStyle;
    }, []);


    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex-1 border rounded-lg overflow-hidden min-h-[400px]">
                <OpenSeadragonAnnotator
                    userSelectAction={UserSelectAction.EDIT}
                    style={annotationStyle}
                    tool="polygon"
                    drawingMode="click"
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
}

export default function PolygonAnnotatorTest() {
    return (
        <div className="h-[600px] w-full">
            <Annotorious>
                <PolygonAnnotatorTestContent />
            </Annotorious>
        </div>
    );
}

import { default as OpenSeadragon } from 'openseadragon';
import { SvelteComponent } from 'svelte';
import { Annotation, Annotator } from '@annotorious/core';
import { DrawingTool, DrawingToolOpts, ImageAnnotation, ShapeType, DrawingMode } from '@annotorious/annotorious';
import { AnnotoriousOSDOpts } from './AnnotoriousOSDOpts';
import { FitboundsOptions } from './api';
export interface OpenSeadragonAnnotator<I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation> extends Annotator<I, E> {
    viewer: OpenSeadragon.Viewer;
    cancelDrawing(): void;
    getDrawingTool(): string | undefined;
    isDrawingEnabled(): boolean;
    fitBounds(arg: {
        id: string;
    } | string, opts?: FitboundsOptions): void;
    fitBoundsWithConstraints(arg: {
        id: string;
    } | string, opts?: FitboundsOptions): void;
    listDrawingTools(): string[];
    registerDrawingTool(name: string, tool: typeof SvelteComponent, opts?: DrawingToolOpts): void;
    registerShapeEditor(shapeType: ShapeType, editor: typeof SvelteComponent): void;
    setDrawingTool(name: DrawingTool): void;
    setDrawingEnabled(enabled: boolean): void;
    setDrawingMode(mode: DrawingMode): void;
    setModalSelect(modalSelect: boolean): void;
    setTheme(theme: 'light' | 'dark' | 'auto'): void;
}
export declare const createOSDAnnotator: <I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation>(viewer: OpenSeadragon.Viewer, options?: AnnotoriousOSDOpts<I, E>) => OpenSeadragonAnnotator<I, E>;

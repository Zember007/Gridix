import { ReactNode } from 'react';
import { default as OpenSeadragon } from 'openseadragon';
import { AnnotoriousOSDOpts } from '@annotorious/openseadragon';
import { Annotation, DrawingStyle, Filter, User } from '@annotorious/annotorious';
import { AnnotoriousOpenSeadragonAnnotator } from '.';
export declare const OpenSeadragonAnnotatorContext: import('react').Context<{
    viewer: OpenSeadragon.Viewer;
    setViewer(viewer: OpenSeadragon.Viewer): void;
}>;
export type OpenSeadragonAnnotatorProps<I extends Annotation, E extends unknown> = AnnotoriousOSDOpts<I, E> & {
    children?: ReactNode;
    filter?: Filter<I>;
    hideAnnotations?: boolean;
    style?: DrawingStyle | ((annotation: I) => DrawingStyle);
    tool?: string | null;
    user?: User;
    onInitError?(error: Error): void;
};
export declare const OpenSeadragonAnnotator: <I extends Annotation, E extends unknown>(props: OpenSeadragonAnnotatorProps<I, E> & {
    ref?: React.ForwardedRef<AnnotoriousOpenSeadragonAnnotator<I, E> | null>;
}) => React.ReactElement;
export declare const useViewer: () => OpenSeadragon.Viewer;
//# sourceMappingURL=OpenSeadragonAnnotator.d.ts.map
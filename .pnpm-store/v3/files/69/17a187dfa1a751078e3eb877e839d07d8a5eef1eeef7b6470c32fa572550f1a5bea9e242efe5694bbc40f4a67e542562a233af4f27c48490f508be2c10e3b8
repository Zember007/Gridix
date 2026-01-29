import { ReactNode } from 'react';
import { StoreObserveOptions } from '@annotorious/core';
import { Annotation, Annotator, ImageAnnotation, Selection as CoreSelection, Store, User } from '@annotorious/annotorious';
interface Selection<T extends Annotation = Annotation> extends Omit<CoreSelection, 'selected'> {
    selected: {
        annotation: T;
        editable?: boolean;
    }[];
    previous: {
        annotation: T;
        editable?: boolean;
    }[];
}
export declare const AnnotoriousContext: import('react').Context<{
    anno: any;
    setAnno: any;
    annotations: any[];
    selection: {
        selected: any[];
    };
}>;
export declare const Annotorious: import('react').ForwardRefExoticComponent<{
    children: ReactNode;
} & import('react').RefAttributes<Annotator<Annotation, Annotation>>>;
export declare const useAnnotator: <T extends unknown = Annotator<any, unknown>>() => T;
export declare const useAnnotationStore: <T extends unknown = Store<Annotation>>() => T | undefined;
export declare const useAnnotations: <T extends Annotation = ImageAnnotation>(debounce?: number) => T[];
export declare const useAnnotation: <T extends Annotation = ImageAnnotation>(id: string, options?: Omit<StoreObserveOptions, "annotations">) => T;
export declare const useAnnotationSelectAction: <I extends Annotation = ImageAnnotation>(id: string) => import('@annotorious/core').UserSelectAction;
export declare const useSelection: <T extends Annotation = ImageAnnotation>() => Selection<T>;
export declare const useHover: <T extends Annotation = ImageAnnotation>() => T;
export declare const useAnnotatorUser: () => User;
export declare const useViewportState: <T extends Annotation = ImageAnnotation>(debounce?: number) => T[];
export {};
//# sourceMappingURL=Annotorious.d.ts.map
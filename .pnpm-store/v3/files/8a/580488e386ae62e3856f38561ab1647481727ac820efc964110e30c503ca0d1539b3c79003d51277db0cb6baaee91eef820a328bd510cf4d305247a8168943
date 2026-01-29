import { MutableRefObject } from 'react';
import { Annotator } from '@annotorious/annotorious';
export type AnnotatorPlugin<T extends unknown = Annotator<any, unknown>> = (anno: T, opts?: Object) => ({
    unmount?: () => void;
}) | void;
export interface AnnotoriousPluginProps<T extends unknown = Annotator<any, unknown>> {
    pluginRef?: MutableRefObject<PluginReturnType<T>>;
    plugin: AnnotatorPlugin<T>;
    onLoad?(instance: PluginReturnType<T>): void;
    opts?: Object;
}
type PluginReturnType<T> = ReturnType<AnnotatorPlugin<T>>;
export declare const AnnotoriousPlugin: <T extends unknown = Annotator<any, unknown>>(props: AnnotoriousPluginProps<T>) => any;
export {};
//# sourceMappingURL=AnnotoriousPlugin.d.ts.map
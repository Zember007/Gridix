// Temporary typing shim for @annotorious/react.
//
// The installed @annotorious/react@3.7.12 package publishes dist JS exports,
// but its shipped `dist/index.d.ts` points at non-published `../src/*` paths.
// This breaks TypeScript module exports in the app code.
//
// We declare the minimal surface we use in the Gridix app, mapped to the
// underlying @annotorious/* packages so our code stays type-safe.

declare module '@annotorious/react' {
  import type * as React from 'react';
  import type { Annotation as CoreAnnotation, DrawingStyle } from '@annotorious/core';
  import { UserSelectAction } from '@annotorious/core';
  import type { ImageAnnotation } from '@annotorious/annotorious';
  import type { Viewer } from 'openseadragon';

  export { UserSelectAction };

  // Components (runtime exports exist; we keep typings permissive)
  export const Annotorious: React.ForwardRefExoticComponent<
    { children: React.ReactNode } & React.RefAttributes<unknown>
  >;

  export const OpenSeadragonAnnotator: React.ComponentType<any>;
  export const OpenSeadragonViewer: React.ComponentType<any>;

  // Hooks
  export function useAnnotations<T extends CoreAnnotation = ImageAnnotation>(debounce?: number): T[];
  export function useAnnotator<T = any>(): T;
  export function useViewer(): Viewer;
  export function useHover<T extends CoreAnnotation = ImageAnnotation>(): T | undefined;

  // Types we use in the app
  export type Annotation = CoreAnnotation;
  export type { DrawingStyle, ImageAnnotation };
}


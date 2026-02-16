declare module "react-hook-form" {
  import type * as React from "react";

  // NOTE:
  // The installed `react-hook-form` package in this repo ships incomplete .d.ts files
  // (they reference non-existent `../src/*` sources). This is a minimal type shim
  // for the parts we use in the codebase (mainly Shadcn's `Form` helpers).

  export type FieldValues = Record<string, unknown>;

  // A pragmatic simplification: we don't attempt to model literal paths here.
  export type FieldPath<TFieldValues extends FieldValues = FieldValues> =
    string;

  export type ControllerRenderProps = Record<string, unknown>;

  export interface ControllerProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  > {
    name: TName;
    control?: unknown;
    rules?: unknown;
    defaultValue?: unknown;
    render: (props: {
      field: ControllerRenderProps;
      fieldState: unknown;
      formState: unknown;
    }) => React.ReactElement;
  }

  export const Controller: <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(
    props: ControllerProps<TFieldValues, TName>,
  ) => React.ReactElement;

  export type FormProviderProps = {
    children: React.ReactNode;
    [key: string]: unknown;
  };

  export const FormProvider: React.ComponentType<FormProviderProps>;

  export const useFormContext: <
    TFieldValues extends FieldValues = FieldValues,
  >() => {
    formState: unknown;
    getFieldState: (
      name: FieldPath<TFieldValues>,
      formState: unknown,
    ) => { error?: unknown } & Record<string, unknown>;
  };
}

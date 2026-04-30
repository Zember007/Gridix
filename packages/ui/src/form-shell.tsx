import * as React from "react";

import { cn } from "@gridix/utils/lib";

export const FormShell = React.forwardRef<
  HTMLFormElement,
  React.FormHTMLAttributes<HTMLFormElement>
>(({ className, ...props }, ref) => (
  <form
    ref={ref}
    className={cn("flex min-h-0 flex-col gap-6", className)}
    {...props}
  />
));
FormShell.displayName = "FormShell";

export const FormSection = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <section
    ref={ref}
    className={cn(
      "border-border/70 bg-card space-y-4 rounded-lg border p-4",
      className,
    )}
    {...props}
  />
));
FormSection.displayName = "FormSection";

export const FormActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "border-border/70 bg-background/95 sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-end",
      className,
    )}
    {...props}
  />
));
FormActions.displayName = "FormActions";

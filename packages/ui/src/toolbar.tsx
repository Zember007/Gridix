import * as React from "react";

import { cn } from "@gridix/utils/lib";

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  leading?: React.ReactNode;
  filters?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ className, leading, filters, trailing, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "border-border/70 bg-muted/35 flex flex-col gap-3 rounded-lg border p-2 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {leading}
        {filters}
        {children}
      </div>
      {trailing ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {trailing}
        </div>
      ) : null}
    </div>
  ),
);
Toolbar.displayName = "Toolbar";

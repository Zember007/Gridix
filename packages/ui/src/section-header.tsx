import * as React from "react";

import { cn } from "@gridix/utils/lib";

export interface SectionHeaderProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "title"
> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export const SectionHeader = React.forwardRef<HTMLElement, SectionHeaderProps>(
  ({ className, title, description, actions, children, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 space-y-1">
        <h2 className="text-foreground text-base leading-6 font-semibold">
          {title}
        </h2>
        {description ? (
          <p className="text-muted-foreground max-w-[68ch] text-sm leading-6">
            {description}
          </p>
        ) : null}
        {children}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      ) : null}
    </header>
  ),
);
SectionHeader.displayName = "SectionHeader";

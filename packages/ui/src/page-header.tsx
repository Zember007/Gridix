import * as React from "react";

import { cn } from "@gridix/utils/lib";

export interface PageHeaderProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "title"
> {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  metadata?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  (
    {
      className,
      title,
      description,
      eyebrow,
      metadata,
      actions,
      children,
      ...props
    },
    ref,
  ) => (
    <header
      ref={ref}
      className={cn(
        "border-border/70 bg-background/95 flex flex-col gap-4 border-b pb-4",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-1">
          {eyebrow ? (
            <div className="text-muted-foreground text-xs font-medium">
              {eyebrow}
            </div>
          ) : null}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="text-foreground min-w-0 text-2xl leading-8 font-semibold">
              {title}
            </h1>
            {metadata}
          </div>
          {description ? (
            <p className="text-muted-foreground max-w-[72ch] text-sm leading-6">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
      {children}
    </header>
  ),
);
PageHeader.displayName = "PageHeader";

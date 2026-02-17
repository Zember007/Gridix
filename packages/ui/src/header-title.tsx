import * as React from "react";

import { cn } from "@gridix/utils/lib";

export interface HeaderTitleProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title: React.ReactNode;
  description?: React.ReactNode;
}

export function HeaderTitle({
  title,
  description,
  className,
  ...props
}: HeaderTitleProps) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      <div className="text-lg leading-none font-semibold tracking-tight">
        {title}
      </div>
      {description ? (
        <div className="text-muted-foreground text-sm">{description}</div>
      ) : null}
    </div>
  );
}

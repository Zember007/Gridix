import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { Button, type ButtonProps } from "./button";
import { Skeleton } from "./skeleton";
import { cn } from "@gridix/utils/lib";

export interface DataStateAction {
  label: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: ButtonProps["variant"];
}

export interface DataStateProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  variant?: "empty" | "error" | "loading" | "not-found";
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: DataStateAction;
}

export function DataState({
  className,
  variant = "empty",
  icon: Icon,
  title,
  description,
  action,
  children,
  ...props
}: DataStateProps) {
  if (variant === "loading") {
    return (
      <div
        className={cn("space-y-3 rounded-lg border p-4", className)}
        {...props}
      >
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-2/3 max-w-md" />
      </div>
    );
  }

  const content = (
    <>
      {Icon ? (
        <div className="border-border/70 bg-background text-muted-foreground flex h-10 w-10 items-center justify-center rounded-lg border">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-foreground text-sm font-semibold">{title}</h3>
        {description ? (
          <p className="text-muted-foreground max-w-[60ch] text-sm leading-6">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        action.href ? (
          <Button asChild variant={action.variant ?? "outline"} size="sm">
            <a href={action.href}>{action.label}</a>
          </Button>
        ) : (
          <Button
            variant={action.variant ?? "outline"}
            size="sm"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )
      ) : null}
      {children}
    </>
  );

  return (
    <div
      className={cn(
        "border-border/80 bg-muted/25 flex flex-col items-start gap-3 rounded-lg border border-dashed p-6 text-left",
        variant === "error" && "border-destructive/35 bg-destructive/5",
        className,
      )}
      {...props}
    >
      {content}
    </div>
  );
}

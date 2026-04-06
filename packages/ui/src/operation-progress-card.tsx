import * as React from "react";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { cn } from "@gridix/utils/lib";

import { Progress } from "./progress";

const operationProgressCardVariants = cva(
  "relative flex w-full items-center gap-4 overflow-hidden rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-all",
  {
    variants: {
      status: {
        running: "border-border",
        complete: "border-green-500/50",
        error: "border-destructive/50",
      },
    },
    defaultVariants: {
      status: "running",
    },
  },
);

export interface OperationProgressCardProps
  extends
    React.ComponentPropsWithoutRef<typeof motion.div>,
    VariantProps<typeof operationProgressCardVariants> {
  title: string;
  description?: string;
  current: number;
  total: number;
  status: "running" | "complete" | "error";
  icon?: React.ReactNode;
}

export const OperationProgressCard = React.forwardRef<
  HTMLDivElement,
  OperationProgressCardProps
>(
  (
    {
      className,
      status = "running",
      title,
      description,
      current,
      total,
      icon,
      ...props
    },
    ref,
  ) => {
    const safeTotal = Math.max(total, 1);
    const clampedCurrent = Math.min(Math.max(current, 0), safeTotal);
    const percent = (clampedCurrent / safeTotal) * 100;
    const isComplete = status === "complete";
    const isError = status === "error";

    return (
      <motion.div
        ref={ref}
        className={cn(operationProgressCardVariants({ status }), className)}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        {...props}
      >
        <div className="text-muted-foreground shrink-0">
          {isComplete ? (
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          ) : isError ? (
            <XCircle className="text-destructive h-8 w-8" />
          ) : icon ? (
            icon
          ) : (
            <Loader2 className="h-8 w-8 animate-spin" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          {description ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              {description}
            </p>
          ) : null}
          <div className="mt-2 space-y-1">
            <Progress value={percent} className="h-2" />
            <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
              <span className="shrink-0">
                {clampedCurrent} of {safeTotal}
              </span>
              <span className="shrink-0">
                {isComplete ? "100%" : `${Math.round(percent)}%`}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  },
);

OperationProgressCard.displayName = "OperationProgressCard";

import * as React from "react";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, File, XCircle } from "lucide-react";

import { cn } from "@gridix/utils/lib";

import { Button } from "./button";
import { Progress } from "./progress";

const formatFileSize = (bytes: number): string => {
  if (bytes <= 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;

  return `${parseFloat(value.toFixed(2))} ${units[unitIndex]}`;
};

const uploadProgressCardVariants = cva(
  "relative flex w-full items-center gap-4 overflow-hidden rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-all",
  {
    variants: {
      status: {
        uploading: "border-border",
        complete: "border-green-500/50",
        error: "border-destructive/50",
      },
    },
    defaultVariants: {
      status: "uploading",
    },
  },
);

export interface UploadProgressCardProps
  extends
    React.ComponentPropsWithoutRef<typeof motion.div>,
    VariantProps<typeof uploadProgressCardVariants> {
  fileName: string;
  fileSize: number;
  progress: number;
  icon?: React.ReactNode;
  onCancel?: () => void;
  completeLabel?: string;
  cancelLabel?: string;
}

export const UploadProgressCard = React.forwardRef<
  HTMLDivElement,
  UploadProgressCardProps
>(
  (
    {
      className,
      status = "uploading",
      fileName,
      fileSize,
      progress,
      icon,
      onCancel,
      completeLabel = "Complete",
      cancelLabel = "Cancel upload",
      ...props
    },
    ref,
  ) => {
    const normalizedProgress = Math.max(0, Math.min(progress, 100));
    const uploadedSize = (fileSize * normalizedProgress) / 100;
    const isComplete = status === "complete";
    const isError = status === "error";

    return (
      <motion.div
        ref={ref}
        className={cn(
          uploadProgressCardVariants({
            status: isComplete ? "complete" : status,
          }),
          className,
        )}
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
          ) : (
            (icon ?? <File className="h-8 w-8" />)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{fileName}</p>
          <div className="mt-2 space-y-1">
            <Progress value={normalizedProgress} className="h-2" />
            <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
              <span className="truncate">
                {isComplete
                  ? formatFileSize(fileSize)
                  : `${formatFileSize(uploadedSize)} of ${formatFileSize(fileSize)}`}
              </span>
              <span className="shrink-0">
                {isComplete
                  ? completeLabel
                  : `${Math.round(normalizedProgress)}%`}
              </span>
            </div>
          </div>
        </div>

        {!isComplete && onCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onCancel}
            aria-label={cancelLabel}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        ) : null}
      </motion.div>
    );
  },
);

UploadProgressCard.displayName = "UploadProgressCard";

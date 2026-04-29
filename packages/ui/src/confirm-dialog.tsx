import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { cn } from "@gridix/utils/lib";

type ConfirmDialogTone = "default" | "destructive";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  details?: React.ReactNode;
  confirmLabel: React.ReactNode;
  cancelLabel: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  tone?: ConfirmDialogTone;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  details,
  confirmLabel,
  cancelLabel,
  onConfirm,
  loading = false,
  tone = "default",
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const isLoading = loading || internalLoading;

  const handleConfirm = async (event: React.MouseEvent) => {
    event.preventDefault();
    if (isLoading) return;

    try {
      const result = onConfirm();
      if (result instanceof Promise) {
        setInternalLoading(true);
        await result;
      }
      onOpenChange(false);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-border/80 max-w-md gap-5 rounded-xl p-5 shadow-xl">
        <AlertDialogHeader className="space-y-2 text-left">
          <AlertDialogTitle className="text-base leading-6 font-semibold">
            {title}
          </AlertDialogTitle>
          {description ? (
            <AlertDialogDescription className="leading-6">
              {description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        {details ? (
          <div className="border-border/70 bg-muted/45 text-muted-foreground rounded-lg border px-3 py-2 text-sm">
            {details}
          </div>
        ) : null}

        <AlertDialogFooter className="gap-2 sm:space-x-0">
          <AlertDialogCancel disabled={isLoading} className="mt-0">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              tone === "destructive" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/30",
            )}
          >
            {isLoading ? (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
            ) : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

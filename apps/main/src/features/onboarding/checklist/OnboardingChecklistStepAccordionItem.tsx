import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
} from "@gridix/ui";
import { Check } from "lucide-react";

export type OnboardingChecklistStepAccordionItemProps = {
  value: string;
  done: boolean;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function OnboardingChecklistStepAccordionItem({
  value,
  done,
  title,
  description,
  actionLabel,
  onAction,
}: OnboardingChecklistStepAccordionItemProps) {
  return (
    <AccordionItem value={value} className="border-0">
      <div className="flex gap-1.5 rounded-md border border-border/60 bg-muted/30 p-2">
        <div
          className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            done
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/30 bg-background"
          }`}
          aria-hidden
        >
          {done ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <AccordionTrigger className="min-h-0 items-start justify-between gap-1 py-0 pr-0 text-left hover:no-underline [&>svg]:mt-0.5 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0">
            <span className="text-xs font-medium leading-tight">{title}</span>
          </AccordionTrigger>
          <AccordionContent className="pb-1.5 pt-1.5">
            <p className="text-[11px] leading-snug text-muted-foreground">
              {description}
            </p>
            {!done && actionLabel && onAction ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-1.5 h-7 text-xs"
                onClick={onAction}
              >
                {actionLabel}
              </Button>
            ) : null}
          </AccordionContent>
        </div>
      </div>
    </AccordionItem>
  );
}

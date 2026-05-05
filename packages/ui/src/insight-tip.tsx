import * as React from "react";
import { Lightbulb } from "lucide-react";

import { cn } from "@gridix/utils/lib";

const insightTipRootClassName =
  "flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-blue-600 [&_svg]:pointer-events-none";

const insightTipIconClassName = "mt-0.5 h-5 w-5 shrink-0 text-blue-600";

export type InsightTipProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Optional title line above the body (e.g. “Integrator dashboard”). */
  heading?: React.ReactNode;
  iconClassName?: string;
};

/** Callout with `role="note"` for assistive tech; neutral `div` avoids confusion with page sidebars (`aside`). */
const InsightTip = React.forwardRef<HTMLDivElement, InsightTipProps>(
  ({ className, heading, children, iconClassName, ...props }, ref) => (
    <div
      ref={ref}
      role="note"
      className={cn(insightTipRootClassName, className)}
      {...props}
    >
      <Lightbulb
        className={cn(insightTipIconClassName, iconClassName)}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        {heading ? (
          <>
            <p className="text-sm leading-snug font-semibold">{heading}</p>
            <div className="mt-1 text-sm leading-relaxed">{children}</div>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  ),
);
InsightTip.displayName = "InsightTip";

export { InsightTip, insightTipRootClassName, insightTipIconClassName };

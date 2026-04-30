import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";

import { cn } from "@gridix/utils/lib";

export interface ViewTransitionProps extends HTMLMotionProps<"div"> {
  viewKey: React.Key;
  disabled?: boolean;
}

const transition = {
  duration: 0.18,
  ease: [0.23, 1, 0.32, 1],
} as const;

export function ViewTransition({
  viewKey,
  disabled = false,
  className,
  children,
  ...props
}: ViewTransitionProps) {
  const reducedMotion = useReducedMotion();
  const shouldSkipMotion = disabled || reducedMotion;

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={String(viewKey)}
        initial={shouldSkipMotion ? false : { opacity: 0, y: 6 }}
        animate={shouldSkipMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={shouldSkipMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
        transition={transition}
        className={cn("min-w-0", className)}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

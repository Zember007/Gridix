import type { CSSProperties } from "react";
import { cn } from "@gridix/utils/lib";

type SpinnerSize = "xs" | "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  style?: CSSProperties;
}

const sizeMap: Record<SpinnerSize, string> = {
  xs: "h-4 w-4",
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export const Spinner = ({ size = "md", className, style }: SpinnerProps) => {
  return (
    <div
      style={style}
      className={cn(
        "animate-spin rounded-full border-b-2 border-primary",
        sizeMap[size],
        className,
      )}
    />
  );
};

export default Spinner;

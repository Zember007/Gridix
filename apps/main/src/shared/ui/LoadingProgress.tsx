import { useEffect, useRef } from "react";
import { cn } from "@gridix/utils/lib";
import { Spinner } from "./Spinner";

interface LoadingProgressProps {
  className?: string;
  spinnerClassName?: string;
  textClassName?: string;
}

const INITIAL_PROGRESS = 3;

const getNextProgress = (current: number) => {
  if (current >= 95) return current;
  if (current >= 90) return current + 1;
  if (current >= 75) return current + 2;
  if (current >= 50) return current + 4;
  return current + 7;
};

export const LoadingProgress = ({
  className,
  spinnerClassName,
  textClassName,
}: LoadingProgressProps) => {
  const progressRef = useRef(INITIAL_PROGRESS);
  const textRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const textNode = textRef.current;
    if (!textNode) return;

    textNode.textContent = `${progressRef.current}%`;

    const timer = window.setInterval(() => {
      const nextProgress = getNextProgress(progressRef.current);
      progressRef.current = nextProgress;
      textNode.textContent = `${nextProgress}%`;

      if (nextProgress >= 95) {
        window.clearInterval(timer);
      }
    }, 180);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        className,
      )}
    >
      <Spinner size="md" className={spinnerClassName} />
      <div
        ref={textRef}
        className={cn(
          "text-sm font-medium tabular-nums text-muted-foreground",
          textClassName,
        )}
      />
    </div>
  );
};

export default LoadingProgress;

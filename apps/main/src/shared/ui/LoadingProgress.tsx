import { useEffect, useState } from "react";
import { cn } from "@gridix/utils/lib";
import { Spinner } from "./Spinner";

interface LoadingProgressProps {
  className?: string;
  spinnerClassName?: string;
  textClassName?: string;
}

export const LoadingProgress = ({
  className,
  spinnerClassName,
  textClassName,
}: LoadingProgressProps) => {
  const [progress, setProgress] = useState(3);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 95) return current;
        if (current >= 90) return current + 1;
        if (current >= 75) return current + 2;
        if (current >= 50) return current + 4;
        return current + 7;
      });
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
        className={cn(
          "text-sm font-medium tabular-nums text-muted-foreground",
          textClassName,
        )}
      >
        {progress}%
      </div>
    </div>
  );
};

export default LoadingProgress;

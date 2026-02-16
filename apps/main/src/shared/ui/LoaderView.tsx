import { useEffect, useState } from "react";
import { Loader } from "@gridix/ui";
import { cn } from "@gridix/utils/lib";

interface LoaderViewProps {
  loading?: boolean;
  color?: string;
  label?: string;
  className?: string;
}

export const LoaderView = ({
  loading = true,
  color = "#000000",
  label,
  className,
}: LoaderViewProps) => {
  const [isLoading, setIsLoading] = useState(loading);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (!loading) {
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } else {
      setIsLoading(true);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  if (!isLoading) return null;

  return (
    <div
      className={cn(
        loading ? "translate-y-0" : "-translate-y-full !bg-white/80",
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white backdrop-blur-sm transition-all duration-500 ease-out",
        className,
      )}
    >
      <Loader color={color} size="lg" className="mx-auto" />
    </div>
  );
};

export const FullPageLoaderView = (props: Omit<LoaderViewProps, "loading">) => {
  return <LoaderView {...props} loading />;
};

export default LoaderView;

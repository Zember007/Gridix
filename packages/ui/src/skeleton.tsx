import { cn } from "@gridix/utils/lib";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-muted/80 animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };

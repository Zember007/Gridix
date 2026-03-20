import { ChevronUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@gridix/utils/lib";
import { Button } from "./button";

interface ScrollToTopButtonProps {
  getScrollContainer?: () => HTMLElement | null;
  threshold?: number;
  ariaLabel?: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  size?: "icon" | "sm" | "default" | "lg" | "icon-lg";
  scrollWindow?: boolean;
}

export function ScrollToTopButton({
  getScrollContainer,
  threshold = 300,
  ariaLabel = "Scroll to top",
  title = "Scroll to top",
  className,
  style,
  size = "icon",
  scrollWindow = true,
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  const getWindowScrollTop = () =>
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0;

  const handleScrollToTop = useCallback(() => {
    const scrollContainer = getScrollContainer?.();
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (scrollWindow) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [getScrollContainer, scrollWindow]);

  useEffect(() => {
    const scrollContainer = getScrollContainer?.() ?? null;

    const updateVisibility = () => {
      const containerTop = scrollContainer?.scrollTop ?? 0;
      const scrollTop = Math.max(containerTop, getWindowScrollTop());
      const shouldShow = scrollTop > threshold;
      setVisible((prev) => (prev === shouldShow ? prev : shouldShow));
    };

    updateVisibility();

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", updateVisibility, {
        passive: true,
      });
    }

    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", updateVisibility);
      }
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [getScrollContainer, threshold]);

  if (!visible) return null;

  return (
    <Button
      type="button"
      size={size}
      aria-label={ariaLabel}
      title={title}
      className={cn("rounded-full shadow-lg", className)}
      onClick={handleScrollToTop}
      style={style}
    >
      <ChevronUp className="h-4 w-4" />
    </Button>
  );
}

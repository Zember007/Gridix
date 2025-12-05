import { useCallback, useEffect, useRef } from 'react';

export const useWidgetScroll = (
  isWidget: boolean,
  deps: unknown[] = [],
) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isFirstRender = useRef(true);

  const scrollWidgetToTop = useCallback(() => {
    if (!isWidget || !containerRef.current) return;

    try {
      if (typeof containerRef.current.scrollTo === 'function') {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        containerRef.current.scrollTop = 0;
      }

      if (typeof containerRef.current.scrollIntoView === 'function') {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      console.error('Error scrolling widget to top:', error);
    }
  }, [isWidget]);

  useEffect(() => {
    if (!isWidget) return;
    
    // Пропускаем скролл при первой инициализации
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    scrollWidgetToTop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWidget, scrollWidgetToTop, ...deps]);

  return {
    containerRef,
    scrollWidgetToTop,
  };
};









import React, { useRef, useCallback } from "react";

export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const target = e.target as HTMLElement;
    // Do not scroll if clicking on interactive elements
    if (
      target.closest('[draggable="true"], button, a, input, select, textarea')
    ) {
      return;
    }

    isDown.current = true;
    ref.current.classList.add("cursor-grabbing");
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
  }, []);

  const onMouseLeave = useCallback(() => {
    if (!ref.current) return;
    isDown.current = false;
    ref.current.classList.remove("cursor-grabbing");
  }, []);

  const onMouseUp = useCallback(() => {
    if (!ref.current) return;
    isDown.current = false;
    ref.current.classList.remove("cursor-grabbing");
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDown.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 2; // The multiplier makes scrolling faster
    ref.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  return { ref, onMouseDown, onMouseLeave, onMouseUp, onMouseMove };
}

import { useEffect } from 'react';

export function useLockBodyScroll(lock = true) {
  useEffect(() => {
    if (!lock) return;

    const element = document.body;
    const scrollY = window.scrollY;

    // Фиксируем тело
    element.style.position = 'fixed';
    element.style.top = `-${scrollY}px`;
    element.style.left = '0';
    element.style.right = '0';
    element.style.overflow = 'hidden';
    element.style.width = '100%';
    element.style.touchAction = 'none'; // предотвращает системные жесты (в т.ч. pull-to-refresh)

    // Переменные внутри useEffect (не глобальные)
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startY = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      const isAtTop = element.scrollTop === 0;
      const isPullingDown = y > startY;
      if (isAtTop && isPullingDown) e.preventDefault();
    };

    element.addEventListener('touchstart', onTouchStart);
    element.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      // Восстанавливаем всё
      element.style.position = '';
      element.style.top = '';
      element.style.left = '';
      element.style.right = '';
      element.style.overflow = '';
      element.style.width = '';
      element.style.touchAction = '';

      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);

      // Возвращаем скролл в исходную позицию
      window.scrollTo(0, scrollY);
    };
  }, [lock]);
}

import { useRef, useEffect } from 'react';

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }) {
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      isHorizontal.current = false;
    };

    const handleTouchMove = (e) => {
      if (!startX.current) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        isHorizontal.current = true;
      }
    };

    const handleTouchEnd = (e) => {
      if (!isHorizontal.current) return;
      const endX = e.changedTouches[0].clientX;
      const diff = startX.current - endX;
      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }
      startX.current = 0;
      startY.current = 0;
      isHorizontal.current = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold]);
}

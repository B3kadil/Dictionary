import { useRef } from 'react';

interface Handlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const THRESHOLD = 50;

export function useSwipe({ onSwipeLeft, onSwipeRight }: Handlers) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const didSwipe = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    didSwipe.current = false;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!start.current) return;
    const dx = e.changedTouches[0].clientX - start.current.x;
    const dy = e.changedTouches[0].clientY - start.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > THRESHOLD) {
      didSwipe.current = true;
      if (dx > 0) onSwipeRight?.();
      else onSwipeLeft?.();
    }
    start.current = null;
  };

  // Use capture phase to block click from reaching children after a swipe
  const onClickCapture = (e: React.MouseEvent) => {
    if (didSwipe.current) {
      e.stopPropagation();
      didSwipe.current = false;
    }
  };

  return { onTouchStart, onTouchEnd, onClickCapture };
}

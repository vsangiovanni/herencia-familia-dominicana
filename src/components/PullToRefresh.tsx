import { useEffect, useRef, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const TRIGGER_DISTANCE = 82;
const MAX_DISTANCE = 118;

const canUsePullToRefresh = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
};

export default function PullToRefresh() {
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!canUsePullToRefresh()) return;

    const reset = () => {
      startYRef.current = null;
      pullingRef.current = false;
      setPullDistance(0);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0 || event.touches.length !== 1 || isRefreshing) return;
      startYRef.current = event.touches[0].clientY;
      pullingRef.current = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startYRef.current === null || event.touches.length !== 1 || isRefreshing) return;
      const distance = event.touches[0].clientY - startYRef.current;

      if (distance <= 0) {
        reset();
        return;
      }

      if (window.scrollY > 0) {
        reset();
        return;
      }

      if (distance > 12) {
        event.preventDefault();
        pullingRef.current = true;
        setPullDistance(Math.min(MAX_DISTANCE, Math.round(distance * 0.55)));
      }
    };

    const onTouchEnd = () => {
      if (!pullingRef.current) {
        reset();
        return;
      }

      if (pullDistance >= TRIGGER_DISTANCE) {
        setIsRefreshing(true);
        setPullDistance(TRIGGER_DISTANCE);
        window.setTimeout(() => {
          const handled = !window.dispatchEvent(new CustomEvent('sienna:pull-refresh', { cancelable: true }));
          if (handled) {
            window.setTimeout(() => {
              setIsRefreshing(false);
              reset();
            }, 360);
            return;
          }
          window.location.reload();
        }, 180);
        return;
      }

      reset();
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', reset);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', reset);
    };
  }, [isRefreshing, pullDistance]);

  if (!pullDistance && !isRefreshing) return null;

  const armed = pullDistance >= TRIGGER_DISTANCE;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center pt-[calc(env(safe-area-inset-top)+0.65rem)]"
      style={{ transform: `translateY(${Math.min(20, pullDistance / 5)}px)` }}
      aria-hidden="true"
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur transition-colors',
          armed || isRefreshing
            ? 'border-[#2E8B57]/45 bg-[#F3FBF6]/95 text-[#1F7A4F]'
            : 'border-[#355C9A]/30 bg-white/95 text-[#355C9A]'
        )}
      >
        <RefreshCcw className={cn('h-3.5 w-3.5', (armed || isRefreshing) && 'animate-spin')} />
        {isRefreshing ? 'Buscando cositas nuevas...' : armed ? 'Suelta para refrescar' : 'Desliza para refrescar'}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 64;
const RESISTANCE = 0.4;
const MAX_PULL = 112;

const usePullToRefresh = (scrollRef, onRefresh, { disabled = false } = {}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startYRef = useRef(0);
  const armedRef = useRef(false);
  const pullingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || disabled) return;

    let rafId = null;

    const syncDistance = (value) => {
      pullDistanceRef.current = value;
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setPullDistance(pullDistanceRef.current);
      });
    };

    const onTouchStart = (event) => {
      if (isRefreshingRef.current) return;
      if (el.scrollTop > 0) return;
      armedRef.current = true;
      pullingRef.current = false;
      startYRef.current = event.touches[0].clientY;
    };

    const onTouchMove = (event) => {
      if (!armedRef.current || isRefreshingRef.current) return;

      const dy = event.touches[0].clientY - startYRef.current;

      if (!pullingRef.current) {
        if (dy <= 0 || el.scrollTop > 0) {
          armedRef.current = false;
          return;
        }
        pullingRef.current = true;
      }

      event.preventDefault();
      syncDistance(Math.min(dy * RESISTANCE, MAX_PULL));
    };

    const finishPull = async () => {
      if (!armedRef.current && !pullingRef.current) return;
      armedRef.current = false;
      pullingRef.current = false;

      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      const distance = pullDistanceRef.current;
      if (distance >= THRESHOLD && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        pullDistanceRef.current = THRESHOLD;
        setIsRefreshing(true);
        setPullDistance(THRESHOLD);
        try {
          await onRefreshRef.current?.();
        } finally {
          isRefreshingRef.current = false;
          pullDistanceRef.current = 0;
          setIsRefreshing(false);
          setPullDistance(0);
        }
        return;
      }

      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', finishPull);
    el.addEventListener('touchcancel', finishPull);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', finishPull);
      el.removeEventListener('touchcancel', finishPull);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [scrollRef, disabled]);

  return {
    pullDistance,
    isRefreshing,
    isPulling: pullDistance > 0 && !isRefreshing,
    threshold: THRESHOLD,
  };
};

export default usePullToRefresh;

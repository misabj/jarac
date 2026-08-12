'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  decimals?: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

/**
 * Tween-anima broj od 0 do `value` kada uđe u viewport.
 * Lagano i performantno (requestAnimationFrame).
 */
export function AnimatedNumber({ value, decimals = 0, duration = 900, suffix = '', className = '' }: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState<number>(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const to = Number(value) || 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, value, duration]);

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {formatted}
      {suffix}
    </span>
  );
}

'use client';

import { useEffect, useRef } from 'react';

/**
 * Spotlight efekat — mouse-tracking radial gradient za bilo koji kontejner.
 * Postavi CSS varijable --mx i --my (u procentima) na target element.
 * Koristi se zajedno sa .card-hover stilom u globals.css.
 */
export function HoverSpotlight() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = parent.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        parent.style.setProperty('--mx', `${x}%`);
        parent.style.setProperty('--my', `${y}%`);
      });
    };
    parent.addEventListener('mousemove', onMove);
    return () => {
      parent.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="hidden" aria-hidden />;
}

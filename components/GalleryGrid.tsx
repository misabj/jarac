'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GalleryImage } from '@/lib/types';

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const open = activeIndex !== null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveIndex(null);
      if (e.key === 'ArrowRight') setActiveIndex((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === 'ArrowLeft') setActiveIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, images.length]);

  const active = activeIndex !== null ? images[activeIndex] : null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setActiveIndex(i)}
            className="card overflow-hidden group relative aspect-square focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.image_url}
              alt={img.title ?? 'Slika galerije'}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {img.title && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent px-3 py-2 text-left text-xs text-text opacity-0 group-hover:opacity-100 transition-opacity">
                {img.title}
              </span>
            )}
          </button>
        ))}
      </div>

      {mounted && open && active &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl p-2 sm:p-4"
            onClick={() => setActiveIndex(null)}
          >
            <button
              type="button"
              aria-label="Zatvori"
              onClick={() => setActiveIndex(null)}
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-card/70 text-text hover:bg-card-hover transition"
            >
              <span className="text-xl leading-none">&times;</span>
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Prethodna"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card/70 text-text hover:bg-card-hover transition"
                >
                  {'\u2190'}
                </button>
                <button
                  type="button"
                  aria-label="Sledeća"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex((i) => (i === null ? i : (i + 1) % images.length));
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card/70 text-text hover:bg-card-hover transition"
                >
                  {'\u2192'}
                </button>
              </>
            )}

            <figure
              className="flex h-full w-full flex-col items-center justify-center gap-2 sm:gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.image_url}
                alt={active.title ?? 'Slika galerije'}
                className="max-h-[90vh] max-w-[96vw] w-auto h-auto object-contain rounded-lg sm:rounded-xl"
              />
              {active.title && (
                <figcaption className="shrink-0 text-center text-xs sm:text-sm text-muted">{active.title}</figcaption>
              )}
            </figure>
          </div>,
          document.body
        )}
    </>
  );
}

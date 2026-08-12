'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Po\u010detna' },
  { href: '/standings', label: 'Tabela' },
  { href: '/players', label: 'Igra\u010di' },
  { href: '/matches', label: 'Utakmice' },
  { href: '/gallery', label: 'Galerija' },
  { href: '/admin', label: 'Admin' },
];

export function MobileNavToggle() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const overlay = (
    <div
      aria-hidden={!open}
      className={`md:hidden fixed inset-0 z-[100] transition-opacity duration-300 ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <button
        aria-label="Zatvori"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-background/85 backdrop-blur-xl"
      />
      <nav
        className={`absolute right-0 top-0 h-full w-[84%] max-w-sm bg-card/95 border-l border-border/60 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-5 py-5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/jarac_logo.webp"
                alt="Jarac"
                width={36}
                height={36}
                className="h-full w-full object-contain"
              />
            </span>
            <div>
              <div className="font-display font-bold text-sm">Jarac</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">KSC Jarac</div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Zatvori meni"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-text hover:bg-card-hover transition"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>
        <ul className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {LINKS.map((l, i) => {
            const active = pathname === l.href || (l.href !== '/' && pathname?.startsWith(l.href));
            return (
              <li
                key={l.href}
                className="opacity-0 animate-fade-up"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}
              >
                <Link
                  href={l.href}
                  prefetch={false}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium transition-all min-h-[48px] ${
                    active
                      ? 'bg-gradient-primary text-background shadow-glow-primary'
                      : 'text-text/90 hover:bg-card-hover active:scale-[0.98]'
                  }`}
                >
                  <span>{l.label}</span>
                  <span className={active ? 'opacity-80' : 'text-muted'}>{'\u2192'}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="px-5 py-4 border-t border-border/60 text-[11px] uppercase tracking-[0.18em] text-muted text-center">
          Sreda &bull; 17:00 &bull; KSC Jarac
        </div>
      </nav>
    </div>
  );

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Zatvori meni' : 'Otvori meni'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="md:hidden ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-card/60 backdrop-blur active:scale-95 transition-transform"
      >
        <span className="relative block h-4 w-5">
          <span
            className={`absolute left-0 top-0 h-[2px] w-5 rounded-full bg-text transition-all duration-300 ${
              open ? 'translate-y-[7px] rotate-45' : ''
            }`}
          />
          <span
            className={`absolute left-0 top-1/2 -translate-y-1/2 h-[2px] w-5 rounded-full bg-text transition-opacity duration-200 ${
              open ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`absolute left-0 bottom-0 h-[2px] w-5 rounded-full bg-text transition-all duration-300 ${
              open ? '-translate-y-[7px] -rotate-45' : ''
            }`}
          />
        </span>
      </button>

      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}

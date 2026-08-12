'use client';

import { useEffect, useState } from 'react';

type Props = {
  /** ISO string. Ako nije zadat, koristi sledeću sredu u 17:00. */
  targetDate?: string;
  /** Više termina, npr. isti dan u 17h i 18h. Svaki termin traje 1h. */
  targetDates?: string[];
  /** Naslov iznad brojeva. */
  title?: string;
  /** Opciono — naziv mesta / kratak detalj utakmice. */
  subtitle?: string;
  compact?: boolean;
  className?: string;
};

/**
 * Srpska deklinacija po pravilima:
 *  - poslednje 2 cifre 11–14  →  "many"  (npr. 12 dana, 13 sati)
 *  - poslednja cifra 1        →  "one"   (1 dan, 21 dan, 31 dan…)
 *  - poslednja cifra 2–4      →  "few"   (2 sata, 23 minuta…)
 *  - sve ostalo               →  "many"
 */
function plural(n: number, [one, few, many]: [string, string, string]): string {
  const abs = Math.abs(n);
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = abs % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

const DAY_FORMS: [string, string, string] = ['dan', 'dana', 'dana'];
const HOUR_FORMS: [string, string, string] = ['sat', 'sata', 'sati'];
const MIN_FORMS: [string, string, string] = ['minut', 'minuta', 'minuta'];
const SEC_FORMS: [string, string, string] = ['sekunda', 'sekunde', 'sekundi'];
const MATCH_DURATION_MS = 60 * 60 * 1000;

function parseLocalDate(value: string): Date {
  return new Date(value.replace(' ', 'T'));
}

/** Vraća sledeću sredu u 18:00 lokalnog vremena. */
function getNextWednesday1800(from = new Date()): Date {
  const d = new Date(from);
  d.setHours(18, 0, 0, 0);
  const day = d.getDay(); // 0=Ned, 3=Sreda
  let diff = (3 - day + 7) % 7;
  if (diff === 0 && from.getTime() > d.getTime()) diff = 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function getCountdownTarget(nowMs: number, targetDate?: string, targetDates?: string[]): Date {
  const rawTargets = targetDates?.length ? targetDates : targetDate ? [targetDate] : [];
  const futureOrLive = rawTargets
    .map(parseLocalDate)
    .filter((date) => date.getTime() + MATCH_DURATION_MS > nowMs)
    .sort((a, b) => a.getTime() - b.getTime());

  return futureOrLive[0] ?? getNextWednesday1800(new Date(nowMs));
}

type Diff = { days: number; hours: number; minutes: number; seconds: number; isLive: boolean };

function computeDiff(targetMs: number, nowMs: number): Diff {
  let delta = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  const isLive = targetMs <= nowMs && nowMs < targetMs + MATCH_DURATION_MS;
  const days = Math.floor(delta / 86400); delta -= days * 86400;
  const hours = Math.floor(delta / 3600); delta -= hours * 3600;
  const minutes = Math.floor(delta / 60); delta -= minutes * 60;
  const seconds = delta;
  return { days, hours, minutes, seconds, isLive };
}

export function MatchCountdown({
  targetDate,
  targetDates,
  title = 'Sledeća utakmica je za:',
  subtitle,
  compact = false,
  className = '',
}: Props) {
  const [target, setTarget] = useState<Date>(() => getCountdownTarget(Date.now(), targetDate, targetDates));
  const [diff, setDiff] = useState<Diff | null>(null);

  useEffect(() => {
    const tick = () => {
      const nowMs = Date.now();
      const nextTarget = getCountdownTarget(nowMs, targetDate, targetDates);
      setTarget(nextTarget);
      setDiff(computeDiff(nextTarget.getTime(), nowMs));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate, targetDates]);

  const d = diff?.days ?? 0;
  const h = diff?.hours ?? 0;
  const m = diff?.minutes ?? 0;
  const s = diff?.seconds ?? 0;

  const dateStr = target.toLocaleString('sr-Latn-RS', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-warning/30 bg-gradient-to-br from-[#0b1224] via-[#0d1530] to-[#0b1224] shadow-glow-warning ${
        compact ? 'p-3 sm:p-3.5 lg:p-5' : 'p-5 sm:p-6'
      } ${className}`}
    >
      <div aria-hidden className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-warning/15 blur-3xl pointer-events-none" />
      <div aria-hidden className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative">
        <div
          className={`flex items-center gap-2 text-warning uppercase tracking-[0.18em] font-bold ${
            compact ? 'text-[9px] sm:text-[10px] lg:text-xs' : 'text-[11px] sm:text-xs'
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
          {title}
        </div>

        {diff?.isLive ? (
          <div className={`${compact ? 'mt-2.5 text-lg sm:text-xl lg:mt-4 lg:text-2xl' : 'mt-4 text-2xl sm:text-3xl'} font-display font-bold text-primary`}>
            Utakmica je u toku ⚽
          </div>
        ) : (
          <div className={`${compact ? 'mt-2.5 gap-1.5 lg:mt-4 lg:gap-3' : 'mt-4 gap-2 sm:gap-4'} grid grid-cols-[repeat(4,minmax(0,1fr))] max-w-xl`}>
            <Cell value={d} label={plural(d, DAY_FORMS)} compact={compact} />
            <Cell value={h} label={plural(h, HOUR_FORMS)} compact={compact} />
            <Cell value={m} label={plural(m, MIN_FORMS)} compact={compact} />
            <Cell value={s} label={plural(s, SEC_FORMS)} compact={compact} />
          </div>
        )}

        <div className={`${compact ? 'mt-2.5 text-[10px] lg:mt-4 lg:text-xs' : 'mt-4 text-[11px] sm:text-xs'} text-muted`}>
          {subtitle ?? <>Termin: <span className="text-text/80 capitalize">{dateStr}</span> • KSC Jarac</>}
        </div>
      </div>
    </div>
  );
}

function Cell({ value, label, compact = false }: { value: number; label: string; compact?: boolean }) {
  return (
    <div className={`min-w-0 text-center rounded-xl bg-white/[0.03] border border-white/5 ${compact ? 'px-1 py-2 sm:px-1.5 sm:py-2.5 lg:px-2 lg:py-4' : 'px-2 py-3 sm:py-4'}`}>
      <div className={`font-display font-bold tabular-nums leading-none text-white ${compact ? 'text-2xl xs:text-[1.7rem] sm:text-3xl lg:text-5xl' : 'text-4xl sm:text-5xl'}`}>
        {String(value).padStart(2, '0')}
      </div>
      <div className={`${compact ? 'mt-1 text-[8px] tracking-[0.08em] xs:text-[9px] sm:text-[10px] sm:tracking-[0.14em] lg:mt-1.5 lg:text-[11px]' : 'mt-1.5 text-[10px] sm:text-[11px] tracking-[0.14em]'} truncate uppercase text-muted font-semibold`}>
        {label}
      </div>
    </div>
  );
}

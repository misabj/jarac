'use client';

import { useMemo, useState } from 'react';

export type FormPoint = {
  match_number: string;
  points: number;     // 3 / 1 / 0
  goals: number;
  assists: number;
  is_counted: boolean;
};

interface Props {
  data: FormPoint[];
}

/**
 * SVG linijski grafikon forme igrača kroz sezonu.
 * Y osa = bodovi po utakmici (0 / 1 / 3).
 * Na desnoj strani prikazuje i sumu golova kao tanka traka (opciono).
 */
export function PlayerFormChart({ data }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  // Filter samo utakmice koje se računaju
  const points = useMemo(
    () => data.filter((d) => d.is_counted),
    [data]
  );

  if (points.length === 0) {
    return (
      <div className="card p-6 text-center text-muted text-sm">
        Igrač još nije odigrao nijednu zvaničnu utakmicu u ovoj sezoni.
      </div>
    );
  }

  // Geometry
  const W = Math.max(320, points.length * 32 + 60);
  const H = 220;
  const PAD = { top: 20, right: 16, bottom: 32, left: 30 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const yMax = 3;
  const xStep = points.length > 1 ? innerW / (points.length - 1) : 0;
  const yFor = (p: number) => PAD.top + innerH - (p / yMax) * innerH;
  const xFor = (i: number) => PAD.left + i * xStep;

  // Sums
  const totalPts = points.reduce((s, d) => s + d.points, 0);
  const wins = points.filter((p) => p.points === 3).length;
  const draws = points.filter((p) => p.points === 1).length;
  const losses = points.filter((p) => p.points === 0).length;
  const avg = totalPts / points.length;

  // Polyline path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(p.points).toFixed(2)}`)
    .join(' ');

  // Area fill path
  const areaPath =
    `M ${xFor(0).toFixed(2)} ${yFor(0).toFixed(2)} ` +
    points
      .map((p, i) => `L ${xFor(i).toFixed(2)} ${yFor(p.points).toFixed(2)}`)
      .join(' ') +
    ` L ${xFor(points.length - 1).toFixed(2)} ${yFor(0).toFixed(2)} Z`;

  // Y axis ticks
  const ticks = [0, 1, 3];

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex flex-wrap gap-2 sm:gap-3 text-xs mb-3">
        <Legend swatch="bg-primary" label={`Pobede: ${wins}`} />
        <Legend swatch="bg-warning" label={`Nerešeno: ${draws}`} />
        <Legend swatch="bg-danger/70" label={`Porazi: ${losses}`} />
        <span className="ml-auto text-muted">
          Prosek <span className="text-warning font-semibold tabular-nums">{avg.toFixed(2)}</span> bod/utk
        </span>
      </div>

      <div className="overflow-x-auto scrollbar-clean -mx-2 px-2">
        <svg
          width={W}
          height={H}
          role="img"
          aria-label="Linija forme igrača kroz sezonu"
          className="block"
        >
          {/* Y gridlines & labels */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={yFor(t)}
                y2={yFor(t)}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4 4"
              />
              <text
                x={PAD.left - 8}
                y={yFor(t) + 4}
                textAnchor="end"
                className="fill-muted text-[10px]"
              >
                {t}
              </text>
            </g>
          ))}

          {/* Average reference line */}
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={yFor(avg)}
            y2={yFor(avg)}
            stroke="#facc15"
            strokeOpacity={0.4}
            strokeDasharray="2 4"
          />

          {/* Gradient area fill */}
          <defs>
            <linearGradient id="formAreaGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="formLineGrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#formAreaGrad)" />
          <path d={linePath} fill="none" stroke="url(#formLineGrad)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

          {/* Data points */}
          {points.map((p, i) => {
            const color =
              p.points === 3 ? '#22c55e' : p.points === 1 ? '#facc15' : '#ef4444';
            const cx = xFor(i);
            const cy = yFor(p.points);
            const isHover = hover === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                className="cursor-pointer"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHover ? 7 : 4.5}
                  fill={color}
                  stroke="#0b1120"
                  strokeWidth={2}
                  style={{ transition: 'r 120ms' }}
                />
                {/* invisible hit area */}
                <rect
                  x={cx - 18}
                  y={PAD.top}
                  width={36}
                  height={innerH}
                  fill="transparent"
                />
              </g>
            );
          })}

          {/* X axis labels */}
          {points.map((p, i) => {
            // prikaži svaki, ali samo svaki 2. label ako ih ima više od 20
            const show = points.length <= 20 || i % 2 === 0;
            if (!show) return null;
            return (
              <text
                key={i}
                x={xFor(i)}
                y={H - 10}
                textAnchor="middle"
                className="fill-muted text-[10px] tabular-nums"
              >
                {p.match_number}
              </text>
            );
          })}

          {/* Tooltip */}
          {hover != null && points[hover] && (
            <g pointerEvents="none">
              <line
                x1={xFor(hover)}
                x2={xFor(hover)}
                y1={PAD.top}
                y2={H - PAD.bottom}
                stroke="rgba(255,255,255,0.18)"
                strokeDasharray="3 3"
              />
            </g>
          )}
        </svg>
      </div>

      {hover != null && points[hover] && (
        <div className="mt-3 inline-flex items-center gap-3 rounded-xl bg-background/60 border border-border/60 px-3 py-2 text-xs">
          <span className="font-bold text-text">Utakmica {points[hover].match_number}</span>
          <span className={
            points[hover].points === 3 ? 'text-primary font-semibold'
            : points[hover].points === 1 ? 'text-warning font-semibold'
            : 'text-danger font-semibold'
          }>
            {points[hover].points === 3 ? 'Pobeda (3 b)'
              : points[hover].points === 1 ? 'Nerešeno (1 b)'
              : 'Poraz (0 b)'}
          </span>
          {points[hover].goals > 0 && <span className="text-primary tabular-nums">{points[hover].goals}G</span>}
          {points[hover].assists > 0 && <span className="text-secondary tabular-nums">{points[hover].assists}A</span>}
        </div>
      )}
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted">
      <span className={`inline-block w-3 h-3 rounded-sm ${swatch}`} />
      {label}
    </span>
  );
}

'use client';

import { useTransition } from 'react';
import { createMatchAction, updateMatchAction } from '@/app/admin/actions';
import type { Match, Season } from '@/lib/types';
import { AdminLineupPlanner, type AdminLineupPlannerPlayer } from './AdminLineupPlanner';

interface Props {
  seasons: Season[];
  defaultSeasonId?: number;
  match?: Match;
  lineupPlayers?: AdminLineupPlannerPlayer[];
}

function toLocalInput(value: string | null | undefined): string {
  if (!value) return '';
  // Expected DB format: 'YYYY-MM-DD HH:MM:SS'
  return value.replace(' ', 'T').slice(0, 16);
}

export function AdminMatchForm({ seasons, defaultSeasonId, match, lineupPlayers = [] }: Props) {
  const [pending, start] = useTransition();
  const action = match ? updateMatchAction : createMatchAction;

  return (
    <form action={(fd) => start(() => action(fd))} className="space-y-4 text-sm">
      {match && <input type="hidden" name="id" value={match.id} />}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="stat-label">Sezona</label>
          <select name="season_id" className="input mt-1" defaultValue={match?.season_id ?? defaultSeasonId}>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="stat-label">Broj utakmice</label>
          <input name="match_number" className="input mt-1" required defaultValue={match?.match_number} placeholder="1, 2a, 13A…" />
        </div>
        <div>
          <label className="stat-label">Datum i vreme</label>
          <input
            name="played_at"
            type="datetime-local"
            className="input mt-1"
            required
            defaultValue={toLocalInput(match?.played_at)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="stat-label">Sala</label>
          <input name="venue" className="input mt-1" defaultValue={match?.venue ?? 'KSC Jarac'} />
        </div>
        <div>
          <label className="stat-label">Termin (label)</label>
          <input name="scheduled_time" className="input mt-1" defaultValue={match?.scheduled_time ?? '17:00'} />
        </div>
        <div>
          <label className="stat-label">Selektor</label>
          <input name="selector_name" className="input mt-1" defaultValue={match?.selector_name ?? ''} />
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="stat-label">Rezultat</div>
            <p className="mt-1 text-xs text-muted">
              Može ručno da se izmeni ovde. Live unos igrača će ga automatski preračunati posle čuvanja golova/autogolova.
            </p>
          </div>
          {match && (
            <div className="font-display text-2xl font-bold tabular-nums">
              <span className="text-primary">{match.white_score}</span>
              <span className="mx-2 text-muted">:</span>
              <span>{match.colored_score}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <div>
            <label className="stat-label">Beli rezultat</label>
            <input
              name="white_score"
              type="number"
              min={0}
              className="input mt-1 text-center font-display text-3xl font-bold tabular-nums text-primary"
              defaultValue={match?.white_score ?? 0}
            />
          </div>
          <div className="pb-3 font-display text-3xl font-bold text-muted">:</div>
          <div>
            <label className="stat-label">Šareni rezultat</label>
            <input
              name="colored_score"
              type="number"
              min={0}
              className="input mt-1 text-center font-display text-3xl font-bold tabular-nums"
              defaultValue={match?.colored_score ?? 0}
            />
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="is_counted"
          defaultChecked={match ? match.is_counted === 1 : true}
          className="h-4 w-4 accent-primary"
        />
        <span>Utakmica se računa u statistiku</span>
      </label>

      {!match && lineupPlayers.length > 0 && (
        <AdminLineupPlanner players={lineupPlayers} />
      )}

      <div>
        <label className="stat-label">Reporter</label>
        <input name="reporter_name" className="input mt-1" defaultValue={match?.reporter_name ?? ''} />
      </div>

      <div>
        <label className="stat-label">Izveštaj</label>
        <textarea name="report" rows={6} className="input mt-1 font-sans leading-relaxed" defaultValue={match?.report ?? ''} />
      </div>

      <div>
        <label className="stat-label">Napomena</label>
        <textarea name="notes" rows={2} className="input mt-1" defaultValue={match?.notes ?? ''} />
      </div>

      <button className="btn-primary w-full" disabled={pending}>
        {pending ? 'Čuvanje…' : match ? 'Sačuvaj izmene' : 'Kreiraj utakmicu'}
      </button>
    </form>
  );
}

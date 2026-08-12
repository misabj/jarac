import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { loginAction, logoutAction } from './actions';
import { getMatchesWithSeason, getPlayers, getActiveSeason } from '@/lib/queries';
import { fmtDate } from '@/lib/format';
import type { Match } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  if (!(await isAdmin())) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="card p-6">
          <h1 className="text-2xl font-bold mb-2">Admin prijava</h1>
          {sp.error && (
            <p className="text-sm text-danger mb-3">Pogrešna lozinka.</p>
          )}
          <form action={loginAction} className="space-y-3">
            <input type="password" name="password" className="input" placeholder="Lozinka" autoFocus required />
            <button className="btn-primary w-full">Uloguj se</button>
          </form>
        </div>
      </div>
    );
  }

  const [season, players, matches] = await Promise.all([getActiveSeason(), getPlayers(), getMatchesWithSeason()]);
  const activeSeasonMatches = season ? matches.filter((match) => match.season_id === season.id) : [];
  const regularSeasonMatches = matches.filter((match) => match.season_name === 'Jarac 2025/26');

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <header className="flex items-end justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Admin panel</h1>
          <p className="text-muted mt-1">Aktivna sezona: {season?.name ?? '—'}</p>
        </div>
        <form action={logoutAction}>
          <button className="btn-ghost text-sm">Odjavi se</button>
        </form>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/admin/players" className="card card-hover p-5">
          <div className="text-3xl font-black text-primary">{players.length}</div>
          <div className="text-sm text-muted mt-1">Igrača u bazi</div>
          <div className="mt-3 text-sm font-semibold text-primary">Upravljaj igračima →</div>
        </Link>
        <Link href="/admin/matches" className="card card-hover p-5">
          <div className="text-3xl font-black text-secondary">{matches.length}</div>
          <div className="text-sm text-muted mt-1">Utakmica u bazi</div>
          <div className="mt-3 text-sm font-semibold text-secondary">Upravljaj utakmicama →</div>
        </Link>
        <Link href="/admin/matches/new" className="card card-hover p-5 border-warning/40">
          <div className="text-xl font-black text-warning">+ Nova utakmica</div>
          <div className="text-sm text-muted mt-1">Dodaj novi termin</div>
        </Link>
      </div>

      <div className="mb-8">
        <Link href="/admin/gallery" className="card card-hover p-5 flex items-center justify-between">
          <div>
            <div className="text-xl font-black text-primary">Galerija</div>
            <div className="text-sm text-muted mt-1">Dodaj i briši slike</div>
          </div>
          <span className="text-sm font-semibold text-primary">Upravljaj galerijom →</span>
        </Link>
      </div>

      <div className="mb-8">
        <Link href="/admin/beer" className="card card-hover p-5 flex items-center justify-between">
          <div>
            <div className="text-xl font-black text-warning">🍺 Kasa za pivo</div>
            <div className="text-sm text-muted mt-1">Evidencija uplata (transparentno na sajtu)</div>
          </div>
          <span className="text-sm font-semibold text-warning">Upravljaj kasom →</span>
        </Link>
      </div>

      <section className="space-y-6">
        <AdminMatchSection
          title="Letnja razvojna liga"
          subtitle="Trenutno aktivno takmičenje"
          matches={activeSeasonMatches}
          accent="primary"
        />
        <AdminMatchSection
          title="Jarac 2025/26"
          subtitle="Regularna sezona"
          matches={regularSeasonMatches}
          accent="secondary"
          limit={8}
        />
      </section>
    </div>
  );
}

function AdminMatchSection({
  title,
  subtitle,
  matches,
  accent,
  limit,
}: {
  title: string;
  subtitle: string;
  matches: Array<Match & { season_name: string }>;
  accent: 'primary' | 'secondary';
  limit?: number;
}) {
  const visibleMatches = limit ? matches.slice(0, limit) : matches;
  const dotClass = accent === 'primary' ? 'bg-primary' : 'bg-secondary';
  const textClass = accent === 'primary' ? 'text-primary' : 'text-secondary';

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
            {subtitle}
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold">{title}</h2>
        </div>
        <span className="text-xs text-muted">{matches.length} utakmica</span>
      </div>

      <div className="card divide-y divide-border/60">
        {visibleMatches.map((m) => (
          <Link
            key={m.id}
            href={`/admin/matches/${m.id}`}
            className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-card-hover/60 transition"
          >
            <div className="min-w-0">
              <div className="truncate font-bold">FUDBAL BR. {m.match_number}</div>
              <div className="text-xs text-muted">{fmtDate(m.played_at)}</div>
            </div>
            <div className={`shrink-0 text-2xl font-black tabular-nums ${textClass}`}>
              {m.white_score} : {m.colored_score}
            </div>
          </Link>
        ))}
        {matches.length === 0 && <div className="px-5 py-8 text-center text-muted">Nema utakmica u ovoj sekciji.</div>}
      </div>
    </div>
  );
}

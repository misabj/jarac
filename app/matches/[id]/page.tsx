import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMatchById, getMatchLineupPlayers, getMatchPlayers } from '@/lib/queries';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { TeamBadge } from '@/components/TeamBadge';
import { UpcomingMatchPitch } from '@/components/UpcomingMatchPitch';
import { MatchScorerLists } from '@/components/MatchScorerLists';
import { fmtDateTime, fmtNum } from '@/lib/format';
import type { MatchPlayerWithPlayer } from '@/lib/types';

export const revalidate = 300;

function isMatchFinished(playedAt: string) {
  return new Date(playedAt.replace(' ', 'T')).getTime() + 60 * 60 * 1000 <= Date.now();
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);
  if (!matchId) notFound();

  const match = await getMatchById(matchId);
  if (!match) notFound();

  const [players, lineupPlayers] = await Promise.all([
    getMatchPlayers(match.id),
    getMatchLineupPlayers(match.id),
  ]);

  const whites = players.filter((p) => p.team === 'white');
  const coloreds = players.filter((p) => p.team === 'colored');
  const mvp = players.find((p) => p.is_mvp);

  const finished = isMatchFinished(match.played_at);

  const winner =
    match.result_type === 'white_win'
      ? 'Beli tim'
      : match.result_type === 'colored_win'
        ? 'Šareni tim'
        : 'Nerešeno';

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-6 sm:py-8">
      <Link href="/matches" className="text-sm text-muted hover:text-text">
        ← Sve utakmice
      </Link>

      {/* Header */}
      <div className="card mt-4 p-6 sm:p-10 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute top-0 right-0 h-56 w-56 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-float"
        />
        <div
          aria-hidden
          className="absolute -bottom-10 -left-10 h-56 w-56 bg-secondary/10 rounded-full blur-3xl pointer-events-none animate-float"
          style={{ animationDelay: '1.4s' }}
        />

        <div className="relative">
          <div className="chip mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
            Fudbal br. {match.match_number} • {match.venue}
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight animate-fade-up">
            FUDBAL BR. {match.match_number}
          </h1>

          <div className="text-muted mt-2 animate-fade-up" style={{ animationDelay: '60ms' }}>
            {fmtDateTime(match.played_at)}
            {match.selector_name && (
              <>
                {' '}
                • Selektor: <span className="text-text">{match.selector_name}</span>
              </>
            )}
          </div>

          {!match.is_counted && (
            <div className="mt-4 inline-block bg-warning/15 text-warning px-3 py-1.5 rounded-lg text-xs border border-warning/30 uppercase tracking-[0.16em] font-semibold">
              Ova utakmica se ne računa u statistiku
            </div>
          )}

          <div className="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4 max-w-3xl mx-auto animate-pop-in">
            <div className="text-right min-w-0">
              <TeamBadge team="white" />
              <div className="text-xs sm:text-sm text-muted mt-2 truncate">Beli tim</div>
            </div>

            <div className="text-center font-display text-5xl xs:text-6xl sm:text-7xl md:text-8xl font-bold tabular-nums whitespace-nowrap leading-none">
              <span
                className={
                  finished && match.result_type === 'white_win'
                    ? 'text-primary drop-shadow-[0_0_28px_rgba(34,197,94,0.45)]'
                    : ''
                }
              >
                {match.white_score}
              </span>
              <span className="text-muted mx-1.5 sm:mx-3">:</span>
              <span
                className={
                  finished && match.result_type === 'colored_win'
                    ? 'text-primary drop-shadow-[0_0_28px_rgba(34,197,94,0.45)]'
                    : ''
                }
              >
                {match.colored_score}
              </span>
            </div>

            <div className="min-w-0">
              <TeamBadge team="colored" />
              <div className="text-xs sm:text-sm text-muted mt-2 truncate">Šareni tim</div>
            </div>
          </div>

          <MatchScorerLists
            whitePlayers={whites}
            coloredPlayers={coloreds}
            className="mt-10 animate-fade-up"
            style={{ animationDelay: '120ms' }}
          />

          {finished && (
            <div className="text-center mt-7 text-sm animate-fade-up" style={{ animationDelay: '160ms' }}>
              <span className="text-muted">Pobednik: </span>
              <span className="font-semibold">{winner}</span>
            </div>
          )}
        </div>
      </div>

      {/* MVP */}
      {mvp && finished && (
        <div className="mt-6 card p-5 border-warning/40 bg-warning/[0.04] animate-pop-in shadow-glow-warning">
          <div className="flex items-center gap-4">
            <div className="text-3xl animate-float">🏆</div>
            <PlayerAvatar name={mvp.display_name} photoUrl={mvp.photo_url} size={56} />
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-warning font-bold">MVP utakmice</div>
              <a href={`/players/${mvp.slug}`} className="font-display text-2xl font-bold hover:text-primary transition">
                {mvp.display_name}
              </a>
              {mvp.comment && <div className="text-sm text-muted mt-1">{mvp.comment}</div>}
            </div>
          </div>
        </div>
      )}

      {lineupPlayers.length > 0 && (
        <UpcomingMatchPitch
          match={match}
          players={lineupPlayers}
          eyebrow={finished ? 'Postave utakmice' : 'Utakmica koja sledi / postave'}
          showDetailsLink={false}
          className="mt-6"
        />
      )}

      {/* Teams */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
        <div className="stagger-item">
          <TeamTable team="white" players={whites} score={match.white_score} />
        </div>
        <div className="stagger-item">
          <TeamTable team="colored" players={coloreds} score={match.colored_score} />
        </div>
      </div>

      {/* Report */}
      {match.report && finished && (
        <section className="mt-10 animate-fade-up">
          <h2 className="font-display text-2xl font-bold mb-3">Izveštaj utakmice</h2>
          <article className="card p-6 sm:p-8 prose prose-invert max-w-none leading-relaxed">
            {match.report.split('\n').map((para, i) => (
              <p key={i} className="text-text/90 leading-relaxed">
                {para}
              </p>
            ))}
            {match.reporter_name && (
              <div className="text-sm text-muted mt-4 not-prose">
                — <span className="text-text/80">{match.reporter_name}</span>
              </div>
            )}
          </article>
        </section>
      )}

      {match.notes && (
        <section className="mt-6">
          <div className="card p-4 text-sm text-muted">
            <span className="text-xs uppercase tracking-wider text-warning font-bold mr-2">Napomena:</span>
            {match.notes}
          </div>
        </section>
      )}
    </div>
  );
}

function TeamTable({
  team,
  players,
  score,
}: {
  team: 'white' | 'colored';
  players: MatchPlayerWithPlayer[];
  score: number;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-border/60">
        <TeamBadge team={team} />
        <div className="font-display text-3xl font-bold tabular-nums">{score}</div>
      </div>

      <div className="overflow-x-auto scrollbar-clean">
        <table className="table-base">
          <thead>
            <tr>
              <th>Igrač</th>
              <th className="text-right">G</th>
              <th className="text-right">A</th>
              <th className="text-right">AG</th>
              <th className="text-right">Ocena</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id}>
                <td>
                  <a href={`/players/${p.slug}`} className="flex items-center gap-2 hover:text-primary">
                    <PlayerAvatar name={p.display_name} photoUrl={p.photo_url} size={28} />
                    <span className="font-medium">{p.display_name}</span>
                    {p.is_mvp ? <span className="text-warning text-xs">★</span> : null}
                  </a>
                </td>
                <td className="text-right tabular-nums text-primary font-semibold">{p.goals || ''}</td>
                <td className="text-right tabular-nums text-secondary">{p.assists || ''}</td>
                <td className="text-right tabular-nums text-danger">{p.own_goals || ''}</td>
                <td className="text-right tabular-nums">{p.rating != null ? fmtNum(p.rating, 1) : '—'}</td>
              </tr>
            ))}

            {players.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  Nema podataka.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
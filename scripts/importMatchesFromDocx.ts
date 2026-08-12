/**
 * Uvozi utakmice iz Word (.docx) fajla u sezonu.
 *
 * Format (kao u "Jarac 2025-26.docx"):
 *
 *   FUDBAL BR. <broj>[a/b]
 *
 *   <d.m.gggg>. [vreme]
 *
 *   <TIM1>-<TIM2> <skor1>:<skor2>
 *
 *   Selektor: <ime>
 *
 *   <TIM1>:
 *   Prezime Ime ×<golovi> [(asistencije ×<n>[; autogol ×<n>])]
 *   ...
 *
 *   <TIM2>:
 *   ...
 *
 *   [tekst izveštaja]
 *   [Izveštač: Ime]
 *
 * Pokretanje:
 *   npm run import:matches:docx -- "./data/Jarac 2025-26.docx" "Jarac 2025/26"
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mammoth from 'mammoth';
import mysql from 'mysql2/promise';
import slugify from 'slugify';

// ---------------- helpers ----------------
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameToSlug(name: string): string {
  return slugify(name, { lower: true, strict: true, locale: 'sr' });
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { first: parts[0], last: '' };
  if (parts.length === 2) return { first: parts[1], last: parts[0] };
  return { first: parts.slice(1).join(' '), last: parts[0] };
}

type ParsedPlayer = {
  rawName: string;
  goals: number;
  assists: number;
  ownGoals: number;
  isMvp: boolean;
  note: string | null;
};

type ParsedMatch = {
  matchNumber: string;
  playedAt: Date | null;
  scheduledTime: string | null;
  whiteScore: number;
  coloredScore: number;
  whitePlayers: ParsedPlayer[];
  coloredPlayers: ParsedPlayer[];
  selectorName: string | null;
  reporterName: string | null;
  report: string;
};

const MULT = '\u00d7'; // ×
const X_ANY = `[${MULT}xX]`;
const DASH = '[\\-\\u2013\\u2014]'; // - – —

const PLAYER_LINE_RE = new RegExp(
  `^([A-Za-zĐŠŽĆČđšžćč.'\\- ]+?)\\s*${X_ANY}\\s*(\\d+)(?:\\s*\\(([^)]+)\\))?\\s*$`
);
// Alternativni format: "Ime Prezime –" (statistika nepoznata, gola nije bilo)
const PLAYER_NOSTAT_RE = new RegExp(
  `^([A-Za-zĐŠŽĆČđšžćč.'\\- ]+?)\\s*${DASH}\\s*$`
);

function parseDateAndTime(s: string): { date: Date | null; time: string | null } {
  const dm = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})\.?/);
  if (!dm) return { date: null, time: null };
  const day = Number(dm[1]);
  const mon = Number(dm[2]) - 1;
  const year = Number(dm[3]);

  let hour = 18;
  let minute = 0;
  let timeStr: string | null = null;

  const hm = s.match(/(\d{1,2}):(\d{2})/);
  if (hm) {
    hour = Number(hm[1]);
    minute = Number(hm[2]);
    timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  } else {
    const hh = s.match(/(\d{1,2})\s*h\b/i);
    if (hh) {
      hour = Number(hh[1]);
      timeStr = `${String(hour).padStart(2, '0')}:00`;
    }
  }
  return { date: new Date(year, mon, day, hour, minute), time: timeStr };
}

function parseScoreLine(line: string): { firstTeam: 'white' | 'colored'; score1: number; score2: number } | null {
  const m = line.match(/^\s*(beli|sareni|šareni)\s*[-–]\s*(beli|sareni|šareni)\s+(\d+)\s*:\s*(\d+)\s*$/i);
  if (!m) return null;
  const first = m[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return {
    firstTeam: first === 'beli' ? 'white' : 'colored',
    score1: Number(m[3]),
    score2: Number(m[4]),
  };
}

function isTeamHeader(line: string): 'white' | 'colored' | null {
  const n = norm(line).replace(/[:]/g, '').trim();
  if (n === 'beli' || n === 'beli tim') return 'white';
  if (n === 'sareni' || n === 'sareni tim') return 'colored';
  return null;
}

function parsePlayerLine(line: string): ParsedPlayer | null {
  const cleaned = line.replace(/^\s*[-•*]\s*/, '').trim();
  if (!cleaned) return null;

  // Fallback: "Ime Prezime –" → goals=0, bez statistike
  const m = cleaned.match(PLAYER_LINE_RE);
  if (!m) {
    const noStat = cleaned.match(PLAYER_NOSTAT_RE);
    if (!noStat) return null;
    const rawName = noStat[1].trim().replace(/\s+/g, ' ');
    if (rawName.length < 2 || /^\d+$/.test(rawName)) return null;
    return { rawName, goals: 0, assists: 0, ownGoals: 0, isMvp: false, note: null };
  }

  const rawName = m[1].trim().replace(/\s+/g, ' ');
  if (rawName.length < 2) return null;
  const goals = Number(m[2]);
  const detail = (m[3] ?? '').toLowerCase();

  let assists = 0;
  let ownGoals = 0;
  let isMvp = false;

  const a = detail.match(new RegExp(`asist\\w*\\s*${X_ANY}?\\s*(\\d+)`));
  if (a) assists = Number(a[1]);

  const ag = detail.match(new RegExp(`autogol\\w*\\s*${X_ANY}?\\s*(\\d+)`));
  if (ag) ownGoals = Number(ag[1]);

  if (/\bmvp\b/i.test(detail)) isMvp = true;

  return { rawName, goals, assists, ownGoals, isMvp, note: detail || null };
}

// ---------------- splitting ----------------
/**
 * Detektuje granicu utakmice kao redosled: [naslov(i)] → datum → skor.
 * Time se hvata i klasičan "FUDBAL BR. X" i vanredne utakmice (npr. "JARAC RESURRECTION").
 */
function splitMatches(text: string): { number: string; title: string | null; body: string }[] {
  const rawLines = text.split('\n');
  // Pronađi sve granice (linija sa datumom + sledeća neprazna sa skorom)
  type Boundary = { startLine: number; matchNumber: string; title: string | null };
  const boundaries: Boundary[] = [];
  let synthCounter = 0;
  let extraCounter = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const lineTrim = rawLines[i].trim();
    if (!lineTrim) continue;
    const dt = parseDateAndTime(lineTrim);
    if (!dt.date) continue;
    // Sledeća neprazna linija mora biti skor
    let j = i + 1;
    while (j < rawLines.length && rawLines[j].trim() === '') j++;
    if (j >= rawLines.length) continue;
    if (!parseScoreLine(rawLines[j].trim())) continue;

    // Naslov: sve neprazne linije unazad do prazne (ili do prethodne granice)
    const prevEnd = boundaries.length > 0 ? boundaries[boundaries.length - 1].startLine : 0;
    const titleLines: string[] = [];
    let k = i - 1;
    while (k >= 0 && rawLines[k].trim() === '') k--;
    while (k >= prevEnd && rawLines[k].trim() !== '') {
      titleLines.unshift(rawLines[k].trim());
      k--;
    }
    const titleStr = titleLines.join(' ').trim();

    const fud = titleStr.match(/FUDBAL\s+BR\.?\s*([0-9]+[a-zA-Z]?)/i);
    let matchNumber: string;
    let title: string | null = titleStr || null;
    if (fud) {
      matchNumber = fud[1];
    } else if (titleStr) {
      // Naslov u stilu "JARAC RESURRECTION" — koristi prvih par znakova kao ID
      const slug = titleStr
        .toUpperCase()
        .replace(/[^A-ZČĆŠĐŽ0-9]+/g, '')
        .slice(0, 8);
      matchNumber = slug || `X${++extraCounter}`;
    } else {
      matchNumber = `M${++synthCounter}`;
      title = null;
    }

    // start utakmice = prvi red naslova (ili red datuma ako nema naslova)
    const startLine = titleLines.length ? k + 1 : i;
    boundaries.push({ startLine, matchNumber, title });
  }

  // Konstruisanje body-ja između granica
  const result: { number: string; title: string | null; body: string }[] = [];
  for (let idx = 0; idx < boundaries.length; idx++) {
    const b = boundaries[idx];
    const end = idx + 1 < boundaries.length ? boundaries[idx + 1].startLine : rawLines.length;
    const body = rawLines.slice(b.startLine, end).join('\n').trim();
    result.push({ number: b.matchNumber, title: b.title, body });
  }
  return result;
}

function parseMatch(rawBlock: { number: string; title: string | null; body: string }): ParsedMatch {
  const out: ParsedMatch = {
    matchNumber: rawBlock.number,
    playedAt: null,
    scheduledTime: null,
    whiteScore: 0,
    coloredScore: 0,
    whitePlayers: [],
    coloredPlayers: [],
    selectorName: null,
    reporterName: null,
    report: '',
  };

  const items = rawBlock.body.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (!items.length) return out;

  // Pronađi indeks prve linije koja je validan datum + sledeća je skor.
  // (Naslov utakmice može biti jedna ili više linija, npr. "JARAC RESURRECTION".)
  let dateIdx = -1;
  for (let k = 0; k < items.length - 1; k++) {
    const dt = parseDateAndTime(items[k]);
    if (dt.date && parseScoreLine(items[k + 1])) {
      dateIdx = k;
      break;
    }
  }
  if (dateIdx < 0) return out;

  // datum
  const { date, time } = parseDateAndTime(items[dateIdx]);
  out.playedAt = date;
  out.scheduledTime = time;

  // skor
  const sc = parseScoreLine(items[dateIdx + 1]);
  if (sc) {
    if (sc.firstTeam === 'white') {
      out.whiteScore = sc.score1;
      out.coloredScore = sc.score2;
    } else {
      out.coloredScore = sc.score1;
      out.whiteScore = sc.score2;
    }
  }

  let i = dateIdx + 2;
  let section: 'none' | 'white' | 'colored' | 'report' = 'none';
  const reportLines: string[] = [];

  for (; i < items.length; i++) {
    const line = items[i];

    const sel = line.match(/^selektor\s*:\s*(.+)$/i);
    if (sel) {
      out.selectorName = sel[1].trim().replace(/\s*\(.*\)\s*$/, '').trim();
      continue;
    }

    const rep = line.match(/^izvešta[čc]\s*:\s*(.+)$/i) || line.match(/^slu[zž]bena\s+bele[zš]ka\s*:\s*(.+)$/i);
    if (rep) {
      out.reporterName = rep[1].trim();
      continue;
    }

    const team = isTeamHeader(line);
    if (team) {
      section = team;
      continue;
    }

    if (section === 'white' || section === 'colored') {
      const p = parsePlayerLine(line);
      if (p) {
        (section === 'white' ? out.whitePlayers : out.coloredPlayers).push(p);
        continue;
      }
      if (line.startsWith('(') && line.endsWith(')')) {
        reportLines.push(line);
        continue;
      }
      section = 'report';
    }
    if (section === 'report' || section === 'none') {
      reportLines.push(line);
    }
  }

  out.report = reportLines.join('\n').trim();
  return out;
}

// ---------------- main ----------------
async function main() {
  const file = process.argv[2];
  const seasonName = process.argv[3];
  if (!file || !seasonName) {
    console.error('Upotreba: npm run import:matches:docx -- <putanja-do-docx> "Naziv sezone"');
    process.exit(1);
  }
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error(`Fajl ne postoji: ${abs}`);
    process.exit(1);
  }

  const raw = await mammoth.extractRawText({ path: abs });
  const text = raw.value.replace(/\r\n/g, '\n');

  const blocks = splitMatches(text);
  console.log(`▶ Pronađeno blokova utakmica: ${blocks.length}`);
  if (!blocks.length) {
    console.error('Nijedan blok nije prepoznat.');
    process.exit(1);
  }

  const matches = blocks.map(parseMatch);

  const db = await mysql.createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'jarac',
  });

  const [seasonRows] = await db.query<any[]>('SELECT id FROM seasons WHERE name = ? LIMIT 1', [seasonName]);
  if (!seasonRows.length) {
    console.error(`Sezona "${seasonName}" ne postoji.`);
    await db.end();
    process.exit(1);
  }
  const seasonId = seasonRows[0].id;

  const [allPlayers] = await db.query<any[]>('SELECT id, slug, display_name FROM players');
  const bySlug = new Map<string, { id: number; display_name: string }>();
  for (const p of allPlayers) bySlug.set(p.slug, p);

  async function getOrCreatePlayer(displayName: string): Promise<number> {
    const slug = nameToSlug(displayName);
    const found = bySlug.get(slug);
    if (found) return found.id;
    const { first, last } = splitName(displayName);
    const [r] = await db.query<any>(
      `INSERT INTO players (first_name, last_name, display_name, slug, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [first, last, displayName, slug],
    );
    bySlug.set(slug, { id: r.insertId, display_name: displayName });
    console.log(`  + novi igrač: ${displayName}`);
    return r.insertId;
  }

  await db.query('DELETE FROM matches WHERE season_id = ?', [seasonId]);

  let inserted = 0;
  let skipped = 0;
  const beforeCount = bySlug.size;

  for (const m of matches) {
    if (!m.playedAt) {
      console.warn(`⚠ Preskočena utakmica br. ${m.matchNumber} — nema datuma.`);
      skipped++;
      continue;
    }

    const resultType =
      m.whiteScore > m.coloredScore
        ? 'white_win'
        : m.whiteScore < m.coloredScore
        ? 'colored_win'
        : 'draw';

    // Heuristika: utakmica se ne računa u statistiku ako tekst to izričito kaže.
    // Utakmica se ne računa u statistiku ako:
    //  - autor je u izveštaju eksplicitno napisao "neće se računati" (npr. 16A, 16B, 17A), ili
    //  - match_number nije čisto numerički (vanredna utakmica poput JARAC RESURRECTION).
    const isOfficialNumber = /^[0-9]+[a-zA-Z]?$/.test(m.matchNumber);
    const isCounted = !isOfficialNumber || /ne[ćc]e\s*(?:se\s*)?ra[čc]unati/i.test(m.report) ? 0 : 1;

    // koristi lokalno vreme, ne UTC
    const pad = (n: number) => String(n).padStart(2, '0');
    const d = m.playedAt;
    const playedAtSql = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

    const [r] = await db.query<any>(
      `INSERT INTO matches
         (season_id, match_number, played_at, venue, scheduled_time, selector_name,
          white_score, colored_score, result_type, is_counted, report, reporter_name)
       VALUES (?, ?, ?, 'SC Jarac', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        seasonId,
        m.matchNumber,
        playedAtSql,
        m.scheduledTime,
        m.selectorName,
        m.whiteScore,
        m.coloredScore,
        resultType,
        isCounted,
        m.report || null,
        m.reporterName,
      ],
    );
    const matchId = r.insertId;

    for (const team of (['white', 'colored'] as const)) {
      const list = team === 'white' ? m.whitePlayers : m.coloredPlayers;
      // Agreguj po igraču — ako se isti igrač pojavi više puta (greška u izvoru
      // ili igra u oba tima), saberi mu statistiku i prijavi ga samo u prvi tim.
      const agg = new Map<number, { team: 'white' | 'colored'; goals: number; assists: number; ownGoals: number; isMvp: boolean; note: string | null }>();
      for (const p of list) {
        const playerId = await getOrCreatePlayer(p.rawName);
        const existing = agg.get(playerId);
        if (existing) {
          existing.goals += p.goals;
          existing.assists += p.assists;
          existing.ownGoals += p.ownGoals;
          existing.isMvp = existing.isMvp || p.isMvp;
        } else {
          agg.set(playerId, {
            team,
            goals: p.goals,
            assists: p.assists,
            ownGoals: p.ownGoals,
            isMvp: p.isMvp,
            note: p.note,
          });
        }
      }
      for (const [playerId, p] of agg) {
        await db.query(
          `INSERT INTO match_players (match_id, player_id, team, goals, assists, own_goals, is_mvp, comment)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             goals = goals + VALUES(goals),
             assists = assists + VALUES(assists),
             own_goals = own_goals + VALUES(own_goals),
             is_mvp = is_mvp OR VALUES(is_mvp)`,
          [matchId, playerId, p.team, p.goals, p.assists, p.ownGoals, p.isMvp ? 1 : 0, p.note],
        );
      }
    }

    inserted++;
    console.log(
      `✓ FUDBAL BR. ${m.matchNumber.padEnd(3)} ${playedAtSql.slice(0, 10)}  ` +
        `${m.whiteScore}:${m.coloredScore}  (B:${m.whitePlayers.length}/Š:${m.coloredPlayers.length})` +
        (m.reporterName ? `  · izv. ${m.reporterName}` : ''),
    );
  }

  const newCount = bySlug.size - beforeCount;
  console.log(`\n▶ Uneto: ${inserted}, preskočeno: ${skipped}, novih igrača: ${newCount}.`);
  await db.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

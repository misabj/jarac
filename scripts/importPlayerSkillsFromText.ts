import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';

const file = process.argv[2];

if (!file) {
  console.error('Upotreba: npm run import:player-skills -- <putanja-do-pasted-text.txt>');
  process.exit(1);
}

const PLAYER_SKILL_FIELDS = [
  'skill_running',
  'skill_shooting',
  'skill_defense',
  'skill_efficiency',
  'skill_goalkeeper',
  'skill_dribbling',
  'skill_substitution',
  'skill_passing',
  'skill_control',
  'skill_explosiveness',
  'skill_stamina',
] as const;

const PLAYER_SKILL_TOTAL_FIELDS = PLAYER_SKILL_FIELDS.slice(0, 9) as readonly PlayerSkillField[];

type PlayerSkillField = (typeof PLAYER_SKILL_FIELDS)[number];
type SkillRecord = Record<PlayerSkillField, number | null>;

const aliasesBySlug: Record<string, string[]> = {
  'agbaba-stevan': ['steva'],
  'atanaskovic-dragan': ['gandra'],
  'balac-nemanja': ['balac', 'balać'],
  'bankovic-slobodan': ['sloba'],
  'bundalo-mladen': ['mladen'],
  'bundalo-nikola': ['nikola'],
  'cakic-vujadin': ['vujadin'],
  'ciric-stefan': ['cirko', 'ćirko'],
  'diligenski-ivan': ['diligenski', 'dili'],
  'drobnjak-aleksandar': ['droca'],
  'denda-bogdan': ['bogdan'],
  'djordjevic-sinisa': ['sinisa dj', 'siniša dj'],
  'djordjevic-stefan': ['def', 'đef', 'djef'],
  'gnjidic-milan': ['gnjidic', 'gnjidić'],
  'grkinic-miljan': ['obren'],
  'grkinic-ognjen': ['ognjen'],
  'hadzibulic-nedim': ['nedim'],
  'ignjatovic-milos': ['ignjatovic', 'ignjatović'],
  'igrutinovic-antonije': ['toni'],
  'igrutinovic-marko': ['vest hem', 'vesthem', 'wh'],
  'jerinic-pavle': ['jerinic', 'jerinić'],
  'marjanovic-jovan': ['jovica'],
  'klikovac-drasko': ['drasko', 'draško'],
  'korunovic-momir': ['moma'],
  'kutni-dusan': ['kutni', 'duca', 'dušan', 'dusan'],
  'milic-budimir': ['buda kv', 'buda'],
  'milinkovic-aleksandar': ['velin'],
  'milosevic-zoran': ['zoki m', 'zoki m.'],
  'nikolic-milos': ['somi', 'šomi'],
  'novakovic-mladen': ['zena'],
  'ortak-nikole-bundala': ['nikolin ortak'],
  'panic-zoran': ['zoki'],
  'petar-bogdanov': ['pjeki'],
  'radosavljevic-nikola': ['mali'],
  'radosavljevic-pavle': ['pavle r'],
  'savic-nemanja': ['atlantid'],
  'spaskovski-nebojsa': ['spaskovski'],
  'stambolic-antonije': ['vatrogasac'],
  'sutanovac-mikica': ['siko', 'šiko'],
  'terzic-veljko': ['veljko'],
  'varga': ['varga'],
};

async function main() {
  const absolute = path.resolve(file as string);
  const text = await fs.readFile(absolute, 'utf8');
  const parsed = parseSkillText(text);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jarac',
    charset: 'utf8mb4_unicode_ci',
  });

  const [players] = await conn.execute(
    'SELECT id, display_name, nickname, slug FROM players ORDER BY display_name ASC'
  );
  const playerIndex = buildPlayerIndex(players as Array<{ id: number; display_name: string; nickname: string | null; slug: string }>);

  const updates = new Map<number, { rawName: string; record: SkillRecord }>();
  const created: string[] = [];

  for (const [rawName, record] of parsed) {
    let playerId = playerIndex.get(norm(rawName));
    if (!playerId) {
      playerId = await createMissingPlayer(conn, rawName, playerIndex);
      created.push(rawName);
    }

    const current = updates.get(playerId);
    if (!current || preferRecord(record, current.record)) {
      updates.set(playerId, { rawName, record });
    }
  }

  let updated = 0;
  for (const [playerId, { rawName, record }] of updates) {
    const skillTotal = calculateSkillTotal(record);
    await conn.execute(
      `UPDATE players SET
         skill_running = ?,
         skill_shooting = ?,
         skill_defense = ?,
         skill_efficiency = ?,
         skill_goalkeeper = ?,
         skill_dribbling = ?,
         skill_substitution = ?,
         skill_passing = ?,
         skill_control = ?,
         skill_explosiveness = ?,
         skill_stamina = ?,
         skill_total = ?
       WHERE id = ?`,
      [...PLAYER_SKILL_FIELDS.map((field) => record[field]), skillTotal, playerId]
    );
    updated++;
    console.log(`✓ ${rawName.padEnd(18)} total ${skillTotal}`);
  }

  console.log('');
  console.log(`Ucitano iz teksta: ${parsed.size}`);
  console.log(`Azurirano igraca: ${updated}`);
  if (created.length) {
    console.log(`Kreirani novi igraci (${created.length}): ${created.sort((a, b) => a.localeCompare(b)).join(', ')}`);
  }

  await conn.end();
}

function parseSkillText(text: string): Map<string, SkillRecord> {
  const grouped = new Map<string, Array<{ rawName: string; record: SkillRecord; row: number }>>();
  const lines = text.split(/\r?\n/);

  for (let row = 0; row < lines.length; row++) {
    const cells = lines[row].split('\t').map((cell) => fixMojibake(cell.trim()));
    collectBlock(cells, 0, row, grouped);
    collectBlock(cells, 12, row, grouped);
  }

  const result = new Map<string, SkillRecord>();
  for (const entries of grouped.values()) {
    const best = chooseBest(entries);
    result.set(best.rawName, best.record);
  }
  return result;
}

function collectBlock(
  cells: string[],
  start: number,
  row: number,
  grouped: Map<string, Array<{ rawName: string; record: SkillRecord; row: number }>>
) {
  const rawName = cells[start];
  if (!isPlayerName(rawName)) return;

  const values = PLAYER_SKILL_FIELDS.map((field, index) => {
    void field;
    return parseNumber(cells[start + index + 1]);
  });

  const hasCoreValues = values.slice(0, 7).every((value) => value !== null);
  if (!hasCoreValues) return;
  if (values.every((value) => Number(value ?? 0) === 0)) return;

  const record = Object.fromEntries(
    PLAYER_SKILL_FIELDS.map((field, index) => [field, values[index]])
  ) as SkillRecord;
  const key = norm(rawName);
  const entries = grouped.get(key) ?? [];
  entries.push({ rawName, record, row });
  grouped.set(key, entries);
}

function chooseBest(entries: Array<{ rawName: string; record: SkillRecord; row: number }>) {
  const byRecord = new Map<string, { item: { rawName: string; record: SkillRecord; row: number }; count: number }>();
  for (const item of entries) {
    const key = JSON.stringify(PLAYER_SKILL_FIELDS.map((field) => item.record[field]));
    const current = byRecord.get(key);
    byRecord.set(key, { item, count: (current?.count ?? 0) + 1 });
  }

  return [...byRecord.values()]
    .sort((a, b) => {
      const completeA = isComplete(a.item.record) ? 1 : 0;
      const completeB = isComplete(b.item.record) ? 1 : 0;
      return completeB - completeA || b.count - a.count || b.item.row - a.item.row;
    })[0].item;
}

function isComplete(record: SkillRecord) {
  return PLAYER_SKILL_FIELDS.every((field) => record[field] !== null);
}

function calculateSkillTotal(record: SkillRecord) {
  return PLAYER_SKILL_TOTAL_FIELDS.reduce((total, field) => total + Number(record[field] ?? 0), 0);
}

function preferRecord(candidate: SkillRecord, current: SkillRecord) {
  const candidateComplete = isComplete(candidate) ? 1 : 0;
  const currentComplete = isComplete(current) ? 1 : 0;
  return candidateComplete > currentComplete || (
    candidateComplete === currentComplete && calculateSkillTotal(candidate) > calculateSkillTotal(current)
  );
}

function isPlayerName(value: string | undefined) {
  if (!value) return false;
  const normalized = norm(value);
  if (!normalized || normalized === 'total' || normalized === 'ukupno') return false;
  if (normalized.includes('n/a')) return false;
  if (['trcanje', 'sut', 'odbrana', 'efikasnost', 'golman', 'dribling', 'eksplozivnost', 'kondicija'].includes(normalized)) return false;
  return parseNumber(value) === null;
}

async function createMissingPlayer(
  conn: mysql.Connection,
  rawName: string,
  playerIndex: Map<string, number>
) {
  const displayName = rawName.trim();
  const slug = await makeUniqueSlug(conn, displayName);
  const [res] = await conn.execute(
    `INSERT INTO players (first_name, last_name, display_name, nickname, slug, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    ['', displayName, displayName, displayName, slug]
  );
  const playerId = (res as mysql.ResultSetHeader).insertId;
  addIndex(playerIndex, displayName, playerId);
  addIndex(playerIndex, slug, playerId);
  return playerId;
}

async function makeUniqueSlug(conn: mysql.Connection, value: string) {
  const base = slugifyAscii(value) || `igrac-${Date.now()}`;
  let slug = base;
  let suffix = 1;
  for (;;) {
    const [rows] = await conn.execute('SELECT id FROM players WHERE slug = ? LIMIT 1', [slug]);
    if ((rows as unknown[]).length === 0) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

function slugifyAscii(value: string) {
  return norm(value).replace(/\s+/g, '-');
}

function buildPlayerIndex(players: Array<{ id: number; display_name: string; nickname: string | null; slug: string }>) {
  const index = new Map<string, number>();

  for (const player of players) {
    addIndex(index, player.display_name, player.id);
    addIndex(index, player.nickname, player.id);
    addIndex(index, player.slug, player.id);
  }

  const bySlug = new Map(players.map((player) => [player.slug, player.id]));
  for (const [slug, aliases] of Object.entries(aliasesBySlug)) {
    const id = bySlug.get(slug);
    if (!id) continue;
    for (const alias of aliases) addIndex(index, alias, id);
  }

  return index;
}

function addIndex(index: Map<string, number>, value: string | null | undefined, playerId: number) {
  const key = norm(value);
  if (key) index.set(key, playerId);
}

function parseNumber(value: string | undefined): number | null {
  if (value == null) return null;
  const cleaned = value.trim().replace(',', '.');
  if (!cleaned || cleaned === '-' || cleaned === '/') return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function norm(value: unknown): string {
  return fixMojibake(String(value ?? ''))
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function fixMojibake(value: string): string {
  if (!/[ÅÄÆÃÂ€]/.test(value)) return value;
  try {
    return Buffer.from(value, 'latin1').toString('utf8');
  } catch {
    return value;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

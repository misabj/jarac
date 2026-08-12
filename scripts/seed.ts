import 'dotenv/config';
import mysql from 'mysql2/promise';
import slugify from 'slugify';

function makeSlug(name: string): string {
  return slugify(name, { lower: true, strict: true, locale: 'sr' });
}

// 2025/26 = prošla sezona (izveštaj iz Excela)
// 2026/27 = aktivna (još nema utakmica)
const PAST_SEASON = { name: 'Jarac 2025/26', starts_at: '2025-09-01', ends_at: '2026-06-30' };
const ACTIVE_SEASON = { name: 'Jarac 2026/27', starts_at: '2026-09-01', ends_at: '2027-06-30' };

// Osnovni roster — prava statistika ulazi iz Excela kroz `npm run import:stats:xlsx`.
const PLAYERS = [
  { first: 'Miloš',    last: 'Nikolić' },
  { first: 'Nemanja',  last: 'Savić' },
  { first: 'Stefan',   last: 'Đorđević' },
  { first: 'Ognjen',   last: 'Grkinić' },
  { first: 'Nedim',    last: 'Hadžibulić' },
  { first: 'Ivan',     last: 'Diligenski' },
  { first: 'Marko',    last: 'Igrutinović' },
  { first: 'Zoran',    last: 'Milošević' },
  { first: 'Zoran',    last: 'Panić' },
  { first: 'Momir',    last: 'Korunović' },
  { first: 'Slobodan', last: 'Banković' },
];

async function upsertSeason(
  conn: mysql.Connection,
  s: { name: string; starts_at: string; ends_at: string },
  active: 0 | 1
): Promise<number> {
  await conn.execute(
    `INSERT INTO seasons (name, starts_at, ends_at, is_active)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       starts_at = VALUES(starts_at),
       ends_at = VALUES(ends_at),
       is_active = VALUES(is_active)`,
    [s.name, s.starts_at, s.ends_at, active]
  );
  const [rows] = await conn.execute('SELECT id FROM seasons WHERE name = ?', [s.name]);
  return (rows as { id: number }[])[0].id;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jarac',
    charset: 'utf8mb4_unicode_ci',
  });

  console.log('▶ Seed: deaktiviram postojeće sezone…');
  await conn.execute('UPDATE seasons SET is_active = 0');

  console.log('▶ Seed: prošla sezona (2025/26)…');
  const pastId = await upsertSeason(conn, PAST_SEASON, 0);
  console.log(`✓ ${PAST_SEASON.name} → id=${pastId}`);

  console.log('▶ Seed: aktivna sezona (2026/27)…');
  const activeId = await upsertSeason(conn, ACTIVE_SEASON, 1);
  console.log(`✓ ${ACTIVE_SEASON.name} → id=${activeId}`);

  console.log('▶ Seed: osnovni roster (biće dopunjen iz Excela)…');
  let count = 0;
  for (const p of PLAYERS) {
    const display = `${p.last} ${p.first}`;
    const slug = makeSlug(display);
    await conn.execute(
      `INSERT INTO players (first_name, last_name, display_name, slug, is_active)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         first_name = VALUES(first_name),
         last_name = VALUES(last_name),
         display_name = VALUES(display_name)`,
      [p.first, p.last, display, slug]
    );
    count++;
  }
  console.log(`✓ Igrača u rosteru: ${count}`);

  console.log('\n▶ Sledeći koraci:');
  console.log('   1. Stavi Excel u ./data/Jarac 2025-26 - statistika.xlsx');
  console.log('   2. Pokreni:');
  console.log('      npm run import:stats:xlsx -- "./data/Jarac 2025-26 - statistika.xlsx" "Jarac 2025/26"');
  console.log('\n▶ Gotovo.');
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

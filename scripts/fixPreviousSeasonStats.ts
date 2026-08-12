/**
 * Razmenjuje statistiku između Savić Nemanja i Hadžibulić Nedim za
 * sezonu "Jarac 2025/26", tako da Nedim postaje #1 u asistencijama i bodovima
 * (MVP), a Savić zadržava 95 golova ali sa Nedimovim brojem asistencija/bodova.
 *
 * Konkretno se razmenjuju kolone: assists, assists_per_match,
 * goals_plus_assists, goals_plus_assists_per_match, wins, draws, losses,
 * points, points_per_match, previous_season_average, points_average_diff.
 *
 * Golovi i autogolovi se NE diraju (Savić 95G ostaje, Nedim 2AG ostaje).
 *
 * Pokreni:  npm run fix:prev-season
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';

const SEASON = 'Jarac 2025/26';
const PLAYER_A = 'Savić Nemanja';
const PLAYER_B = 'Hadžibulić Nedim';

const SWAP_COLUMNS = [
  'matches_played',
  'assists',
  'assists_per_match',
  'goals_plus_assists',
  'goals_plus_assists_per_match',
  'wins',
  'draws',
  'losses',
  'points',
  'points_per_match',
  'previous_season_average',
  'points_average_diff',
];

async function main() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jarac',
    charset: 'utf8mb4_unicode_ci',
  });

  const [seasonRows] = await c.query<mysql.RowDataPacket[]>(
    'SELECT id FROM seasons WHERE name = ?',
    [SEASON]
  );
  if (!seasonRows.length) throw new Error(`Sezona "${SEASON}" ne postoji`);
  const seasonId = (seasonRows[0] as { id: number }).id;

  async function statsFor(name: string) {
    const [rows] = await c.query<mysql.RowDataPacket[]>(
      `SELECT h.* FROM historical_player_stats h
       JOIN players p ON p.id = h.player_id
       WHERE p.display_name = ? AND h.season_id = ?`,
      [name, seasonId]
    );
    if (!rows.length) throw new Error(`Nema statistike za "${name}" u sezoni ${SEASON}`);
    return rows[0];
  }

  const a = await statsFor(PLAYER_A);
  const b = await statsFor(PLAYER_B);

  console.log(`Pre razmene:`);
  console.log(
    `  ${PLAYER_A.padEnd(22)} G=${a.goals} A=${a.assists} BOD=${a.points} UTK=${a.matches_played}`
  );
  console.log(
    `  ${PLAYER_B.padEnd(22)} G=${b.goals} A=${b.assists} BOD=${b.points} UTK=${b.matches_played}`
  );

  // Sastavi SET klauzule za razmenu
  const setA = SWAP_COLUMNS.map((col) => `${col} = ?`).join(', ');
  const valuesForA = SWAP_COLUMNS.map((col) => b[col]);
  const valuesForB = SWAP_COLUMNS.map((col) => a[col]);

  await c.execute(
    `UPDATE historical_player_stats SET ${setA} WHERE id = ?`,
    [...valuesForA, a.id]
  );
  await c.execute(
    `UPDATE historical_player_stats SET ${setA} WHERE id = ?`,
    [...valuesForB, b.id]
  );

  // Re-učitaj i prikaži
  const aAfter = await statsFor(PLAYER_A);
  const bAfter = await statsFor(PLAYER_B);
  console.log(`\nPosle razmene:`);
  console.log(
    `  ${PLAYER_A.padEnd(22)} G=${aAfter.goals} A=${aAfter.assists} BOD=${aAfter.points} UTK=${aAfter.matches_played}`
  );
  console.log(
    `  ${PLAYER_B.padEnd(22)} G=${bAfter.goals} A=${bAfter.assists} BOD=${bAfter.points} UTK=${bAfter.matches_played}`
  );

  await c.end();
  console.log('\n✓ Razmena uspešna.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

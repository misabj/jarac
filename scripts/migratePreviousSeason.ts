/**
 * Normalizuje istorijsku statistiku (XLSX uvoz) u sezonu "Jarac 2025/26"
 * i seeduje nagrade za prethodnu regularnu sezonu.
 *
 * Razlog: import:stats:xlsx je inicijalno upisao XLSX podatke pod imenom
 * pogrešne sezone (Jarac 2024/25), ali ti podaci su zapravo finalni izveštaj
 * iz prethodne regularne sezone (2025/26). Ova skripta drži podatke na tačnoj
 * sezoni i upisuje nagrade za najbolje igrače prethodne regularne sezone.
 *
 * Idempotentna: bezbedno je pokrenuti više puta.
 *
 * Pokreni:  npm run migrate:prev-season
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';

const CURRENT_SEASON = 'Jarac 2025/26';
const PREV_SEASON = 'Jarac 2025/26';
const PREV_SEASON_START = '2025-09-01';
const PREV_SEASON_END = '2026-06-30';

async function main() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jarac',
    charset: 'utf8mb4_unicode_ci',
    multipleStatements: true,
  });

  // 1) Pronađi ID trenutne sezone
  const [curRows] = await c.query<mysql.RowDataPacket[]>(
    'SELECT id FROM seasons WHERE name = ?',
    [CURRENT_SEASON]
  );
  if (!curRows.length) {
    console.error(`Sezona "${CURRENT_SEASON}" ne postoji.`);
    process.exit(1);
  }
  const curId = (curRows[0] as { id: number }).id;
  console.log(`▶ Trenutna sezona id=${curId} (${CURRENT_SEASON})`);

  // 2) Kreiraj prošlu sezonu ako ne postoji
  await c.execute(
    `INSERT INTO seasons (name, starts_at, ends_at, is_active)
     VALUES (?, ?, ?, 0)
     ON DUPLICATE KEY UPDATE
       starts_at = VALUES(starts_at),
       ends_at = VALUES(ends_at)`,
    [PREV_SEASON, PREV_SEASON_START, PREV_SEASON_END]
  );
  const [prevRows] = await c.query<mysql.RowDataPacket[]>(
    'SELECT id FROM seasons WHERE name = ?',
    [PREV_SEASON]
  );
  const prevId = (prevRows[0] as { id: number }).id;
  console.log(`▶ Prošla sezona id=${prevId} (${PREV_SEASON})`);

  // 3) Premesti historical_player_stats sa current → prev (samo ako još nisu tamo)
  const [movedRows] = await c.execute(
    `UPDATE historical_player_stats
     SET season_id = ?
     WHERE season_id = ?`,
    [prevId, curId]
  );
  const moved = (movedRows as mysql.ResultSetHeader).affectedRows;
  console.log(`▶ Premešteno ${moved} redova historical_player_stats → ${PREV_SEASON}`);

  // 4) Proširi awards.type enum da podrži 'top_own_goals'
  //    MySQL ENUM se proširuje pomoću ALTER TABLE
  console.log(`▶ Proširujem awards.type enum...`);
  await c.query(`
    ALTER TABLE awards
    MODIFY COLUMN type ENUM(
      'match_mvp',
      'season_mvp',
      'top_scorer',
      'top_assistant',
      'top_own_goals',
      'fair_play',
      'special'
    ) NOT NULL
  `);

  // 5) Seeduj nagrade za prošlu sezonu
  //    - Najbolji strelac: Savić Nemanja (95 golova)
  //    - MVP: Hadžibulić Nedim
  //    - Najbolji asistent: Hadžibulić Nedim
  //    - Najviše autogolova: Hadžibulić Nedim
  async function getPlayerId(displayName: string): Promise<number> {
    const [rows] = await c.query<mysql.RowDataPacket[]>(
      'SELECT id FROM players WHERE display_name = ? LIMIT 1',
      [displayName]
    );
    if (!rows.length) throw new Error(`Igrač "${displayName}" ne postoji`);
    return (rows[0] as { id: number }).id;
  }

  const savicId = await getPlayerId('Savić Nemanja');
  const nedimId = await getPlayerId('Hadžibulić Nedim');

  // Obriši postojeće nagrade za prošlu sezonu (da skripta bude idempotentna)
  await c.execute('DELETE FROM awards WHERE season_id = ?', [prevId]);

  const seedAwards: Array<{
    player_id: number;
    type: string;
    title: string;
    description: string;
  }> = [
    {
      player_id: savicId,
      type: 'top_scorer',
      title: 'Najbolji strelac sezone',
      description: '95 golova u sezoni 2025/26 — najveći broj golova u sezoni.',
    },
    {
      player_id: nedimId,
      type: 'season_mvp',
      title: 'MVP sezone',
      description: 'Najvredniji igrač sezone 2025/26.',
    },
    {
      player_id: nedimId,
      type: 'top_assistant',
      title: 'Najbolji asistent sezone',
      description: 'Najviše asistencija u sezoni 2025/26.',
    },
    {
      player_id: nedimId,
      type: 'top_own_goals',
      title: 'Najviše autogolova',
      description: 'Najviše autogolova u sezoni 2025/26.',
    },
  ];

  for (const a of seedAwards) {
    await c.execute(
      `INSERT INTO awards (season_id, player_id, type, title, description)
       VALUES (?, ?, ?, ?, ?)`,
      [prevId, a.player_id, a.type, a.title, a.description]
    );
  }
  console.log(`▶ Upisano ${seedAwards.length} nagrada za sezonu ${PREV_SEASON}.`);

  await c.end();
  console.log('\n✓ Migracija uspešna.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

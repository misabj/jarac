import 'dotenv/config';
import mysql from 'mysql2/promise';

const POSITIONS = ['goalkeeper', 'defense_top', 'defense_bottom', 'attack_top', 'attack_bottom'] as const;

type MatchPlayerRow = {
  id: number;
  match_id: number;
  team: 'white' | 'colored';
  comment: string | null;
  lineup_position: string | null;
};

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jarac',
    charset: 'utf8mb4_unicode_ci',
  });

  const [columns] = await conn.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'match_players'
       AND COLUMN_NAME = 'lineup_position'`
  );

  if ((columns as unknown[]).length === 0) {
    await conn.execute(
      `ALTER TABLE match_players
       ADD COLUMN lineup_position VARCHAR(32) NULL AFTER comment,
       ADD KEY idx_mp_lineup (match_id, team, lineup_position)`
    );
  }

  const [rows] = await conn.execute(
    `SELECT id, match_id, team, comment, lineup_position
     FROM match_players
     ORDER BY match_id ASC, team ASC, id ASC`
  );

  const groups = new Map<string, MatchPlayerRow[]>();
  for (const row of rows as MatchPlayerRow[]) {
    if (row.lineup_position) continue;
    const key = `${row.match_id}:${row.team}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  for (const group of groups.values()) {
    let slot = 0;
    for (const row of group) {
      const isReserve = (row.comment ?? '').toLowerCase().includes('reserve');
      const position = isReserve ? 'reserve' : POSITIONS[slot] ?? 'reserve';
      if (!isReserve) slot += 1;
      await conn.execute('UPDATE match_players SET lineup_position = ? WHERE id = ?', [position, row.id]);
    }
  }

  await conn.end();
  console.log('Lineup positions migrated.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

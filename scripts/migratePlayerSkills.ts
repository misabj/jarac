import 'dotenv/config';
import mysql from 'mysql2/promise';

const columns: Array<{ name: string; definition: string }> = [
  { name: 'skill_running', definition: 'SMALLINT NULL' },
  { name: 'skill_shooting', definition: 'SMALLINT NULL' },
  { name: 'skill_defense', definition: 'SMALLINT NULL' },
  { name: 'skill_efficiency', definition: 'SMALLINT NULL' },
  { name: 'skill_goalkeeper', definition: 'SMALLINT NULL' },
  { name: 'skill_dribbling', definition: 'SMALLINT NULL' },
  { name: 'skill_substitution', definition: 'SMALLINT NULL' },
  { name: 'skill_passing', definition: 'SMALLINT NULL' },
  { name: 'skill_control', definition: 'SMALLINT NULL' },
  { name: 'skill_explosiveness', definition: 'SMALLINT NULL' },
  { name: 'skill_stamina', definition: 'SMALLINT NULL' },
  { name: 'skill_total', definition: 'SMALLINT NOT NULL DEFAULT 0' },
];

async function main() {
  const database = process.env.DB_NAME || 'jarac';
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database,
    charset: 'utf8mb4_unicode_ci',
  });

  for (const column of columns) {
    const [rows] = await conn.execute(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'players' AND COLUMN_NAME = ?
       LIMIT 1`,
      [database, column.name]
    );

    if ((rows as unknown[]).length > 0) {
      console.log(`- ${column.name} vec postoji`);
      continue;
    }

    await conn.execute(`ALTER TABLE players ADD COLUMN ${column.name} ${column.definition}`);
    console.log(`+ dodata kolona ${column.name}`);
  }

  await conn.execute(`
    UPDATE players
    SET skill_total =
      COALESCE(skill_running, 0) +
      COALESCE(skill_shooting, 0) +
      COALESCE(skill_defense, 0) +
      COALESCE(skill_efficiency, 0) +
      COALESCE(skill_goalkeeper, 0) +
      COALESCE(skill_dribbling, 0) +
      COALESCE(skill_substitution, 0) +
      COALESCE(skill_passing, 0) +
      COALESCE(skill_control, 0)
  `);

  console.log('✓ Player skill migracija je zavrsena.');
  await conn.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

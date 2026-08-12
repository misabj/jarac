import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'jarac',
  });

  const targetName = process.argv[2] ?? 'Jarac 2025/26';

  await db.query('UPDATE seasons SET is_active = 0');
  const [r] = await db.query<any>(
    'UPDATE seasons SET is_active = 1 WHERE name = ?',
    [targetName],
  );
  console.log(`Aktivna sezona: "${targetName}" (rows affected: ${r.affectedRows})`);

  const [rows] = await db.query<any[]>('SELECT id, name, is_active FROM seasons');
  console.table(rows);

  await db.end();
}

main().catch((e) => { console.error(e); process.exit(1); });

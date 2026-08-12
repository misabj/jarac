import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jarac',
    multipleStatements: true,
    charset: 'utf8mb4_unicode_ci',
  });

  const sql = await fs.readFile(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');
  console.log('▶ Primenjujem db/schema.sql…');
  await conn.query(sql);
  console.log('✓ Šema primenjena.');
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

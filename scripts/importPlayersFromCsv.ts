/**
 * Uvozi listu igrača iz CSV fajla.
 *
 * Očekivane kolone (header u prvom redu):
 *   ime, prezime, nadimak, pozicija
 * ili:
 *   display_name, nickname, position
 *
 * Pokreni:
 *   npm run import:players -- ./data/players.csv
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import mysql from 'mysql2/promise';
import slugify from 'slugify';

const file = process.argv[2];
if (!file) {
  console.error('Upotreba: npm run import:players -- <putanja-do-csv>');
  process.exit(1);
}

interface Row {
  [k: string]: string;
}

function pick(row: Row, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k] ?? row[k.toLowerCase()] ?? row[k.toUpperCase()];
    if (v && String(v).trim()) return String(v).trim();
  }
  return '';
}

async function main() {
  const raw = fs.readFileSync(path.resolve(file), 'utf8');
  const rows: Row[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jarac',
    charset: 'utf8mb4_unicode_ci',
  });

  let added = 0;
  for (const row of rows) {
    let first = pick(row, 'ime', 'first_name', 'First Name');
    let last = pick(row, 'prezime', 'last_name', 'Last Name');
    let display = pick(row, 'display_name', 'Igrač', 'igrac', 'Igrac', 'ime_prezime');

    if (!display && (first || last)) display = `${last} ${first}`.trim();
    if (!first && !last && display) {
      const parts = display.split(/\s+/);
      last = parts[0] ?? '';
      first = parts.slice(1).join(' ');
    }
    if (!display) continue;

    const nickname = pick(row, 'nadimak', 'nickname') || null;
    const position = pick(row, 'pozicija', 'position') || null;
    const slug = slugify(display, { lower: true, strict: true, locale: 'sr' });

    await conn.execute(
      `INSERT INTO players (first_name, last_name, display_name, nickname, slug, position, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         first_name = VALUES(first_name),
         last_name = VALUES(last_name),
         display_name = VALUES(display_name),
         nickname = VALUES(nickname),
         position = VALUES(position)`,
      [first, last, display, nickname, slug, position]
    );
    added++;
    console.log(`  ✓ ${display}`);
  }

  console.log(`Uvezeno / ažurirano: ${added}`);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

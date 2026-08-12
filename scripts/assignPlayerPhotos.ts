/**
 * Povezuje slike iz public/images/players sa igračima u bazi.
 *
 * Očekivani format imena fajlova:  ime_prezime.ext   (npr. milos_nikolic.jpeg)
 * Diakritike i velika/mala slova se ignorišu.
 *
 * Pokreni:
 *   node --import tsx/esm scripts/assignPlayerPhotos.ts
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

const DIR_REL = 'public/images/players';
const URL_PREFIX = '/images/players/';
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

function strip(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/dj/g, 'd') // srpski digraf "dj" = "đ"
    .replace(/[^a-z0-9]+/g, '');
}

type Row = { id: number; first_name: string; last_name: string; display_name: string };

async function main() {
  const absDir = path.resolve(process.cwd(), DIR_REL);
  if (!fs.existsSync(absDir)) {
    console.error(`Nema foldera: ${absDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(absDir)
    .filter((f) => ALLOWED_EXT.has(path.extname(f).toLowerCase()));

  if (files.length === 0) {
    console.log('Nema slika u folderu.');
    return;
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jarac',
    charset: 'utf8mb4_unicode_ci',
  });

  const [players] = await conn.query<(Row & mysql.RowDataPacket)[]>(
    'SELECT id, first_name, last_name, display_name FROM players'
  );

  // Indeks po "imeprezime" i "prezimeime" radi tolerantnijeg poklapanja.
  const idx = new Map<string, Row>();
  for (const p of players) {
    const a = strip(`${p.first_name}${p.last_name}`);
    const b = strip(`${p.last_name}${p.first_name}`);
    idx.set(a, p);
    idx.set(b, p);
  }

  let updated = 0;
  let skipped = 0;
  const unmatched: string[] = [];

  for (const file of files) {
    const base = path.basename(file, path.extname(file));
    const key = strip(base);
    const player = idx.get(key);
    if (!player) {
      unmatched.push(file);
      skipped++;
      continue;
    }
    const url = URL_PREFIX + file;
    await conn.execute('UPDATE players SET photo_url = ? WHERE id = ?', [url, player.id]);
    console.log(`✓ ${player.display_name.padEnd(28)} → ${url}`);
    updated++;
  }

  console.log(`\n▶ Ažurirano: ${updated}, preskočeno: ${skipped}`);
  if (unmatched.length) {
    console.log('\nNepoklopljene slike:');
    for (const f of unmatched) console.log(`  - ${f}`);
  }

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

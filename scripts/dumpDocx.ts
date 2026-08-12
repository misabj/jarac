/**
 * Brzi dump .docx fajla u plain text (za pregled strukture).
 *
 * Pokretanje:
 *   npm run dump:docx -- "./data/Jarac 2025-26.docx"
 *
 * Snimi i `./data/_dump.txt` pored fajla radi lakšeg pregleda.
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mammoth from 'mammoth';

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Upotreba: npm run dump:docx -- <putanja-do-docx>');
    process.exit(1);
  }
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error(`Fajl ne postoji: ${abs}`);
    process.exit(1);
  }

  const result = await mammoth.extractRawText({ path: abs });
  const text = result.value;

  const out = path.join(path.dirname(abs), '_dump.txt');
  fs.writeFileSync(out, text, 'utf8');

  console.log(`Sačuvano ${text.length} karaktera u: ${out}`);
  console.log('--- PRVIH 6000 KARAKTERA ---');
  console.log(text.slice(0, 6000));
  console.log('--- KRAJ PREGLEDA ---');
  if (result.messages?.length) {
    console.log('Mammoth poruke:', result.messages);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

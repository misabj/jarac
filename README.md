# Jarac Liga

Moderna sportska web aplikacija za vođenje statistike fudbalskog termina **„Jarac"** — sreda 18:00 u KSC Jarac.

Aplikacija nije liga sa stalnim klubovima. Timovi se za svaku utakmicu dele na **Beli** i **Šareni**, ali statistika (golovi, asistencije, bodovi, MVP) se vodi **po igraču kroz čitavu sezonu**.

## Tech stack

- **Next.js 15** (App Router, Server Actions)
- **TypeScript**, **Tailwind CSS** (sopstveni dark sports theme)
- **MySQL** + **mysql2/promise** (pool, bez Prisme – radi i na cPanel/DreamWeb)
- Tamna, mobile-first dashboard tema (kartice, sticky tabele, gradienti)

## Struktura

```
app/                Next.js stranice (App Router)
  page.tsx          Home (hero, statistika, poslednja utakmica)
  players/          Lista i profil igrača
  standings/        Tabela i sve rang liste
  matches/          Lista i detalji utakmice
  admin/            Admin panel (login, igrači, utakmice, sastavi)
components/         UI komponente (PlayerCard, StatCard, MatchCard...)
lib/                db.ts, queries.ts, auth.ts, format.ts, types.ts
db/schema.sql       Kompletna MySQL šema
scripts/            seed, importPlayersFromCsv, importHistoricalStatsFromCsv, applySchema
public/images/players/   Folder za slike igrača (lokalne, ne URL)
```

## 1. Lokalno pokretanje

```bash
# 1) Instaliraj zavisnosti
npm install

# 2) Napravi .env (iskopiraj iz .env.example)
copy .env.example .env

# 3) Otvori .env i podesi DB_PASSWORD i ADMIN_PASSWORD
```

`.env`:

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=jarac

ADMIN_PASSWORD=neka_jaka_sifra
```

### Importuj šemu

Pretpostavka: baza `jarac` već postoji (`CREATE DATABASE jarac CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`).

```bash
# Varijanta A: kroz npm skriptu (čita .env)
npm run db:schema

# Varijanta B: direktno kroz mysql klijent
mysql -u root -p jarac < db/schema.sql
```

### Seed (osnovni roster + sezone 2025/26 i 2026/27)

```bash
npm run db:seed
```

Ovo kreira:
- **`Jarac 2025/26`** — istorijska sezona (`is_active = 0`), tu se uvozi izveštaj iz Excela.
- **`Jarac 2026/27`** — nova aktivna sezona (`is_active = 1`).
- Osnovni roster od ~11 igrača (skripta `importStatsFromXlsx` automatski dodaje sve ostale iz Excela).

### Uvoz statistike iz Excela (prošla sezona)

```bash
# 1) Ubaci fajl u ./data/ folder, npr:
#    data/Jarac 2025-26 - statistika.xlsx
#
# 2) Pokreni uvoz:
npm run import:stats:xlsx -- "./data/Jarac 2025-26 - statistika.xlsx" "Jarac 2025/26"
```

Skripta automatski:
- detektuje header u Excelu (čak i ako nije u prvom redu),
- kreira nedostajuće igrače,
- popunjava `historical_player_stats` tabelu sa svim kolonama
  (Utakmice, Golovi, Asistencije, Pobede, Bodovi, Razlika u proseku itd.).

Prikaz: dok aktivna sezona nema utakmica, **Početna**, **Tabela** i **Igrači** stranice
automatski padaju na izveštaj prošle sezone (sa svim Excel kolonama).

### Razvojni server

```bash
npm run dev
# → http://localhost:3000
```

## 2. Admin panel

- Otvori `/admin`
- Lozinka = `ADMIN_PASSWORD` iz `.env`
- Tu možeš:
  - dodavati/menjati/brisati igrače
  - kreirati utakmicu
  - dodavati igrače u **Beli** ili **Šareni** tim
  - upisivati golove, asistencije, autogolove, ocenu i MVP
  - pisati izveštaj i reportera
  - obeležiti da li utakmica ulazi u statistiku

## 3. Slike igrača

Sve slike idu **lokalno** u `public/images/players/`:

```
public/images/players/nikolic-milos.jpg
public/images/players/savic-nemanja.jpg
```

U admin formi igrača u polje **Foto URL** se upiše:

```
/images/players/nikolic-milos.jpg
```

Ako slika ne postoji, automatski se prikazuje avatar sa inicijalima i boja generisana iz imena.

## 4. Uvoz iz Excel-a (istorijska statistika)

Iz Excel-a snimi sheet kao **CSV UTF-8**. Očekivani header (srpski):

```
Igrač, Utakmice, Golovi, Golovi po utakmici, Asistencije, Asistencije po utakmici,
Asistencije+golovi, Asistencije+ golovi po utakmici, Pobede, Nerešeno, Porazi,
Bodovi, Bodovi po utakmici, Autogolovi, Prosek prošle sezone,
Bodovna razlika u odnosu na prošlu sezonu, Prosek golova prošle sezone,
Razlika u proseku golova u odnosu na prošlu sezonu, Utakmice bez upisane statistike
```

Pokretanje:

```bash
# Uvoz liste igrača (header: ime, prezime, nadimak, pozicija — ili display_name)
npm run import:players -- ./data/players.csv

# Uvoz agregirane statistike za sezonu
npm run import:stats -- ./data/stats-2024-25.csv "Jarac 2024/25"
```

Skripta sama kreira/aktivira sezonu i upiše red u `historical_player_stats`.

## 5. Pravila računanja

- Pobeda = **3 boda**, nerešeno = **1 bod**, poraz = **0**.
- Tim pobednika određuje se po `result_type` (`white_win`, `colored_win`, `draw`).
- Statistika se računa **samo iz utakmica gde `matches.is_counted = 1`**.
- `G+A`, `G/UTK`, `A/UTK`, `Bod/UTK` se računaju iz baze pri svakom pozivu (`getLeaderboard`).
- `MVP score = wins · 5.0 + draws · 2.0 + goals · 1.5 + assists · 1.0 + match_mvp · 3.0 + presence · 0.5 − losses · 2.0`. Kompozit (NBA-stil): timski uspeh (pobede) je najjači faktor, gol vredi više od asistencije, porazi su jedini negativni faktor. Svaki parametar ulazi tačno jednom (bez dvostrukog brojanja). Može se ručno overridovati kroz `awards`.

## 6. Deploy na cPanel / DreamWeb (Node.js Setup)

Aplikacija je konfigurisana sa `output: 'standalone'` u `next.config.mjs`, što znatno olakšava upload.

### Korak 1 – build lokalno

```bash
npm install
npm run build
```

Posle builda imaš:

```
.next/standalone/    # samostalan server + minimalni node_modules
.next/static/        # statički build assets
public/              # tvoji javni assets (slike)
```

### Korak 2 – upload na server

Iskopiraj na cPanel u folder aplikacije (npr. `~/apps/jarac/`):

```
.next/standalone/   →  ~/apps/jarac/
public/             →  ~/apps/jarac/public/
.next/static/       →  ~/apps/jarac/.next/static/
server.js           →  ~/apps/jarac/server.js
package.json        →  ~/apps/jarac/package.json   (opciono)
```

Drugim rečima — **sav sadržaj** iz `.next/standalone/` ide direktno u root foldera aplikacije na serveru, a `public/` i `.next/static/` se dodaju pored.

### Korak 3 – cPanel Node.js Setup

1. _Setup Node.js App_ → **Create Application**
2. **Node.js version**: 20.x (ili 22.x)
3. **Application mode**: `production`
4. **Application root**: `apps/jarac`
5. **Application URL**: tvoj domen ili subdomen
6. **Application startup file**: `server.js`
7. Klikni **Create**, pa **Run NPM Install** (instaliraće zavisnosti iz priložene `package.json`)
8. U sekciji **Environment variables** unesi:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=jarac_user
DB_PASSWORD=...
DB_NAME=jarac
ADMIN_PASSWORD=...
NODE_ENV=production
```

9. Klikni **Restart**

### Korak 4 – importuj šemu na server

Kroz **phpMyAdmin** (Import → izaberi `db/schema.sql`) ili kroz cPanel terminal:

```bash
mysql -u jarac_user -p jarac < db/schema.sql
```

Zatim opciono pokreni:

```bash
npm run db:seed
```

> Napomena: `server.js` (uključen u repo) je tanak wrapper koji startuje `./.next/standalone/server.js`. Ako tvoj cPanel iz nekog razloga ne radi sa wrapperom, kao **startup file** koristi direktno `.next/standalone/server.js`.

## 7. npm skripte

| Komanda | Šta radi |
|---|---|
| `npm run dev` | Razvojni server na 3000 |
| `npm run build` | Production build (standalone) |
| `npm run start` | Pokreće Next production server |
| `npm run db:schema` | Primenjuje `db/schema.sql` na bazu |
| `npm run db:seed` | Učitava demo igrače i FUDBAL BR. 1 |
| `npm run import:players -- ./data/players.csv` | Uvoz igrača iz CSV-a |
| `npm run import:stats -- ./data/stats.csv "Jarac 2024/25"` | Uvoz istorijske statistike |

## 8. Bezbednost

- Admin auth je namerno jednostavan (lozinka iz `.env`, httpOnly cookie). Za jači setup zamenu radi sa NextAuth / Auth.js.
- U produkciji koristi posebnog MySQL korisnika sa minimalnim privilegijama na bazi `jarac`.
- Backup baze radi periodično iz cPanel-a.

## 9. Dalja proširenja (kasnije)

- Awards stranica i tracker po sezonama
- Više sezona istovremeno + arhive
- Grafici (recharts) za napredak po utakmicama
- PDF / Excel export tabele
- Push obaveštenja za podsetnik srede 18h

---

Made with ❤️ za društvo iz KSC Jarac.

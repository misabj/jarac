# Standalone wrapper za cPanel / DreamWeb hosting
// Postavi ovaj fajl kao "Application startup file" u cPanel Node.js Setup-u.
// Pretpostavlja da je projekat builan sa `npm run build` (uz `output: 'standalone'` u next.config.mjs)
// i da se sadržaj `.next/standalone/` raspakuje pored ovog fajla, a `.next/static/` u `.next/static/`.

process.env.PORT = process.env.PORT || '3000';
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

require('./.next/standalone/server.js');

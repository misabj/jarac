-- Ispravka pogresno vezane prethodne sezone.
-- Uvozni istorijski podaci i nagrade pripadaju sezoni Jarac 2025/26,
-- ne neodigranoj sezoni Jarac 2024/25.

UPDATE historical_player_stats
SET season_id = (SELECT id FROM seasons WHERE name = 'Jarac 2025/26' LIMIT 1)
WHERE season_id = (SELECT id FROM seasons WHERE name = 'Jarac 2024/25' LIMIT 1);

UPDATE awards
SET season_id = (SELECT id FROM seasons WHERE name = 'Jarac 2025/26' LIMIT 1)
WHERE season_id = (SELECT id FROM seasons WHERE name = 'Jarac 2024/25' LIMIT 1);

DELETE FROM seasons
WHERE name = 'Jarac 2024/25'
  AND NOT EXISTS (SELECT 1 FROM matches WHERE matches.season_id = seasons.id)
  AND NOT EXISTS (SELECT 1 FROM historical_player_stats WHERE historical_player_stats.season_id = seasons.id)
  AND NOT EXISTS (SELECT 1 FROM awards WHERE awards.season_id = seasons.id);

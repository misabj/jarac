-- Letnja razvojna liga
-- Mini-sezona do početka naredne regularne sezone (01.09.2026).

INSERT INTO seasons (name, starts_at, ends_at, is_active)
VALUES ('Letnja razvojna liga', '2026-05-28', '2026-08-31', 1)
ON DUPLICATE KEY UPDATE
  starts_at = VALUES(starts_at),
  ends_at = VALUES(ends_at),
  is_active = 1;

UPDATE seasons
SET is_active = CASE WHEN name = 'Letnja razvojna liga' THEN 1 ELSE 0 END;

UPDATE matches
SET
  season_id = (SELECT id FROM seasons WHERE name = 'Letnja razvojna liga' LIMIT 1),
  is_counted = 1
WHERE id IN (278, 279);

UPDATE matches SET match_number = '1' WHERE id = 278;
UPDATE matches SET match_number = '2' WHERE id = 279;

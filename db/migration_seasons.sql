-- =====================================================
-- Migracija: restruktura sezona
-- 2025/26  -> istorijska (is_active = 0)
-- 2026/27  -> aktivna (is_active = 1)
-- =====================================================

-- deaktiviraj sve postoje\u0107e sezone
UPDATE seasons SET is_active = 0;

-- 2025/26 = pro\u0161la sezona (izve\u0161taj iz Excela)
INSERT INTO seasons (name, starts_at, ends_at, is_active)
VALUES ('Jarac 2025/26', '2025-09-01', '2026-06-30', 0)
ON DUPLICATE KEY UPDATE
  starts_at = VALUES(starts_at),
  ends_at   = VALUES(ends_at),
  is_active = 0;

-- 2026/27 = nova aktivna sezona
INSERT INTO seasons (name, starts_at, ends_at, is_active)
VALUES ('Jarac 2026/27', '2026-09-01', '2027-06-30', 1)
ON DUPLICATE KEY UPDATE
  starts_at = VALUES(starts_at),
  ends_at   = VALUES(ends_at),
  is_active = 1;

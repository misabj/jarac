-- =====================================================
-- Migracija: kasa za pivo (beer_donations)
-- Transparentna evidencija ko je i koliko "častio ekipu pivo".
-- Pokreni jednom na postojećoj bazi (lokalno i na produkciji).
-- Kroz phpMyAdmin (Import) ili:
--   mysql -u USER -p jarac < db/migration_beer_donations.sql
-- =====================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `beer_donations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `donor_name` VARCHAR(120) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `message` VARCHAR(255) NULL,
  `donated_at` DATE NOT NULL,
  `is_public` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_beer_donated` (`donated_at`),
  KEY `idx_beer_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

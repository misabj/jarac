-- =====================================================
-- Migracija: galerija slika (gallery_images)
-- Pokreni jednom na postojećoj bazi (lokalno i na produkciji).
-- Kroz phpMyAdmin (Import) ili:
--   mysql -u USER -p jarac < db/migration_gallery.sql
-- =====================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `gallery_images` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `image_url` VARCHAR(255) NOT NULL,
  `title` VARCHAR(200) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_gallery_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

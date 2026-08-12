-- =====================================================
-- Jarac Liga - SQL šema
-- MySQL 5.7+ / MariaDB 10.3+
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- seasons
-- -----------------------------------------------------
DROP TABLE IF EXISTS `seasons`;
CREATE TABLE `seasons` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `starts_at` DATE NULL,
  `ends_at` DATE NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_seasons_name` (`name`),
  KEY `idx_seasons_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- players
-- -----------------------------------------------------
DROP TABLE IF EXISTS `players`;
CREATE TABLE `players` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(80) NOT NULL,
  `last_name` VARCHAR(80) NOT NULL,
  `display_name` VARCHAR(160) NOT NULL,
  `nickname` VARCHAR(80) NULL,
  `slug` VARCHAR(180) NOT NULL,
  `photo_url` VARCHAR(255) NULL,
  `position` VARCHAR(40) NULL,
  `skill_running` SMALLINT NULL,
  `skill_shooting` SMALLINT NULL,
  `skill_defense` SMALLINT NULL,
  `skill_efficiency` SMALLINT NULL,
  `skill_goalkeeper` SMALLINT NULL,
  `skill_dribbling` SMALLINT NULL,
  `skill_substitution` SMALLINT NULL,
  `skill_passing` SMALLINT NULL,
  `skill_control` SMALLINT NULL,
  `skill_explosiveness` SMALLINT NULL,
  `skill_stamina` SMALLINT NULL,
  `skill_total` SMALLINT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_players_slug` (`slug`),
  KEY `idx_players_active` (`is_active`),
  KEY `idx_players_display` (`display_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- matches
-- -----------------------------------------------------
DROP TABLE IF EXISTS `matches`;
CREATE TABLE `matches` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `season_id` INT UNSIGNED NOT NULL,
  `match_number` VARCHAR(16) NOT NULL,
  `played_at` DATETIME NOT NULL,
  `venue` VARCHAR(120) NOT NULL DEFAULT 'KSC Jarac',
  `scheduled_time` VARCHAR(10) NULL,
  `selector_name` VARCHAR(120) NULL,
  `white_score` INT NOT NULL DEFAULT 0,
  `colored_score` INT NOT NULL DEFAULT 0,
  `result_type` ENUM('white_win','colored_win','draw') NOT NULL DEFAULT 'draw',
  `is_counted` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` TEXT NULL,
  `report` MEDIUMTEXT NULL,
  `reporter_name` VARCHAR(120) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_matches_season` (`season_id`),
  KEY `idx_matches_played_at` (`played_at`),
  KEY `idx_matches_counted` (`is_counted`),
  CONSTRAINT `fk_matches_season` FOREIGN KEY (`season_id`)
    REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- match_players
-- -----------------------------------------------------
DROP TABLE IF EXISTS `match_players`;
CREATE TABLE `match_players` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id` INT UNSIGNED NOT NULL,
  `player_id` INT UNSIGNED NOT NULL,
  `team` ENUM('white','colored') NOT NULL,
  `goals` INT NOT NULL DEFAULT 0,
  `assists` INT NOT NULL DEFAULT 0,
  `own_goals` INT NOT NULL DEFAULT 0,
  `rating` DECIMAL(3,1) NULL,
  `is_mvp` TINYINT(1) NOT NULL DEFAULT 0,
  `comment` TEXT NULL,
  `lineup_position` VARCHAR(32) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_match_player` (`match_id`,`player_id`),
  KEY `idx_mp_player` (`player_id`),
  KEY `idx_mp_team` (`team`),
  KEY `idx_mp_lineup` (`match_id`,`team`,`lineup_position`),
  CONSTRAINT `fk_mp_match` FOREIGN KEY (`match_id`)
    REFERENCES `matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mp_player` FOREIGN KEY (`player_id`)
    REFERENCES `players` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- awards
-- -----------------------------------------------------
DROP TABLE IF EXISTS `awards`;
CREATE TABLE `awards` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `season_id` INT UNSIGNED NOT NULL,
  `match_id` INT UNSIGNED NULL,
  `player_id` INT UNSIGNED NOT NULL,
  `type` ENUM('match_mvp','season_mvp','top_scorer','top_assistant','fair_play','special') NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_awards_season` (`season_id`),
  KEY `idx_awards_player` (`player_id`),
  KEY `idx_awards_match` (`match_id`),
  CONSTRAINT `fk_awards_season` FOREIGN KEY (`season_id`)
    REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_awards_match` FOREIGN KEY (`match_id`)
    REFERENCES `matches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_awards_player` FOREIGN KEY (`player_id`)
    REFERENCES `players` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- historical_player_stats
-- -----------------------------------------------------
DROP TABLE IF EXISTS `historical_player_stats`;
CREATE TABLE `historical_player_stats` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `season_id` INT UNSIGNED NOT NULL,
  `player_id` INT UNSIGNED NOT NULL,
  `matches_played` INT NOT NULL DEFAULT 0,
  `goals` INT NOT NULL DEFAULT 0,
  `goals_per_match` DECIMAL(6,3) NOT NULL DEFAULT 0,
  `assists` INT NOT NULL DEFAULT 0,
  `assists_per_match` DECIMAL(6,3) NOT NULL DEFAULT 0,
  `goals_plus_assists` INT NOT NULL DEFAULT 0,
  `goals_plus_assists_per_match` DECIMAL(6,3) NOT NULL DEFAULT 0,
  `wins` INT NOT NULL DEFAULT 0,
  `draws` INT NOT NULL DEFAULT 0,
  `losses` INT NOT NULL DEFAULT 0,
  `points` INT NOT NULL DEFAULT 0,
  `points_per_match` DECIMAL(6,3) NOT NULL DEFAULT 0,
  `own_goals` INT NOT NULL DEFAULT 0,
  `previous_season_average` DECIMAL(6,3) NULL,
  `points_average_diff` DECIMAL(6,3) NULL,
  `previous_season_goals_average` DECIMAL(6,3) NULL,
  `goals_average_diff` DECIMAL(6,3) NULL,
  `untracked_matches` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_hist_player_season` (`season_id`,`player_id`),
  KEY `idx_hist_season` (`season_id`),
  KEY `idx_hist_player` (`player_id`),
  CONSTRAINT `fk_hist_season` FOREIGN KEY (`season_id`)
    REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_hist_player` FOREIGN KEY (`player_id`)
    REFERENCES `players` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- gallery_images
-- -----------------------------------------------------
DROP TABLE IF EXISTS `gallery_images`;
CREATE TABLE `gallery_images` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `image_url` VARCHAR(255) NOT NULL,
  `title` VARCHAR(200) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_gallery_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- beer_donations (kasa za pivo)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `beer_donations`;
CREATE TABLE `beer_donations` (
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

SET FOREIGN_KEY_CHECKS = 1;

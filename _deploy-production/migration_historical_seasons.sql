-- Proširenje istorijske statistike za starije Excel izvještaje.
-- Starije sezone sadrže polovine pobjeda/poraza/bodova i dodatne kolone
-- o utakmicama sa poznatim odnosno nepoznatim brojem golova.

ALTER TABLE historical_player_stats
  MODIFY assists INT NULL,
  MODIFY assists_per_match DECIMAL(6,3) NULL,
  MODIFY goals_plus_assists INT NULL,
  MODIFY goals_plus_assists_per_match DECIMAL(6,3) NULL,
  MODIFY wins DECIMAL(7,2) NOT NULL DEFAULT 0,
  MODIFY draws DECIMAL(7,2) NOT NULL DEFAULT 0,
  MODIFY losses DECIMAL(7,2) NOT NULL DEFAULT 0,
  MODIFY points DECIMAL(8,2) NOT NULL DEFAULT 0,
  MODIFY untracked_matches INT NULL,
  ADD COLUMN unknown_goals_matches INT NULL AFTER untracked_matches,
  ADD COLUMN known_goals_matches INT NULL AFTER unknown_goals_matches,
  ADD COLUMN known_goals_average DECIMAL(6,3) NULL AFTER known_goals_matches;

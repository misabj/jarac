-- Popuni rezultat utakmica iz vec unetih golova/autogolova igraca.
-- Radi samo za utakmice koje imaju bar jedan gol ili autogol u match_players.

UPDATE matches m
JOIN (
  SELECT
    match_id,
    COALESCE(SUM(CASE WHEN team = 'white' THEN goals ELSE 0 END), 0) +
      COALESCE(SUM(CASE WHEN team = 'colored' THEN own_goals ELSE 0 END), 0) AS white_score,
    COALESCE(SUM(CASE WHEN team = 'colored' THEN goals ELSE 0 END), 0) +
      COALESCE(SUM(CASE WHEN team = 'white' THEN own_goals ELSE 0 END), 0) AS colored_score,
    COALESCE(SUM(goals), 0) + COALESCE(SUM(own_goals), 0) AS scoring_events
  FROM match_players
  GROUP BY match_id
) totals ON totals.match_id = m.id
SET
  m.white_score = totals.white_score,
  m.colored_score = totals.colored_score,
  m.result_type = CASE
    WHEN totals.white_score > totals.colored_score THEN 'white_win'
    WHEN totals.colored_score > totals.white_score THEN 'colored_win'
    ELSE 'draw'
  END
WHERE totals.scoring_events > 0;

export type Team = 'white' | 'colored';
export type ResultType = 'white_win' | 'colored_win' | 'draw';

export interface Season {
  id: number;
  name: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: 0 | 1;
}

export interface Player {
  id: number;
  first_name: string;
  last_name: string;
  display_name: string;
  nickname: string | null;
  slug: string;
  photo_url: string | null;
  position: string | null;
  skill_running: number | null;
  skill_shooting: number | null;
  skill_defense: number | null;
  skill_efficiency: number | null;
  skill_goalkeeper: number | null;
  skill_dribbling: number | null;
  skill_substitution: number | null;
  skill_passing: number | null;
  skill_control: number | null;
  skill_explosiveness: number | null;
  skill_stamina: number | null;
  skill_total: number;
  is_active: 0 | 1;
}

export interface Match {
  id: number;
  season_id: number;
  match_number: string;
  played_at: string;
  venue: string;
  scheduled_time: string | null;
  selector_name: string | null;
  white_score: number;
  colored_score: number;
  result_type: ResultType;
  is_counted: 0 | 1;
  notes: string | null;
  report: string | null;
  reporter_name: string | null;
}

export interface MatchPlayer {
  id: number;
  match_id: number;
  player_id: number;
  team: Team;
  goals: number;
  assists: number;
  own_goals: number;
  rating: number | null;
  is_mvp: 0 | 1;
  comment: string | null;
  lineup_position: string | null;
}

export interface GalleryImage {
  id: number;
  image_url: string;
  title: string | null;
  created_at: string;
}

export interface BeerDonation {
  id: number;
  donor_name: string;
  amount: number;
  message: string | null;
  donated_at: string;
  is_public: number;
  created_at: string;
}

export interface MatchPlayerWithPlayer extends MatchPlayer {
  display_name: string;
  nickname: string | null;
  slug: string;
  photo_url: string | null;
}

export interface PlayerSeasonStats {
  player_id: number;
  display_name: string;
  nickname: string | null;
  slug: string;
  photo_url: string | null;
  skill_total: number;
  matches_played: number;
  counted_matches: number;
  goals: number;
  assists: number;
  own_goals: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goals_per_match: number;
  assists_per_match: number;
  goals_plus_assists: number;
  goals_plus_assists_per_match: number;
  points_per_match: number;
  mvp_score: number;
}

export interface MatchWithSummary extends Match {
  player_count: number;
  winner: 'white' | 'colored' | 'draw';
}

export interface HistoricalPlayerStats {
  id: number;
  season_id: number;
  player_id: number;
  display_name: string;
  nickname: string | null;
  slug: string;
  photo_url: string | null;
  skill_total: number;
  matches_played: number;
  goals: number;
  goals_per_match: number;
  assists: number;
  assists_per_match: number;
  goals_plus_assists: number;
  goals_plus_assists_per_match: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  points_per_match: number;
  own_goals: number;
  previous_season_average: number | null;
  points_average_diff: number | null;
  previous_season_goals_average: number | null;
  goals_average_diff: number | null;
  untracked_matches: number;
}

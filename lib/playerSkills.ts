export const PLAYER_SKILL_FIELDS = [
  'skill_running',
  'skill_shooting',
  'skill_defense',
  'skill_efficiency',
  'skill_goalkeeper',
  'skill_dribbling',
  'skill_substitution',
  'skill_passing',
  'skill_control',
  'skill_stamina',
  'skill_explosiveness',
] as const;

export type PlayerSkillField = (typeof PLAYER_SKILL_FIELDS)[number];

export const PLAYER_SKILL_TOTAL_FIELDS = PLAYER_SKILL_FIELDS.slice(0, 9) as readonly PlayerSkillField[];

export const PLAYER_SKILL_LABELS: Record<PlayerSkillField, string> = {
  skill_running: 'Trčanje',
  skill_shooting: 'Šut',
  skill_defense: 'Odbrana',
  skill_efficiency: 'Efikasnost',
  skill_goalkeeper: 'Golman',
  skill_dribbling: 'Dribling',
  skill_substitution: 'Izmena',
  skill_passing: 'Pas',
  skill_control: 'Kontrola',
  skill_stamina: 'Kondicija',
  skill_explosiveness: 'Eksplozivnost',
};

export function calculateSkillTotal(values: Partial<Record<PlayerSkillField, number | null | undefined>>): number {
  return PLAYER_SKILL_TOTAL_FIELDS.reduce((total, field) => total + Number(values[field] ?? 0), 0);
}

export function hasAnyPlayerSkill(values: Partial<Record<PlayerSkillField, number | null | undefined>>): boolean {
  return PLAYER_SKILL_FIELDS.some((field) => values[field] !== null && values[field] !== undefined);
}

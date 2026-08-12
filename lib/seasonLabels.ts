import type { Season } from './types';

export function isSummerDevelopmentLeague(season: Pick<Season, 'name'> | string | null | undefined) {
  const name = typeof season === 'string' ? season : season?.name;
  return (name ?? '').toLowerCase().includes('letnja razvojna liga');
}

export function seasonCompetitionSuffix(season: Pick<Season, 'name'> | string | null | undefined) {
  return isSummerDevelopmentLeague(season) ? 'letnje lige' : 'sezone';
}

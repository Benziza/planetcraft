export type MercuryBiomeId =
  | 'mercury-plains'
  | 'mercury-crater'
  | 'mercury-caloris'
  | 'mercury-scarp'
  | 'mercury-polar';

export const mercuryPalette: Record<MercuryBiomeId, string> = {
  'mercury-plains': '#8f887c',
  'mercury-crater': '#625e58',
  'mercury-caloris': '#b0a18d',
  'mercury-scarp': '#4e4b47',
  'mercury-polar': '#d8d4c9',
};

const radians = Math.PI / 180;
const craters = [
  [-32, -45, 15],
  [8, 62, 10],
  [-18, 112, 12],
  [48, -92, 9],
] as const;

function distance(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number,
) {
  const dot =
    Math.sin(lat * radians) * Math.sin(centerLat * radians) +
    Math.cos(lat * radians) *
      Math.cos(centerLat * radians) *
      Math.cos((lon - centerLon) * radians);
  return Math.acos(Math.max(-1, Math.min(1, dot))) / radians;
}

// Stylized cratered terrain inspired by Mercury, not a geographic map.
export function sampleMercury(
  lat: number,
  lon: number,
): { biome: MercuryBiomeId; elevation: number } {
  if (Math.abs(lat) > 82 + 2 * Math.sin(lon * radians * 5)) {
    return { biome: 'mercury-polar', elevation: 0.45 };
  }

  const caloris = distance(lat, lon, 30, 160) / 27;
  if (caloris < 1.15) {
    return {
      biome: 'mercury-caloris',
      elevation: caloris > 0.82 ? 1.45 : -0.35 + caloris * 0.35,
    };
  }

  const scarpLatitude = 8 + Math.sin(lon * radians * 3) * 4;
  if (lon > -82 && lon < 8 && Math.abs(lat - scarpLatitude) < 3) {
    return { biome: 'mercury-scarp', elevation: 1.7 };
  }

  for (const [centerLat, centerLon, radius] of craters) {
    const crater = distance(lat, lon, centerLat, centerLon) / radius;
    if (crater < 1.18) {
      return {
        biome: 'mercury-crater',
        elevation: crater > 0.8 ? 1.15 : -1.2 + crater * 0.55,
      };
    }
  }

  return {
    biome: 'mercury-plains',
    elevation:
      0.2 + Math.sin(lon * radians * 11 + Math.sin(lat * radians * 6)) * 0.22,
  };
}

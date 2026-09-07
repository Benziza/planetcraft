export type MarsBiomeId = 'dunes' | 'crater' | 'volcano' | 'canyon' | 'ice';

export const marsPalette: Record<MarsBiomeId, string> = {
  dunes: '#be6440',
  crater: '#96503b',
  volcano: '#713e32',
  canyon: '#69372d',
  ice: '#e4dfd4',
};

// A stylized, deterministic landscape, not a geographic map of Mars.
const craters = [
  [-30, 28, 17],
  [27, 65, 11],
  [-12, -150, 14],
  [42, 142, 9],
  [-48, -80, 12],
];
const radians = Math.PI / 180;

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

export function sampleMars(
  lat: number,
  lon: number,
): { biome: MarsBiomeId; elevation: number } {
  if (Math.abs(lat) > 72 + 3 * Math.sin(lon * radians * 4)) {
    return { biome: 'ice', elevation: 0.7 };
  }
  const volcanoDistance = distance(lat, lon, 20, -38);
  if (volcanoDistance < 19) {
    const elevation =
      volcanoDistance < 4 ? 1.1 : 2.8 * (1 - volcanoDistance / 21);
    return { biome: 'volcano', elevation };
  }
  const canyonLatitude = -5 + Math.sin(lon * radians * 3) * 4;
  if (lon > -70 && lon < 15 && Math.abs(lat - canyonLatitude) < 4) {
    return { biome: 'canyon', elevation: -1.5 };
  }
  for (const [centerLat, centerLon, radius] of craters) {
    const d = distance(lat, lon, centerLat, centerLon) / radius;
    if (d < 1.2) {
      return { biome: 'crater', elevation: d > 0.8 ? 1 : -1.3 + d * 0.6 };
    }
  }
  return {
    biome: 'dunes',
    elevation:
      0.25 + Math.sin(lon * radians * 9 + Math.sin(lat * radians * 7)) * 0.3,
  };
}

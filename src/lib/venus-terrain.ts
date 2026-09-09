export type VenusBiomeId =
  | 'venus-plains'
  | 'venus-crater'
  | 'venus-volcano'
  | 'venus-highlands'
  | 'venus-rift';

export const venusPalette: Record<VenusBiomeId, string> = {
  'venus-plains': '#bd934e',
  'venus-crater': '#886239',
  'venus-volcano': '#755039',
  'venus-highlands': '#dbc084',
  'venus-rift': '#60452f',
};

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

// Stylized volcanic terrain, not a geographic map of Venus.
export function sampleVenus(
  lat: number,
  lon: number,
): { biome: VenusBiomeId; elevation: number } {
  const volcano = distance(lat, lon, 20, -38);
  if (volcano < 20)
    return {
      biome: 'venus-volcano',
      elevation: volcano < 4 ? 1 : 2.8 * (1 - volcano / 23),
    };
  const crater = distance(lat, lon, -30, 28) / 16;
  if (crater < 1.2)
    return {
      biome: 'venus-crater',
      elevation: crater > 0.8 ? 1 : -1.3 + crater * 0.6,
    };
  const highlands = distance(lat, lon, 55, 100);
  if (highlands < 28)
    return {
      biome: 'venus-highlands',
      elevation: 1.2 + 1.3 * (1 - highlands / 28),
    };
  if (
    lon > -80 &&
    lon < 10 &&
    Math.abs(lat + 8 - Math.sin(lon * radians * 3) * 3) < 4
  ) {
    return { biome: 'venus-rift', elevation: -1.4 };
  }
  return {
    biome: 'venus-plains',
    elevation:
      0.3 + Math.sin(lon * radians * 8) * Math.cos(lat * radians * 6) * 0.25,
  };
}

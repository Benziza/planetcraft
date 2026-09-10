export type JupiterBiomeId =
  | 'jupiter-belts'
  | 'jupiter-zones'
  | 'jupiter-spot'
  | 'jupiter-ovals'
  | 'jupiter-poles';

// A playful cloudscape, not a geographic surface or a live weather map.
export const JUPITER_SHAPE = {
  equatorialRadius: 2.85,
  polarRadius: 2.66,
  voxelSize: 0.085,
  axialTilt: (3.1 * Math.PI) / 180,
} as const;
const radians = Math.PI / 180;
const wrap = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;

export function sampleJupiter(
  lat: number,
  lon: number,
): { biome: JupiterBiomeId; color: string } {
  const latitude = Math.max(-90, Math.min(90, lat));
  const longitude = wrap(lon);
  const phi = longitude * radians;
  const spot = Math.hypot(wrap(longitude - 12) / 19, (latitude + 22) / 9);
  if (spot < 1) {
    const swirl = Math.sin(
      Math.atan2((latitude + 22) / 9, wrap(longitude - 12) / 19) * 3 +
        spot * 13,
    );
    return {
      biome: 'jupiter-spot',
      color:
        spot > 0.84
          ? '#dca67c'
          : spot < 0.3
            ? '#963e2b'
            : swirl > 0
              ? '#c7613d'
              : '#b24b30',
    };
  }
  if (Math.abs(latitude) > 67)
    return {
      biome: 'jupiter-poles',
      color: Math.abs(latitude) > 82 ? '#737e88' : '#969084',
    };
  for (const center of [-65, -20, 55, 110]) {
    const oval = Math.hypot(
      wrap(longitude - center) / 7,
      (latitude + 40) / 3.5,
    );
    if (oval < 1)
      return {
        biome: 'jupiter-ovals',
        color: oval < 0.65 ? '#f4e6d0' : '#bb9c80',
      };
  }
  const wave =
    Math.sin(phi * 6 + latitude * 0.22) * 1.4 +
    Math.sin(phi * 13 - latitude * 0.3) * 0.5;
  const bandLat = Math.abs(latitude + wave);
  const belt =
    (bandLat > 10 && bandLat < 23) ||
    (bandLat > 33 && bandLat < 46) ||
    bandLat > 57;
  const stripe = Math.abs(Math.floor((latitude + 90 + wave) / 2.2)) % 4;
  return {
    biome: belt ? 'jupiter-belts' : 'jupiter-zones',
    color: (belt
      ? ['#a96d49', '#bc825b', '#956044', '#c18c66']
      : ['#e9d9bc', '#f1e4cd', '#dac6a5', '#e4ceb0'])[stripe],
  };
}

export type JupiterVoxel = {
  x: number;
  y: number;
  z: number;
  lat: number;
  lon: number;
  biome: JupiterBiomeId;
  color: string;
};

export function buildJupiterBody(): JupiterVoxel[] {
  const { equatorialRadius, polarRadius, voxelSize } = JUPITER_SHAPE;
  const bound = Math.ceil(equatorialRadius / voxelSize);
  const inside = (x: number, y: number, z: number) =>
    ((x * voxelSize) ** 2 + (z * voxelSize) ** 2) / equatorialRadius ** 2 +
      ((y * voxelSize) / polarRadius) ** 2 <=
    1;
  const neighbors = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];
  const cells: JupiterVoxel[] = [];
  for (let x = -bound; x <= bound; x++)
    for (let y = -bound; y <= bound; y++)
      for (let z = -bound; z <= bound; z++) {
        if (
          !inside(x, y, z) ||
          neighbors.every(([dx, dy, dz]) => inside(x + dx, y + dy, z + dz))
        )
          continue;
        const lat =
          Math.atan2(y / polarRadius, Math.hypot(x, z) / equatorialRadius) /
          radians;
        const lon = Math.atan2(x, z) / radians;
        cells.push({
          x: x * voxelSize,
          y: y * voxelSize,
          z: z * voxelSize,
          lat,
          lon,
          ...sampleJupiter(lat, lon),
        });
      }
  return cells;
}

export function jupiterFitDistance(
  aspect: number,
  verticalFovDegrees = 37,
): number {
  const vertical = (verticalFovDegrees * radians) / 2;
  const horizontal = Math.atan(Math.tan(vertical) * Math.max(0.1, aspect));
  return (
    ((JUPITER_SHAPE.equatorialRadius + JUPITER_SHAPE.voxelSize) * 1.13) /
    Math.sin(Math.min(vertical, horizontal))
  );
}

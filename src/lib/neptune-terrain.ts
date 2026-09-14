export type NeptuneBiomeId =
  | 'neptune-bands'
  | 'neptune-dark-spot'
  | 'neptune-scooter'
  | 'neptune-poles'
  | 'neptune-rings';

// An illustrative atmosphere and ring system, not a dated weather map.
export const NEPTUNE_SHAPE = {
  equatorialRadius: 2.5,
  polarRadius: 2.43,
  voxelSize: 0.085,
  axialTilt: (28.3 * Math.PI) / 180,
} as const;

export const NEPTUNE_RINGS = {
  innerRadius: 3.15,
  outerRadius: 4.08,
  voxelSize: 0.055,
  thickness: 0.035,
  bands: [
    { innerRadius: 3.15, outerRadius: 3.28, color: '#58677d' },
    { innerRadius: 3.42, outerRadius: 3.54, color: '#778397' },
    { innerRadius: 3.7, outerRadius: 3.82, color: '#4e607a' },
    { innerRadius: 3.95, outerRadius: 4.08, color: '#8993a2' },
  ],
} as const;

const radians = Math.PI / 180;
const wrap = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;
const bandColors = ['#1769c2', '#237bd0', '#328edc', '#1e72c8'];

export function sampleNeptune(
  lat: number,
  lon: number,
): { biome: NeptuneBiomeId; color: string } {
  const latitude = Math.max(-90, Math.min(90, lat));
  const longitude = wrap(lon);

  if (Math.abs(latitude) > 68) {
    return {
      biome: 'neptune-poles',
      color: Math.abs(latitude) > 82 ? '#78c8ef' : '#61b9eb',
    };
  }

  const darkSpotLongitude = wrap(longitude + 55);
  const darkSpotDistance = Math.hypot(
    darkSpotLongitude / 18,
    (latitude + 22) / 8,
  );
  if (darkSpotDistance < 1) {
    return {
      biome: 'neptune-dark-spot',
      color: darkSpotDistance < 0.55 ? '#0d347d' : '#123f91',
    };
  }

  const scooterLongitude = wrap(longitude - 32);
  const scooterDistance = Math.hypot(
    scooterLongitude / 10,
    (latitude + 42) / 4.5,
  );
  if (scooterDistance < 1) {
    return {
      biome: 'neptune-scooter',
      color: scooterDistance < 0.42 ? '#e5f8ff' : '#b8e7fa',
    };
  }

  const wave =
    Math.sin(longitude * radians * 5 + latitude * 0.12) * 0.75 +
    Math.sin(longitude * radians * 11) * 0.2;
  const band = Math.abs(Math.floor((latitude + 90 + wave) / 5));
  return {
    biome: 'neptune-bands',
    color: bandColors[band % bandColors.length],
  };
}

export type NeptuneVoxel = {
  x: number;
  y: number;
  z: number;
  lat: number;
  lon: number;
  biome: NeptuneBiomeId;
  color: string;
};

export function buildNeptuneBody(): NeptuneVoxel[] {
  const { equatorialRadius, polarRadius, voxelSize } = NEPTUNE_SHAPE;
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
  const cells: NeptuneVoxel[] = [];
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
          ...sampleNeptune(lat, lon),
        });
      }
  return cells;
}

export type NeptuneRingVoxel = { x: number; z: number; color: string };

export function buildNeptuneRings(): NeptuneRingVoxel[] {
  const { bands, voxelSize } = NEPTUNE_RINGS;
  const bound = Math.ceil(NEPTUNE_RINGS.outerRadius / voxelSize);
  const halfDiagonal = voxelSize / Math.SQRT2;
  const cells: NeptuneRingVoxel[] = [];
  for (let gx = -bound; gx <= bound; gx++)
    for (let gz = -bound; gz <= bound; gz++) {
      const x = gx * voxelSize;
      const z = gz * voxelSize;
      const radius = Math.hypot(x, z);
      const band = bands.find(
        ({ innerRadius, outerRadius }) =>
          radius - halfDiagonal >= innerRadius &&
          radius + halfDiagonal <= outerRadius,
      );
      if (!band) continue;
      cells.push({ x, z, color: band.color });
    }
  return cells;
}

export function neptuneFitDistance(
  aspect: number,
  verticalFovDegrees = 37,
): number {
  const vertical = (verticalFovDegrees * radians) / 2;
  const horizontal = Math.atan(Math.tan(vertical) * Math.max(0.1, aspect));
  return (
    ((NEPTUNE_RINGS.outerRadius + NEPTUNE_RINGS.voxelSize) * 1.1) /
    Math.sin(Math.min(vertical, horizontal))
  );
}

export type UranusBiomeId =
  | 'uranus-bands'
  | 'uranus-storms'
  | 'uranus-polar-cap'
  | 'uranus-collar'
  | 'uranus-rings';

// An illustrative atmosphere and ring system, not a dated weather map.
export const URANUS_SHAPE = {
  equatorialRadius: 2.5,
  polarRadius: 2.44,
  voxelSize: 0.085,
  axialTilt: (97.8 * Math.PI) / 180,
} as const;

export const URANUS_RINGS = {
  innerRadius: 3.03,
  outerRadius: 4.16,
  voxelSize: 0.055,
  thickness: 0.038,
  bands: [
    { innerRadius: 3.03, outerRadius: 3.16, color: '#73898c' },
    { innerRadius: 3.36, outerRadius: 3.45, color: '#92a5a4' },
    { innerRadius: 3.62, outerRadius: 3.72, color: '#60767b' },
    { innerRadius: 3.98, outerRadius: 4.16, color: '#a4b4b1' },
  ],
} as const;

const radians = Math.PI / 180;
const wrap = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;
const bandColors = ['#78cbd1', '#83d3d6', '#70c2cb', '#91d9d8'];

export function sampleUranus(
  lat: number,
  lon: number,
): { biome: UranusBiomeId; color: string } {
  const latitude = Math.max(-90, Math.min(90, lat));
  const longitude = wrap(lon);

  if (latitude > 61) {
    return {
      biome: 'uranus-polar-cap',
      color: latitude > 80 ? '#c3ece6' : '#afe2df',
    };
  }

  const collarWave = Math.sin(longitude * radians * 3) * 1.4;
  if (latitude > 43 + collarWave && latitude < 52 + collarWave) {
    return {
      biome: 'uranus-collar',
      color: latitude > 48 + collarWave ? '#58aebb' : '#66bbc4',
    };
  }

  const stormLongitude = wrap(longitude + 42);
  const stormDistance = Math.hypot(stormLongitude / 13, (latitude - 27) / 5);
  if (stormDistance < 1) {
    return {
      biome: 'uranus-storms',
      color: stormDistance < 0.45 ? '#e6f8f2' : '#b9e8e3',
    };
  }

  const wave =
    Math.sin(longitude * radians * 4 + latitude * 0.1) * 0.65 +
    Math.sin(longitude * radians * 9) * 0.18;
  const band = Math.abs(Math.floor((latitude + 90 + wave) / 5.4));
  return {
    biome: 'uranus-bands',
    color: bandColors[band % bandColors.length],
  };
}

export type UranusVoxel = {
  x: number;
  y: number;
  z: number;
  lat: number;
  lon: number;
  biome: UranusBiomeId;
  color: string;
};

export function buildUranusBody(): UranusVoxel[] {
  const { equatorialRadius, polarRadius, voxelSize } = URANUS_SHAPE;
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
  const cells: UranusVoxel[] = [];
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
          ...sampleUranus(lat, lon),
        });
      }
  return cells;
}

export type UranusRingVoxel = { x: number; z: number; color: string };

export function buildUranusRings(): UranusRingVoxel[] {
  const { bands, voxelSize } = URANUS_RINGS;
  const bound = Math.ceil(URANUS_RINGS.outerRadius / voxelSize);
  const halfDiagonal = voxelSize / Math.SQRT2;
  const cells: UranusRingVoxel[] = [];
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

export function uranusFitDistance(
  aspect: number,
  verticalFovDegrees = 37,
): number {
  const vertical = (verticalFovDegrees * radians) / 2;
  const horizontal = Math.atan(Math.tan(vertical) * Math.max(0.1, aspect));
  return (
    ((URANUS_RINGS.outerRadius + URANUS_RINGS.voxelSize) * 1.1) /
    Math.sin(Math.min(vertical, horizontal))
  );
}

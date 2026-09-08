export type SaturnBiomeId =
  | 'saturn-bands'
  | 'saturn-storms'
  | 'saturn-poles'
  | 'saturn-hexagon'
  | 'saturn-rings';

export const saturnPalette: Record<SaturnBiomeId, string> = {
  'saturn-bands': '#d9bc83',
  'saturn-storms': '#f3e2b7',
  'saturn-poles': '#af9670',
  'saturn-hexagon': '#7c8269',
  'saturn-rings': '#dacba7',
};

// An illustrative atmosphere and ring system, not a dated weather map.
export const SATURN_SHAPE = {
  equatorialRadius: 2.55,
  polarRadius: 2.29,
  voxelSize: 0.085,
  axialTilt: (26.7 * Math.PI) / 180,
} as const;

export const SATURN_RINGS = {
  innerRadius: 3.16,
  bInnerRadius: 3.66,
  cassiniInnerRadius: 4.47,
  cassiniOuterRadius: 4.68,
  outerRadius: 5.22,
  voxelSize: 0.112,
  thickness: 0.055,
} as const;

const radians = Math.PI / 180;
const bandColors = [
  '#c4ac80',
  '#d7bd8d',
  '#ecdbb2',
  '#e0c797',
  '#cbb07a',
  '#e5cca0',
  '#d6bb89',
];

export function sampleSaturn(
  lat: number,
  lon: number,
): { biome: SaturnBiomeId; color: string } {
  const latitude = Math.max(-90, Math.min(90, lat));
  const longitude = ((((lon + 180) % 360) + 360) % 360) - 180;
  const phi = longitude * radians;

  if (latitude > 65) {
    // The boundary is a hexagon in the north-polar projection.
    const sector = (((longitude + 30 + 360) % 60) - 30) * radians;
    const boundary = Math.sin(15 * radians) / Math.cos(sector);
    const polarDistance = Math.cos(latitude * radians);
    if (polarDistance < boundary) {
      return {
        biome: 'saturn-hexagon',
        color:
          latitude > 86
            ? '#596558'
            : polarDistance > boundary * 0.76
              ? '#7c8b79'
              : '#aaa57b',
      };
    }
  }
  if (Math.abs(latitude) > 68) {
    return {
      biome: 'saturn-poles',
      color: Math.abs(latitude) > 80 ? '#a28e6e' : '#bdab81',
    };
  }

  const stormLongitude = ((((longitude + 32 + 180) % 360) + 360) % 360) - 180;
  const stormDistance = Math.hypot(stormLongitude / 19, (latitude - 35) / 6.5);
  if (stormDistance < 1) {
    return {
      biome: 'saturn-storms',
      color:
        stormDistance < 0.35
          ? '#d8c499'
          : stormDistance < 0.78
            ? '#f5e8c8'
            : '#e5d3ac',
    };
  }

  const wave =
    Math.sin(phi * 4 + latitude * 0.15) * 0.8 + Math.sin(phi * 7) * 0.25;
  const band = Math.floor((latitude + 90 + wave) / 4.7);
  return { biome: 'saturn-bands', color: bandColors[band % bandColors.length] };
}

export type SaturnVoxel = {
  x: number;
  y: number;
  z: number;
  lat: number;
  lon: number;
  biome: SaturnBiomeId;
  color: string;
};

export function buildSaturnBody(): SaturnVoxel[] {
  const { equatorialRadius, polarRadius, voxelSize } = SATURN_SHAPE;
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
  const cells: SaturnVoxel[] = [];
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
          ...sampleSaturn(lat, lon),
        });
      }
  return cells;
}

export type SaturnRingVoxel = { x: number; z: number; color: string };

export function buildSaturnRings(): SaturnRingVoxel[] {
  const rings = SATURN_RINGS;
  const bound = Math.ceil(rings.outerRadius / rings.voxelSize);
  // Include the complete cube footprint when protecting the Cassini division.
  const halfDiagonal = rings.voxelSize / Math.SQRT2;
  const cells: SaturnRingVoxel[] = [];
  for (let gx = -bound; gx <= bound; gx++)
    for (let gz = -bound; gz <= bound; gz++) {
      const x = gx * rings.voxelSize,
        z = gz * rings.voxelSize;
      const radius = Math.hypot(x, z);
      if (
        radius - halfDiagonal < rings.innerRadius ||
        radius + halfDiagonal > rings.outerRadius
      )
        continue;
      if (
        radius + halfDiagonal > rings.cassiniInnerRadius &&
        radius - halfDiagonal < rings.cassiniOuterRadius
      )
        continue;
      const stripe = Math.floor(radius * 42) % 5;
      const color =
        radius < rings.bInnerRadius
          ? ['#a7977a', '#baaa8a', '#978c74', '#c0af8c', '#ab9d80'][stripe]
          : radius < rings.cassiniInnerRadius
            ? ['#e4d5b3', '#eedfbc', '#d1bf99', '#e9d7ad', '#d9c79f'][stripe]
            : ['#bdaf90', '#d8c9a7', '#cbbc99', '#e0d1af', '#cebd96'][stripe];
      cells.push({ x, z, color });
    }
  return cells;
}

export function saturnFitDistance(
  aspect: number,
  verticalFovDegrees = 37,
): number {
  const vertical = (verticalFovDegrees * radians) / 2;
  const horizontal = Math.atan(Math.tan(vertical) * Math.max(0.1, aspect));
  return (
    ((SATURN_RINGS.outerRadius + SATURN_RINGS.voxelSize) * 1.08) /
    Math.sin(Math.min(vertical, horizontal))
  );
}

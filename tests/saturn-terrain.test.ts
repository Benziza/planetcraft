import { describe, expect, it, vi } from 'vitest';
import {
  buildSaturnBody,
  buildSaturnRings,
  sampleSaturn,
  saturnFitDistance,
  SATURN_RINGS,
  SATURN_SHAPE,
} from '../src/lib/saturn-terrain';
import { createSaturn } from '../src/lib/voxel-saturn';

describe('Saturn atmosphere', () => {
  it.each([
    ['saturn-bands', 8, 30],
    ['saturn-storms', 35, -32],
    ['saturn-poles', -85, 0],
    ['saturn-hexagon', 82, 0],
  ] as const)(
    'lands %s on the matching atmospheric feature',
    (biome, lat, lon) => {
      expect(sampleSaturn(lat, lon).biome).toBe(biome);
    },
  );

  it('has deterministic bands with no longitude seam', () => {
    const colors = new Set<string>();
    for (let latitude = -60; latitude <= 60; latitude += 4) {
      const sample = sampleSaturn(latitude, -180);
      expect(sample).toEqual(sampleSaturn(latitude, 180));
      expect(sample).toEqual(sampleSaturn(latitude, 540));
      expect(sample).toEqual(sampleSaturn(latitude, -180));
      colors.add(sample.color);
    }
    expect(colors.size).toBeGreaterThan(4);
  });

  it('has a six-sided boundary around the north pole only', () => {
    for (let longitude = -180; longitude < 180; longitude += 60) {
      expect(sampleSaturn(74, longitude).biome).toBe('saturn-poles');
      expect(sampleSaturn(74, longitude + 30).biome).toBe('saturn-hexagon');
    }
    expect(sampleSaturn(90, 0).biome).toBe('saturn-hexagon');
    expect(sampleSaturn(-90, 0).biome).toBe('saturn-poles');
  });
});

describe('Saturn geometry', () => {
  it('builds a bounded, hollow exterior with an oblate silhouette', () => {
    const cells = buildSaturnBody();
    expect(cells.length).toBeGreaterThan(8_000);
    expect(cells.length).toBeLessThan(20_000);
    const equatorialExtent = Math.max(...cells.map((cell) => Math.abs(cell.x)));
    const polarExtent = Math.max(...cells.map((cell) => Math.abs(cell.y)));
    expect(polarExtent / equatorialExtent).toBeGreaterThan(0.86);
    expect(polarExtent / equatorialExtent).toBeLessThan(0.93);
    expect(equatorialExtent).toBeGreaterThan(
      SATURN_SHAPE.equatorialRadius - SATURN_SHAPE.voxelSize * 1.01,
    );
    expect(polarExtent).toBeGreaterThan(
      SATURN_SHAPE.polarRadius - SATURN_SHAPE.voxelSize * 1.01,
    );
    expect(
      cells.every((cell) => Math.hypot(cell.x, cell.y, cell.z) > 2.1),
    ).toBe(true);
    expect(new Set(cells.map((cell) => cell.biome))).toEqual(
      new Set([
        'saturn-bands',
        'saturn-storms',
        'saturn-poles',
        'saturn-hexagon',
      ]),
    );
  });

  it('keeps every ring voxel outside the globe and the entire Cassini division', () => {
    const rings = buildSaturnRings();
    expect(rings.length).toBeGreaterThan(2_000);
    expect(rings.length).toBeLessThan(15_000);
    const {
      voxelSize,
      innerRadius,
      outerRadius,
      cassiniInnerRadius,
      cassiniOuterRadius,
    } = SATURN_RINGS;
    for (const cell of rings) {
      const nearestX = Math.max(0, Math.abs(cell.x) - voxelSize / 2);
      const nearestZ = Math.max(0, Math.abs(cell.z) - voxelSize / 2);
      const nearest = Math.hypot(nearestX, nearestZ);
      const farthest = Math.hypot(
        Math.abs(cell.x) + voxelSize / 2,
        Math.abs(cell.z) + voxelSize / 2,
      );
      expect(nearest).toBeGreaterThan(innerRadius);
      expect(nearest).toBeGreaterThan(SATURN_SHAPE.equatorialRadius);
      expect(farthest).toBeLessThan(outerRadius);
      expect(
        farthest <= cassiniInnerRadius || nearest >= cassiniOuterRadius,
      ).toBe(true);
    }
    expect(
      rings.some(
        (cell) => Math.hypot(cell.x, cell.z) < SATURN_RINGS.bInnerRadius,
      ),
    ).toBe(true);
    expect(
      rings.some((cell) => Math.hypot(cell.x, cell.z) > cassiniOuterRadius),
    ).toBe(true);
    expect(buildSaturnRings()).toEqual(rings);
  });

  it.each([0.45, 0.65, 1, 1.8, 2.5])(
    'fits the complete ring system at aspect ratio %s',
    (aspect) => {
      const distance = saturnFitDistance(aspect);
      const angularRadius = Math.asin(
        (SATURN_RINGS.outerRadius + SATURN_RINGS.voxelSize) / distance,
      );
      const verticalHalfAngle = (37 * Math.PI) / 360;
      const horizontalHalfAngle = Math.atan(
        Math.tan(verticalHalfAngle) * aspect,
      );
      expect(angularRadius).toBeLessThan(verticalHalfAngle);
      expect(angularRadius).toBeLessThan(horizontalHalfAngle);
    },
  );
});

it('aborts Saturn before allocating a canvas or fetching Earth data', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  const controller = new AbortController();
  const container = document.createElement('div');
  controller.abort();
  try {
    await expect(
      createSaturn(container, controller.signal, {
        onSelect: vi.fn(),
        onInteract: vi.fn(),
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(container.childElementCount).toBe(0);
  } finally {
    fetchSpy.mockRestore();
  }
});

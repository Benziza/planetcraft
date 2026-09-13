import { describe, expect, it, vi } from 'vitest';
import { uranusBiomes } from '../src/data/uranus-biomes';
import {
  buildUranusBody,
  buildUranusRings,
  sampleUranus,
  uranusFitDistance,
  URANUS_RINGS,
  URANUS_SHAPE,
} from '../src/lib/uranus-terrain';
import { createUranus } from '../src/lib/voxel-uranus';

describe('Uranus atmosphere', () => {
  it.each(uranusBiomes.filter(({ id }) => id !== 'uranus-rings'))(
    'lands $id on its matching atmospheric feature',
    ({ id, lat, lon }) => {
      expect(sampleUranus(lat, lon).biome).toBe(id);
    },
  );

  it('has deterministic cloud bands with no longitude seam', () => {
    const colors = new Set<string>();
    for (let latitude = -55; latitude <= 40; latitude += 5) {
      const sample = sampleUranus(latitude, -180);
      expect(sample).toEqual(sampleUranus(latitude, 180));
      expect(sample).toEqual(sampleUranus(latitude, 540));
      colors.add(sample.color);
    }
    expect(colors.size).toBeGreaterThan(2);
  });

  it('keeps the polar cap and collar distinct', () => {
    expect(sampleUranus(90, 0).biome).toBe('uranus-polar-cap');
    expect(sampleUranus(48, 0).biome).toBe('uranus-collar');
    expect(sampleUranus(-90, 0).biome).toBe('uranus-bands');
  });
});

describe('Uranus geometry', () => {
  it('builds a bounded, hollow exterior with a subtly oblate silhouette', () => {
    const cells = buildUranusBody();
    expect(cells.length).toBeGreaterThan(8_000);
    expect(cells.length).toBeLessThan(20_000);
    const equatorialExtent = Math.max(...cells.map((cell) => Math.abs(cell.x)));
    const polarExtent = Math.max(...cells.map((cell) => Math.abs(cell.y)));
    expect(polarExtent / equatorialExtent).toBeGreaterThan(0.94);
    expect(polarExtent / equatorialExtent).toBeLessThan(1);
    expect(equatorialExtent).toBeGreaterThan(
      URANUS_SHAPE.equatorialRadius - URANUS_SHAPE.voxelSize * 1.01,
    );
    expect(
      cells.every((cell) => Math.hypot(cell.x, cell.y, cell.z) > 2.1),
    ).toBe(true);
    expect(new Set(cells.map((cell) => cell.biome))).toEqual(
      new Set([
        'uranus-bands',
        'uranus-storms',
        'uranus-polar-cap',
        'uranus-collar',
      ]),
    );
  });

  it('builds deterministic, narrow rings outside the globe', () => {
    const rings = buildUranusRings();
    expect(rings.length).toBeGreaterThan(500);
    expect(rings.length).toBeLessThan(8_000);
    for (const cell of rings) {
      const radius = Math.hypot(cell.x, cell.z);
      expect(radius).toBeGreaterThan(URANUS_RINGS.innerRadius);
      expect(radius).toBeGreaterThan(URANUS_SHAPE.equatorialRadius);
      expect(radius).toBeLessThan(URANUS_RINGS.outerRadius);
      expect(
        URANUS_RINGS.bands.some(
          ({ innerRadius, outerRadius }) =>
            radius >= innerRadius && radius <= outerRadius,
        ),
      ).toBe(true);
    }
    expect(new Set(rings.map((cell) => cell.color)).size).toBe(
      URANUS_RINGS.bands.length,
    );
    expect(buildUranusRings()).toEqual(rings);
  });

  it.each([0.45, 0.65, 1, 1.8, 2.5])(
    'fits the complete ring system at aspect ratio %s',
    (aspect) => {
      const distance = uranusFitDistance(aspect);
      const angularRadius = Math.asin(
        (URANUS_RINGS.outerRadius + URANUS_RINGS.voxelSize) / distance,
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

it('aborts Uranus before allocating a canvas or fetching Earth data', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  const controller = new AbortController();
  const container = document.createElement('div');
  controller.abort();
  try {
    await expect(
      createUranus(container, controller.signal, {
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

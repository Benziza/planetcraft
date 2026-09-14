import { describe, expect, it, vi } from 'vitest';
import { neptuneBiomes } from '../src/data/neptune-biomes';
import {
  buildNeptuneBody,
  buildNeptuneRings,
  neptuneFitDistance,
  NEPTUNE_RINGS,
  NEPTUNE_SHAPE,
  sampleNeptune,
} from '../src/lib/neptune-terrain';
import { createNeptune } from '../src/lib/voxel-neptune';

describe('Neptune atmosphere', () => {
  it.each(neptuneBiomes.filter(({ id }) => id !== 'neptune-rings'))(
    'lands $id on its matching atmospheric feature',
    ({ id, lat, lon }) => {
      expect(sampleNeptune(lat, lon).biome).toBe(id);
    },
  );

  it('has deterministic cloud bands with no longitude seam', () => {
    const colors = new Set<string>();
    for (let latitude = -60; latitude <= 60; latitude += 5) {
      const sample = sampleNeptune(latitude, -180);
      expect(sample).toEqual(sampleNeptune(latitude, 180));
      expect(sample).toEqual(sampleNeptune(latitude, 540));
      colors.add(sample.color);
    }
    expect(colors.size).toBeGreaterThan(2);
  });

  it('keeps the Great Dark Spot, Scooter, and poles distinct', () => {
    expect(sampleNeptune(-22, -55).biome).toBe('neptune-dark-spot');
    expect(sampleNeptune(-42, 32).biome).toBe('neptune-scooter');
    expect(sampleNeptune(90, 0).biome).toBe('neptune-poles');
  });
});

describe('Neptune geometry', () => {
  it('builds a bounded, hollow exterior with an oblate silhouette', () => {
    const cells = buildNeptuneBody();
    expect(cells.length).toBeGreaterThan(8_000);
    expect(cells.length).toBeLessThan(20_000);
    const equatorialExtent = Math.max(...cells.map((cell) => Math.abs(cell.x)));
    const polarExtent = Math.max(...cells.map((cell) => Math.abs(cell.y)));
    expect(polarExtent / equatorialExtent).toBeGreaterThan(0.93);
    expect(polarExtent / equatorialExtent).toBeLessThan(1);
    expect(equatorialExtent).toBeGreaterThan(
      NEPTUNE_SHAPE.equatorialRadius - NEPTUNE_SHAPE.voxelSize * 1.01,
    );
    expect(
      cells.every((cell) => Math.hypot(cell.x, cell.y, cell.z) > 2.1),
    ).toBe(true);
    expect(new Set(cells.map((cell) => cell.biome))).toEqual(
      new Set([
        'neptune-bands',
        'neptune-dark-spot',
        'neptune-scooter',
        'neptune-poles',
      ]),
    );
  });

  it('builds deterministic, faint rings outside the globe', () => {
    const rings = buildNeptuneRings();
    expect(rings.length).toBeGreaterThan(400);
    expect(rings.length).toBeLessThan(8_000);
    for (const cell of rings) {
      const radius = Math.hypot(cell.x, cell.z);
      expect(radius).toBeGreaterThan(NEPTUNE_RINGS.innerRadius);
      expect(radius).toBeGreaterThan(NEPTUNE_SHAPE.equatorialRadius);
      expect(radius).toBeLessThan(NEPTUNE_RINGS.outerRadius);
    }
    expect(new Set(rings.map((cell) => cell.color)).size).toBe(
      NEPTUNE_RINGS.bands.length,
    );
    expect(buildNeptuneRings()).toEqual(rings);
  });

  it.each([0.45, 0.65, 1, 1.8, 2.5])(
    'fits the complete ring system at aspect ratio %s',
    (aspect) => {
      const distance = neptuneFitDistance(aspect);
      const angularRadius = Math.asin(
        (NEPTUNE_RINGS.outerRadius + NEPTUNE_RINGS.voxelSize) / distance,
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

it('aborts Neptune before allocating a canvas or fetching Earth data', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  const controller = new AbortController();
  const container = document.createElement('div');
  controller.abort();
  try {
    await expect(
      createNeptune(container, controller.signal, {
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

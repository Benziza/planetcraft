import { expect, it, vi } from 'vitest';
import { jupiterBiomes } from '../src/data/jupiter-biomes';
import {
  sampleJupiter,
  buildJupiterBody,
  JUPITER_SHAPE,
  jupiterFitDistance,
} from '../src/lib/jupiter-terrain';
import { createEarth } from '../src/lib/voxel-earth';

it.each(jupiterBiomes)(
  'lands $name on the matching cloud feature',
  ({ id, lat, lon }) => {
    expect(sampleJupiter(lat, lon).biome).toBe(id);
  },
);
it('wraps longitude seamlessly and includes both polar regions', () => {
  for (const lat of [-90, -40, -22, 0, 16, 90]) {
    expect(sampleJupiter(lat, -180)).toEqual(sampleJupiter(lat, 180));
    expect(sampleJupiter(lat, 12)).toEqual(sampleJupiter(lat, 372));
  }
  expect(sampleJupiter(-90, 0).biome).toBe('jupiter-poles');
  expect(sampleJupiter(90, 0).biome).toBe('jupiter-poles');
  expect(sampleJupiter(-22, 12).color).not.toBe(sampleJupiter(-22, 100).color);
});
it('builds a flattened shell with every destination represented and fits narrow screens', () => {
  const cells = buildJupiterBody();
  expect(cells.length).toBeGreaterThan(8000);
  expect(cells.length).toBeLessThan(20000);
  expect(new Set(cells.map((cell) => cell.biome))).toEqual(
    new Set(jupiterBiomes.map((b) => b.id)),
  );
  expect(Math.max(...cells.map((c) => Math.abs(c.y)))).toBeLessThan(
    Math.max(...cells.map((c) => Math.abs(c.x))),
  );
  for (const aspect of [0.5, 1, 2]) {
    const halfFov = Math.min(
      (37 * Math.PI) / 360,
      Math.atan(Math.tan((37 * Math.PI) / 360) * aspect),
    );
    expect(jupiterFitDistance(aspect) * Math.sin(halfFov)).toBeGreaterThan(
      JUPITER_SHAPE.equatorialRadius + JUPITER_SHAPE.voxelSize,
    );
  }
});
it('aborts Jupiter without requesting Earth coastlines or creating a renderer', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch');
  const controller = new AbortController();
  controller.abort();
  try {
    await expect(
      createEarth(
        document.createElement('div'),
        controller.signal,
        {
          onSelect: vi.fn(),
          onInteract: vi.fn(),
        },
        'jupiter',
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    fetchMock.mockRestore();
  }
});

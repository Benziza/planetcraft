import { expect, it, vi } from 'vitest';
import { marsBiomes } from '../src/data/mars-biomes';
import { sampleMars } from '../src/lib/mars-terrain';
import { createEarth } from '../src/lib/voxel-earth';

it.each(marsBiomes)(
  'lands the $name destination on the matching terrain',
  ({ id, lat, lon }) => {
    expect(sampleMars(lat, lon).biome).toBe(id);
  },
);

it('has recessed crater floors, raised rims, mountains, and both polar caps', () => {
  expect(sampleMars(-30, 28).elevation).toBeLessThan(0);
  expect(sampleMars(-14, 28).elevation).toBeGreaterThan(0);
  expect(sampleMars(28, -38).elevation).toBeGreaterThan(1.5);
  expect(sampleMars(90, 0).biome).toBe('ice');
  expect(sampleMars(-90, 0).biome).toBe('ice');
  expect(sampleMars(0, -180).biome).toBe(sampleMars(0, 180).biome);
  expect(sampleMars(0, -180).elevation).toBeCloseTo(sampleMars(0, 180).elevation);
});

it('aborts Mars without requesting Earth coastlines or creating a renderer', async () => {
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
        'mars',
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    fetchMock.mockRestore();
  }
});

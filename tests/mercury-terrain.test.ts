import { expect, it, vi } from 'vitest';
import { mercuryBiomes } from '../src/data/mercury-biomes';
import { sampleMercury } from '../src/lib/mercury-terrain';
import { createEarth } from '../src/lib/voxel-earth';

it.each(mercuryBiomes)(
  'lands the $name destination on the matching terrain',
  ({ id, lat, lon }) => {
    expect(sampleMercury(lat, lon).biome).toBe(id);
  },
);

it('keeps relief bounded, deterministic, and continuous across the longitude seam', () => {
  for (let lat = -90; lat <= 90; lat += 5) {
    expect(sampleMercury(lat, -180).biome).toBe(sampleMercury(lat, 180).biome);
    expect(sampleMercury(lat, -180).elevation).toBeCloseTo(
      sampleMercury(lat, 180).elevation,
    );
    for (let lon = -180; lon <= 180; lon += 5) {
      const terrain = sampleMercury(lat, lon);
      expect(terrain).toEqual(sampleMercury(lat, lon));
      expect(terrain.elevation).toBeGreaterThanOrEqual(-1.2);
      expect(terrain.elevation).toBeLessThanOrEqual(1.7);
    }
  }
  expect(sampleMercury(-32, -45).elevation).toBeLessThan(0);
  expect(sampleMercury(-20, -45).elevation).toBeGreaterThan(0);
  expect(sampleMercury(8, -60).elevation).toBe(1.7);
});

it('aborts Mercury without requesting Earth coastlines or creating a renderer', async () => {
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
        'mercury',
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    fetchMock.mockRestore();
  }
});

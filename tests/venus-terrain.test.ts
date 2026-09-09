import { expect, it, vi } from 'vitest';
import { venusBiomes } from '../src/data/venus-biomes';
import { sampleVenus } from '../src/lib/venus-terrain';
import { createEarth } from '../src/lib/voxel-earth';

it.each(venusBiomes)(
  'lands the $name destination on the matching terrain',
  ({ id, lat, lon }) => {
    expect(sampleVenus(lat, lon).biome).toBe(id);
  },
);

it('keeps relief bounded, deterministic, and continuous across the longitude seam', () => {
  for (let lat = -90; lat <= 90; lat += 5) {
    expect(sampleVenus(lat, -180).biome).toBe(sampleVenus(lat, 180).biome);
    expect(sampleVenus(lat, -180).elevation).toBeCloseTo(
      sampleVenus(lat, 180).elevation,
    );
    for (let lon = -180; lon <= 180; lon += 5) {
      const terrain = sampleVenus(lat, lon);
      expect(terrain).toEqual(sampleVenus(lat, lon));
      expect(terrain.elevation).toBeGreaterThanOrEqual(-1.4);
      expect(terrain.elevation).toBeLessThanOrEqual(2.8);
    }
  }
  expect(sampleVenus(-30, 28).elevation).toBeLessThan(0);
  expect(sampleVenus(-15, 28).elevation).toBeGreaterThan(0);
  expect(sampleVenus(28, -38).elevation).toBeGreaterThan(1.5);
});

it('aborts Venus without requesting Earth coastlines or creating a renderer', async () => {
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
        'venus',
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    fetchMock.mockRestore();
  }
});

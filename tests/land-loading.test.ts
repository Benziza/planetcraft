import { afterEach, expect, it, vi } from 'vitest';
import { createEarth } from '../src/lib/voxel-earth';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it.each(['/', '/planetcraft/'])(
  'loads land data inside the %s deployment',
  async (base) => {
    vi.stubEnv('BASE_URL', base);
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    await expect(
      createEarth(document.createElement('div'), controller.signal, {
        onSelect: vi.fn(),
        onInteract: vi.fn(),
      }),
    ).rejects.toThrow('Land data unavailable');

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${base}land.geojson`, {
      signal: controller.signal,
    });
  },
);

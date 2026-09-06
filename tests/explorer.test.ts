import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import EarthExplorer from '../src/components/EarthExplorer.vue';
import type { EarthAPI } from '../src/lib/voxel-earth';

const { createEarthMock } = vi.hoisted(() => ({ createEarthMock: vi.fn() }));
vi.mock('../src/lib/voxel-earth', () => ({ createEarth: createEarthMock }));

function makeAPI() {
  return {
    blockCount: 7314,
    setNight: vi.fn(),
    setClouds: vi.fn(),
    setRotate: vi.fn(),
    focus: vi.fn(),
    reset: vi.fn(),
    zoom: vi.fn(),
    key: vi.fn(),
    dispose: vi.fn(),
  } satisfies EarthAPI;
}

describe('Vue Earth explorer', () => {
  let wrapper: VueWrapper | undefined;
  let api = makeAPI();
  let reducedMotion = false;

  beforeEach(() => {
    api = makeAPI();
    reducedMotion = false;
    createEarthMock.mockReset();
    createEarthMock.mockResolvedValue(api);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: reducedMotion,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  async function start() {
    wrapper = mount(EarthExplorer, { attachTo: document.body });
    await flushPromises();
    return wrapper;
  }

  it.each(['/', '/earthcraft/'])(
    'keeps the home link inside the %s deployment',
    async (base) => {
      vi.stubEnv('BASE_URL', base);
      const view = await start();
      expect(
        view.get('a[aria-label="Earthcraft home"]').attributes('href'),
      ).toBe(base);
    },
  );

  it('disposes an initialized scene once on unmount', async () => {
    const view = await start();
    view.unmount();
    wrapper = undefined;
    expect(api.dispose).toHaveBeenCalledOnce();
  });
});

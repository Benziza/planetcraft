import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import EarthExplorer from '../src/components/EarthExplorer.vue';
import type { createEarth, EarthAPI } from '../src/lib/voxel-earth';

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

  function callbacks() {
    return createEarthMock.mock.calls[0][2] as Parameters<
      typeof createEarth
    >[2];
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

  it('enables exploration when the scene is ready and shows its real block count', async () => {
    const view = await start();
    expect(view.find('.world-loading').exists()).toBe(false);
    expect(view.text()).toContain('7,314 BLOCKS');
    expect(
      view.get('button[aria-label="Zoom in"]').attributes('disabled'),
    ).toBeUndefined();
    expect(api.setNight).toHaveBeenLastCalledWith(false);
    expect(api.setClouds).toHaveBeenLastCalledWith(true);
    expect(api.setRotate).toHaveBeenLastCalledWith(true);
  });

  it('updates the scene from the Vue lighting and cloud controls', async () => {
    const view = await start();
    await view.get('[role="radio"][value="night"]').trigger('click');
    expect(view.get('main').classes()).toContain('is-night');
    expect(api.setNight).toHaveBeenLastCalledWith(true);
    await view.get('[role="radio"][value="day"]').trigger('click');
    expect(view.get('main').classes()).not.toContain('is-night');
    expect(api.setNight).toHaveBeenLastCalledWith(false);
    await view.get('button[aria-label="Show clouds"]').trigger('click');
    expect(api.setClouds).toHaveBeenLastCalledWith(false);
  });

  it('visits a biome, stops rotation, and shows matching coordinates', async () => {
    const view = await start();
    await view.get('button[title="Explore Sahara desert"]').trigger('click');
    expect(api.focus).toHaveBeenLastCalledWith(24, 15);
    expect(api.setRotate).toHaveBeenLastCalledWith(false);
    expect(view.get('.discovery-title').text()).toBe('Sahara desert');
    expect(view.get('.discovery-bottom').text()).toContain('24.0° N / 15.0° E');
    expect(
      view
        .get('button[title="Explore Sahara desert"]')
        .attributes('aria-pressed'),
    ).toBe('true');
  });

  it('shows the biome picked by the renderer and pauses auto-rotation', async () => {
    const view = await start();
    callbacks().onSelect('ocean', -12.5, -143);
    await nextTick();
    expect(view.get('.discovery-title').text()).toBe('Ocean biome');
    expect(view.get('.discovery-bottom').text()).toContain(
      '12.5° S / 143.0° W',
    );
    expect(api.setRotate).toHaveBeenLastCalledWith(false);
  });

  it('keeps the rotation switch in sync after a drag', async () => {
    const view = await start();
    callbacks().onInteract();
    await nextTick();
    expect(
      view.get('button[aria-label="Auto-rotate"]').attributes('aria-checked'),
    ).toBe('false');
    expect(api.setRotate).toHaveBeenLastCalledWith(false);
  });

  it('routes zoom and keyboard controls and resets the selected biome', async () => {
    const view = await start();
    await view.get('button[aria-label="Zoom in"]').trigger('click');
    await view.get('button[aria-label="Zoom out"]').trigger('click');
    expect(api.zoom.mock.calls.map((call) => call[0])).toEqual([-1, 1]);
    const key = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    view.get('.earth-canvas').element.dispatchEvent(key);
    await nextTick();
    expect(key.defaultPrevented).toBe(true);
    expect(api.key).toHaveBeenLastCalledWith('ArrowRight');
    await view.get('button[title="Explore Sahara desert"]').trigger('click');
    await view.get('.earth-canvas').trigger('keydown', { key: 'Home' });
    expect(api.reset).toHaveBeenCalledOnce();
    expect(view.get('.discovery-title').text()).toBe('Planet Earth');
    expect(api.setRotate).toHaveBeenLastCalledWith(true);
  });

  it('respects reduced motion on initialization and reset', async () => {
    reducedMotion = true;
    const view = await start();
    expect(api.setRotate).toHaveBeenLastCalledWith(false);
    await view.get('button[aria-label="Auto-rotate"]').trigger('click');
    expect(api.setRotate).toHaveBeenLastCalledWith(true);
    await view.get('button[aria-label="Reset view"]').trigger('click');
    expect(api.setRotate).toHaveBeenLastCalledWith(false);
  });

  it('disposes an initialized scene once on unmount', async () => {
    const view = await start();
    view.unmount();
    wrapper = undefined;
    expect(api.dispose).toHaveBeenCalledOnce();
  });
});

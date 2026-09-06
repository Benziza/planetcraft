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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
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

  it('keeps settings changed during loading when the scene arrives', async () => {
    const pending = deferred<EarthAPI>();
    createEarthMock.mockReturnValue(pending.promise);
    const view = await start();
    expect(
      view.get('button[aria-label="Zoom in"]').attributes('disabled'),
    ).toBeDefined();
    expect(view.get('.biome-button').attributes('disabled')).toBeDefined();
    await view.get('[role="radio"][value="night"]').trigger('click');
    await view.get('button[aria-label="Show clouds"]').trigger('click');
    await view.get('button[aria-label="Auto-rotate"]').trigger('click');
    pending.resolve(api);
    await flushPromises();
    expect(api.setNight).toHaveBeenLastCalledWith(true);
    expect(api.setClouds).toHaveBeenLastCalledWith(false);
    expect(api.setRotate).toHaveBeenLastCalledWith(false);
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

  it('visits a biome and stops rotation without showing a discovery card', async () => {
    const view = await start();
    await view.get('button[title="Explore Sahara desert"]').trigger('click');
    expect(api.focus).toHaveBeenLastCalledWith(24, 15);
    expect(api.setRotate).toHaveBeenLastCalledWith(false);
    expect(view.find('.discovery-card').exists()).toBe(false);
    expect(
      view
        .get('button[title="Explore Sahara desert"]')
        .attributes('aria-pressed'),
    ).toBe('true');
  });

  it('highlights the biome picked by the renderer and pauses auto-rotation', async () => {
    const view = await start();
    callbacks().onSelect('ocean', -12.5, -143);
    await nextTick();
    expect(
      view
        .get('button[title="Explore Pacific Ocean"]')
        .attributes('aria-pressed'),
    ).toBe('true');
    expect(view.find('.discovery-card').exists()).toBe(false);
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
    expect(view.find('.biome-button[aria-pressed="true"]').exists()).toBe(
      false,
    );
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

  it('shows retry feedback and keeps camera and biome controls disabled after failure', async () => {
    createEarthMock.mockRejectedValue(new Error('Land data unavailable'));
    const view = await start();
    expect(view.get('.world-loading').text()).toContain(
      'Your world couldn’t load.',
    );
    expect(view.get('.retry-button').text()).toContain('Try again');
    expect(
      view.get('button[aria-label="Zoom in"]').attributes('disabled'),
    ).toBeDefined();
    expect(view.get('.biome-button').attributes('disabled')).toBeDefined();
  });

  it('aborts initialization and disposes a late scene after unmount', async () => {
    const pending = deferred<EarthAPI>();
    createEarthMock.mockReturnValue(pending.promise);
    const view = await start();
    const signal = createEarthMock.mock.calls[0][1] as AbortSignal;
    view.unmount();
    wrapper = undefined;
    expect(signal.aborted).toBe(true);
    pending.resolve(api);
    await flushPromises();
    expect(api.dispose).toHaveBeenCalledOnce();
    expect(api.setNight).not.toHaveBeenCalled();
  });

  it('disposes an initialized scene once on unmount', async () => {
    const view = await start();
    view.unmount();
    wrapper = undefined;
    expect(api.dispose).toHaveBeenCalledOnce();
  });

  it('opens and closes the accessible help dialog', async () => {
    const view = await start();
    await view.get('.help-button').trigger('click');
    await flushPromises();
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Make yourself at home.');
    expect(dialog?.getAttribute('aria-labelledby')).toBeTruthy();
    (
      document.querySelector(
        'button[aria-label="Close guide"]',
      ) as HTMLButtonElement
    ).click();
    await flushPromises();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});

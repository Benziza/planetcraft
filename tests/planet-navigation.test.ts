import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import App from '../src/App.vue';
import PlanetPicker from '../src/components/PlanetPicker.vue';
import { planets } from '../src/data/planets';
import type { EarthAPI } from '../src/lib/voxel-earth';

const { createEarthMock } = vi.hoisted(() => ({ createEarthMock: vi.fn() }));
vi.mock('../src/lib/voxel-earth', () => ({ createEarth: createEarthMock }));

describe('planet navigation', () => {
  let wrapper: VueWrapper | undefined;
  let api: EarthAPI;

  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    api = {
      blockCount: 6832,
      setNight: vi.fn(),
      setClouds: vi.fn(),
      setRotate: vi.fn(),
      focus: vi.fn(),
      reset: vi.fn(),
      zoom: vi.fn(),
      key: vi.fn(),
      dispose: vi.fn(),
    };
    createEarthMock.mockReset();
    createEarthMock.mockResolvedValue(api);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    );
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    window.history.replaceState(null, '', '/');
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  async function start(hash = '') {
    window.history.replaceState(null, '', `/${hash}`);
    wrapper = mount(App, { attachTo: document.body });
    await flushPromises();
    return wrapper;
  }

  async function choose(view: VueWrapper, id: string) {
    view.getComponent(PlanetPicker).vm.$emit('choose', id);
    await flushPromises();
  }

  it.each(['', '#/earth'])('opens Earth directly at %s', async (hash) => {
    const view = await start(hash);
    expect(view.find('.earth-canvas').exists()).toBe(true);
    expect(view.get('.planet-picker-value').text()).toBe('Earth');
    expect(createEarthMock).toHaveBeenCalledOnce();
  });

  it('disposes Earth when Mars is selected', async () => {
    const view = await start();
    await choose(view, 'mars');
    await flushPromises();
    expect(window.location.hash).toBe('#/mars');
    expect(view.find('[aria-label="Interactive Mars explorer"]').exists()).toBe(
      true,
    );
    expect(api.dispose).toHaveBeenCalledOnce();
    expect(view.get('h1').text()).toContain('NEW WORLD.');
    expect(createEarthMock.mock.calls[1][3]).toBe('mars');
    expect(document.activeElement).toBe(view.get('h1').element);
    expect(document.title).toContain('Mars');
  });

  it.each(['mercury', 'jupiter', 'uranus', 'neptune'])(
    'opens a direct %s link as a missing world without creating a renderer',
    async (id) => {
      const view = await start(`#/${id}`);
      expect(view.get('h1').text()).toContain('404');
      expect(view.text()).toContain('NOT FOUND');
      expect(view.get('.planet-picker-value').text()).toBe(
        planets.find((planet) => planet.id === id)!.name,
      );
      expect(view.find('.earth-canvas').exists()).toBe(false);
      expect(createEarthMock).not.toHaveBeenCalled();
    },
  );

  it('keeps the selection in sync with browser back and forward', async () => {
    const view = await start('#/earth');
    const selected = new Promise((resolve) =>
      window.addEventListener('hashchange', resolve, { once: true }),
    );
    await choose(view, 'mars');
    await selected;
    await flushPromises();

    const back = new Promise((resolve) =>
      window.addEventListener('hashchange', resolve, { once: true }),
    );
    window.history.back();
    await back;
    await flushPromises();
    expect(view.get('.planet-picker-value').text()).toBe('Earth');
    expect(view.find('.earth-canvas').exists()).toBe(true);

    const forward = new Promise((resolve) =>
      window.addEventListener('hashchange', resolve, { once: true }),
    );
    window.history.forward();
    await forward;
    await flushPromises();
    expect(view.get('.planet-picker-value').text()).toBe('Mars');
    expect(view.find('[aria-label="Interactive Mars explorer"]').exists()).toBe(
      true,
    );
  });

  it('opens Mars directly with a working scene and title', async () => {
    const view = await start('#/mars');
    expect(view.find('[aria-label="Interactive Mars explorer"]').exists()).toBe(
      true,
    );
    expect(createEarthMock).toHaveBeenCalledOnce();
    expect(createEarthMock.mock.calls[0][3]).toBe('mars');
    expect(document.title).toBe('Mars — The Red Planet | Planetcraft');
    await choose(view, 'earth');
    await flushPromises();
    expect(api.dispose).toHaveBeenCalledOnce();
    expect(createEarthMock.mock.calls[1][3]).toBe('earth');
    expect(
      view.find('[aria-label="Interactive Earth explorer"]').exists(),
    ).toBe(true);
  });

  it('opens Saturn directly with a working scene and title', async () => {
    const view = await start('#/saturn');
    expect(
      view.find('[aria-label="Interactive Saturn explorer"]').exists(),
    ).toBe(true);
    expect(view.get('.planet-picker-value').text()).toBe('Saturn');
    expect(view.get('main').classes()).toContain('is-saturn');
    expect(createEarthMock).toHaveBeenCalledOnce();
    expect(createEarthMock.mock.calls[0][3]).toBe('saturn');
    expect(document.title).toBe('Saturn — The Ringed Planet | Planetcraft');
  });

  it.each(['earth', 'mars'])(
    'disposes scenes when switching from %s to Saturn and back',
    async (id) => {
      const view = await start(`#/${id}`);
      const saturnApi = { ...api, dispose: vi.fn() };
      createEarthMock.mockResolvedValueOnce(saturnApi);
      await choose(view, 'saturn');
      expect(window.location.hash).toBe('#/saturn');
      expect(api.dispose).toHaveBeenCalledOnce();
      expect(saturnApi.dispose).not.toHaveBeenCalled();
      expect(createEarthMock.mock.calls[1][3]).toBe('saturn');
      expect(document.activeElement).toBe(view.get('h1').element);

      await choose(view, id);
      expect(window.location.hash).toBe(`#/${id}`);
      expect(saturnApi.dispose).toHaveBeenCalledOnce();
      expect(api.dispose).toHaveBeenCalledOnce();
      expect(createEarthMock.mock.calls[2][3]).toBe(id);
      expect(view.get('.planet-picker-value').text()).toBe(
        id === 'earth' ? 'Earth' : 'Mars',
      );
    },
  );

  it('opens Venus directly and supports terrain, clouds, and navigation cleanup', async () => {
    const view = await start('#/venus');
    expect(
      view.find('[aria-label="Interactive Venus explorer"]').exists(),
    ).toBe(true);
    expect(view.get('.planet-picker-value').text()).toBe('Venus');
    expect(view.get('main').classes()).toContain('is-venus');
    expect(document.title).toBe('Venus — The Veiled Planet | Planetcraft');
    expect(createEarthMock.mock.calls[0][3]).toBe('venus');
    await view.get('button[title="Explore Rocky highlands"]').trigger('click');
    expect(api.focus).toHaveBeenCalledWith(55, 100);
    await view.get('[aria-label="Show cloud veil"]').trigger('click');
    expect(api.setClouds).toHaveBeenLastCalledWith(false);
    await choose(view, 'earth');
    expect(api.dispose).toHaveBeenCalledOnce();
    const venusApi = { ...api, dispose: vi.fn() };
    createEarthMock.mockResolvedValueOnce(venusApi);
    await choose(view, 'venus');
    expect(createEarthMock.mock.calls[2][3]).toBe('venus');
    expect(document.activeElement).toBe(view.get('h1').element);
    view.unmount();
    wrapper = undefined;
    expect(venusApi.dispose).toHaveBeenCalledOnce();
  });

  it('recovers from an unknown planet using Back to Earth', async () => {
    const view = await start('#/pluto');
    expect(view.text()).toContain('Unknown planet');
    expect(view.get('h1').text()).toContain('404');
    const homeButton = view
      .findAll('button')
      .find((button) => button.text().includes('Back to Earth'))!;
    await homeButton.trigger('click');
    await flushPromises();
    expect(window.location.hash).toBe('#/earth');
    expect(view.find('.earth-canvas').exists()).toBe(true);
    expect(view.get('.planet-picker-value').text()).toBe('Earth');
    expect(document.title).toBe('Planetcraft — Worlds in blocks');
  });
});

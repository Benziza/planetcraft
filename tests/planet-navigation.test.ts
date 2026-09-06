import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import App from '../src/App.vue';
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

  it.each(['', '#/earth'])('opens Earth directly at %s', async (hash) => {
    const view = await start(hash);
    expect(view.find('.earth-canvas').exists()).toBe(true);
    expect(view.get('select').element.value).toBe('earth');
    expect(createEarthMock).toHaveBeenCalledOnce();
  });

  it('offers all eight planets and disposes Earth when Mars is selected', async () => {
    const view = await start();
    expect(view.findAll('option').map((option) => option.text())).toEqual([
      'Mercury',
      'Venus',
      'Earth',
      'Mars',
      'Jupiter',
      'Saturn',
      'Uranus',
      'Neptune',
    ]);
    await view.get('select').setValue('mars');
    await flushPromises();
    expect(window.location.hash).toBe('#/mars');
    expect(view.find('.earth-canvas').exists()).toBe(false);
    expect(api.dispose).toHaveBeenCalledOnce();
    expect(view.get('h1').text()).toContain('404');
    expect(document.activeElement).toBe(view.get('h1').element);
    expect(document.title).toContain('Mars');
  });

  it.each([
    'mercury',
    'venus',
    'mars',
    'jupiter',
    'saturn',
    'uranus',
    'neptune',
  ])(
    'opens a direct %s link as a missing world without creating a renderer',
    async (id) => {
      const view = await start(`#/${id}`);
      expect(view.get('h1').text()).toContain('404');
      expect(view.text()).toContain('NOT FOUND');
      expect(view.get('select').element.value).toBe(id);
      expect(view.find('.earth-canvas').exists()).toBe(false);
      expect(createEarthMock).not.toHaveBeenCalled();
    },
  );

  it('keeps the selection in sync with browser back and forward', async () => {
    const view = await start('#/earth');
    const selected = new Promise((resolve) =>
      window.addEventListener('hashchange', resolve, { once: true }),
    );
    await view.get('select').setValue('mars');
    await selected;
    await flushPromises();

    const back = new Promise((resolve) =>
      window.addEventListener('hashchange', resolve, { once: true }),
    );
    window.history.back();
    await back;
    await flushPromises();
    expect(view.get('select').element.value).toBe('earth');
    expect(view.find('.earth-canvas').exists()).toBe(true);

    const forward = new Promise((resolve) =>
      window.addEventListener('hashchange', resolve, { once: true }),
    );
    window.history.forward();
    await forward;
    await flushPromises();
    expect(view.get('select').element.value).toBe('mars');
    expect(view.find('.earth-canvas').exists()).toBe(false);
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
    expect(view.get('select').element.value).toBe('earth');
    expect(document.title).toBe('Planetcraft — Worlds in blocks');
  });
});

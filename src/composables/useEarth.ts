import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
} from 'vue';
import { biomes, defaultSelection } from '../data/biomes';
import type { BiomeId, EarthAPI } from '../lib/voxel-earth';

export function useEarth(container: Ref<HTMLDivElement | null>) {
  const ready = ref(false);
  const error = ref(false);
  const lighting = ref('day');
  const night = computed(() => lighting.value === 'night');
  const clouds = ref(true);
  const rotating = ref(true);
  const active = ref<BiomeId | null>(null);
  const count = ref(0);
  const selection = ref(defaultSelection());
  const coordinates = computed(() =>
    active.value
      ? `${Math.abs(selection.value.lat).toFixed(1)}° ${selection.value.lat < 0 ? 'S' : 'N'} / ${Math.abs(selection.value.lon).toFixed(1)}° ${selection.value.lon < 0 ? 'W' : 'E'}`
      : 'SEED: HOME SWEET HOME',
  );

  // Keep Three.js objects outside deep Vue reactivity.
  let api: EarthAPI | null = null;
  let disposed = false;
  let reducedMotion = false;
  const controller = new AbortController();

  watch(night, (value) => api?.setNight(value));
  watch(clouds, (value) => api?.setClouds(value));
  watch(rotating, (value) => api?.setRotate(value));

  onMounted(async () => {
    reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    rotating.value = !reducedMotion;
    try {
      const { createEarth } = await import('../lib/voxel-earth');
      if (disposed || !container.value) return;
      const current = await createEarth(container.value, controller.signal, {
        onSelect: (biome, lat, lon) => {
          if (disposed) return;
          const item = biomes.find((candidate) => candidate.id === biome)!;
          active.value = biome;
          selection.value = {
            name: `${item.name} biome`,
            sub: item.text,
            location: 'BLOCK DISCOVERED',
            lat,
            lon,
          };
          rotating.value = false;
        },
        onInteract: () => {
          if (!disposed) rotating.value = false;
        },
      });
      if (disposed) {
        current.dispose();
        return;
      }
      api = current;
      // Settings can change while the scene/data are loading.
      api.setNight(night.value);
      api.setClouds(clouds.value);
      api.setRotate(rotating.value);
      count.value = current.blockCount;
      ready.value = true;
    } catch {
      if (!disposed) error.value = true;
    }
  });

  onBeforeUnmount(() => {
    disposed = true;
    controller.abort();
    api?.dispose();
    api = null;
  });

  function focusBiome(index: number) {
    const biome = biomes[index];
    if (!ready.value || !biome) return;
    active.value = biome.id;
    rotating.value = false;
    selection.value = {
      name: biome.label,
      sub: biome.text,
      location: biome.detail.toUpperCase(),
      lat: biome.lat,
      lon: biome.lon,
    };
    api?.focus(biome.lat, biome.lon);
  }

  function reset() {
    if (!ready.value) return;
    api?.reset();
    active.value = null;
    selection.value = defaultSelection();
    reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    rotating.value = !reducedMotion;
  }

  function zoom(direction: number) {
    api?.zoom(direction);
  }

  function onKeydown(event: KeyboardEvent) {
    if (
      !ready.value ||
      ![
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        '+',
        '=',
        '-',
        'Home',
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    if (event.key === 'Home') reset();
    else {
      rotating.value = false;
      api?.key(event.key);
    }
  }

  function reload() {
    window.location.reload();
  }

  return {
    ready,
    error,
    lighting,
    night,
    clouds,
    rotating,
    active,
    count,
    selection,
    coordinates,
    focusBiome,
    reset,
    zoom,
    onKeydown,
    reload,
  };
}

import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
} from 'vue';
import { biomes } from '../data/biomes';
import { marsBiomes } from '../data/mars-biomes';
import type { BiomeId, EarthAPI } from '../lib/voxel-earth';

export function useEarth(
  container: Ref<HTMLDivElement | null>,
  planetId: 'earth' | 'mars' = 'earth',
) {
  const destinations = planetId === 'mars' ? marsBiomes : biomes;
  const ready = ref(false);
  const error = ref(false);
  const lighting = ref('day');
  const night = computed(() => lighting.value === 'night');
  const clouds = ref(true);
  const rotating = ref(true);
  const active = ref<BiomeId | null>(null);
  const count = ref(0);

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
      const current = await createEarth(
        container.value,
        controller.signal,
        {
          onSelect: (biome) => {
            if (disposed) return;
            active.value = biome;
            rotating.value = false;
          },
          onInteract: () => {
            if (!disposed) rotating.value = false;
          },
        },
        planetId,
      );
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
    const biome = destinations[index];
    if (!ready.value || !biome) return;
    active.value = biome.id;
    rotating.value = false;
    api?.focus(biome.lat, biome.lon);
  }

  function reset() {
    if (!ready.value) return;
    api?.reset();
    active.value = null;
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
    focusBiome,
    reset,
    zoom,
    onKeydown,
    reload,
  };
}

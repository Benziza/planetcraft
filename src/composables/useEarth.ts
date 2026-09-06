import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
} from 'vue';
import type { EarthAPI } from '../lib/voxel-earth';

export function useEarth(container: Ref<HTMLDivElement | null>) {
  const ready = ref(false);
  const error = ref(false);
  const lighting = ref('day');
  const night = computed(() => lighting.value === 'night');
  const clouds = ref(true);
  const rotating = ref(true);
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
      const current = await createEarth(container.value, controller.signal, {
        onSelect: () => undefined,
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

  function reset() {
    if (!ready.value) return;
    api?.reset();
    reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    rotating.value = !reducedMotion;
  }

  function zoom(direction: number) {
    api?.zoom(direction);
  }

  return {
    ready,
    error,
    lighting,
    night,
    clouds,
    rotating,
    count,
    reset,
    zoom,
  };
}

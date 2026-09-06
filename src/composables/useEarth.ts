import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import type { EarthAPI } from '../lib/voxel-earth';

export function useEarth(container: Ref<HTMLDivElement | null>) {
  const ready = ref(false);
  const error = ref(false);
  const rotating = ref(true);
  const count = ref(0);
  // Keep Three.js objects outside deep Vue reactivity.
  let api: EarthAPI | null = null;
  let disposed = false;
  let reducedMotion = false;
  const controller = new AbortController();

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

  return { ready, error, count };
}

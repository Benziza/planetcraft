import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { planets } from '../data/planets';

function readPlanet() {
  const hash = window.location.hash;
  if (!hash || hash === '#/') return 'earth';
  return /^#\/([a-z]+)\/?$/.exec(hash)?.[1] ?? 'unknown';
}

export function usePlanetRoute() {
  const planetId = ref(readPlanet());
  const planet = computed(() =>
    planets.find((item) => item.id === planetId.value),
  );
  const planetName = computed(() => planet.value?.name ?? 'Unknown planet');

  function syncRoute() {
    planetId.value = readPlanet();
  }

  function choosePlanet(id: string) {
    if (!planets.some((item) => item.id === id)) return;
    window.location.hash = `/${id}`;
    syncRoute();
  }

  watch(
    planetId,
    () => {
      document.title =
        planetId.value === 'earth'
          ? 'Planetcraft — Worlds in blocks'
          : planetId.value === 'venus'
            ? 'Venus — The Veiled Planet | Planetcraft'
            : planetId.value === 'mars'
              ? 'Mars — The Red Planet | Planetcraft'
              : planetId.value === 'jupiter'
                ? 'Jupiter — The Gas Giant | Planetcraft'
                : planetId.value === 'saturn'
                  ? 'Saturn — The Ringed Planet | Planetcraft'
                  : `${planetName.value} — 404 Not Found | Planetcraft`;
    },
    { immediate: true },
  );

  onMounted(() => window.addEventListener('hashchange', syncRoute));
  onBeforeUnmount(() => window.removeEventListener('hashchange', syncRoute));

  return { planetId, planetName, choosePlanet };
}

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import EarthExplorer from './components/EarthExplorer.vue';
import PlanetPicker from './components/PlanetPicker.vue';
import PlanetNotFound from './components/PlanetNotFound.vue';
import SiteHeader from './components/SiteHeader.vue';
import { usePlanetRoute } from './composables/usePlanetRoute';

const { planetId, planetName, choosePlanet } = usePlanetRoute();
const page = ref<HTMLDivElement | null>(null);

watch(planetId, async () => {
  await nextTick();
  page.value?.querySelector('h1')?.focus();
});
</script>

<template>
  <div ref="page">
    <EarthExplorer
      v-if="
        planetId === 'venus' ||
        planetId === 'earth' ||
        planetId === 'mars' ||
        planetId === 'saturn' ||
        planetId === 'jupiter'
      "
      :key="planetId"
      :planet-id="planetId"
    >
      <template #planet-picker>
        <PlanetPicker :planet-id="planetId" @choose="choosePlanet" />
      </template>
    </EarthExplorer>
    <main v-else class="earth-app">
      <SiteHeader>
        <PlanetPicker :planet-id="planetId" @choose="choosePlanet" />
      </SiteHeader>
      <PlanetNotFound
        :planet-name="planetName"
        @return-home="choosePlanet('earth')"
      />
    </main>
  </div>
</template>

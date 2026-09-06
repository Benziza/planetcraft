<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import EarthExplorer from './components/EarthExplorer.vue';
import PlanetPicker from './components/PlanetPicker.vue';
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
    <EarthExplorer v-if="planetId === 'earth'">
      <template #planet-picker>
        <PlanetPicker :planet-id="planetId" @choose="choosePlanet" />
      </template>
    </EarthExplorer>
    <main v-else class="earth-app">
      <SiteHeader>
        <PlanetPicker :planet-id="planetId" @choose="choosePlanet" />
      </SiteHeader>
      <section class="missing-planet">
        <p>{{ planetName }}</p>
        <h1 tabindex="-1">404 NOT FOUND</h1>
        <p>This world hasn’t been built yet.</p>
        <button @click="choosePlanet('earth')">Back to Earth</button>
      </section>
    </main>
  </div>
</template>

<style scoped>
.missing-planet {
  padding: 100px 24px;
  text-align: center;
}
.missing-planet h1 {
  font-family: var(--font-pixel), monospace;
  color: #b6e58c;
}
.missing-planet button {
  padding: 12px 20px;
  color: #182219;
  background: #b6e58c;
  border: 1px solid #d6f3bb;
}
</style>

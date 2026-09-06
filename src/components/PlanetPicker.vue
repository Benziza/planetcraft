<script setup lang="ts">
import { ChevronDown, Orbit } from '@lucide/vue';
import { planets } from '../data/planets';

defineProps<{ planetId: string }>();
const emit = defineEmits<{ choose: [id: string] }>();
</script>

<template>
  <label class="planet-picker">
    <Orbit :size="20" aria-hidden="true" />
    <span class="planet-picker-label">CHOOSE A PLANET</span>
    <select
      aria-label="Choose a planet"
      :value="planetId"
      @change="emit('choose', ($event.target as HTMLSelectElement).value)"
    >
      <option
        v-if="!planets.some((planet) => planet.id === planetId)"
        :value="planetId"
        disabled
      >
        Unknown planet
      </option>
      <option v-for="planet in planets" :key="planet.id" :value="planet.id">
        {{ planet.name }}
      </option>
    </select>
    <ChevronDown class="planet-picker-arrow" :size="15" aria-hidden="true" />
  </label>
</template>

<style scoped>
.planet-picker {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: 20px minmax(110px, 1fr) 15px;
  align-items: center;
  column-gap: 12px;
  min-width: 212px;
  padding: 8px 13px;
  background: #182219;
  border: 1px solid #506441;
  box-shadow: inset 0 -3px #0003;
  color: #b6e58c;
}
.planet-picker > svg:first-child {
  grid-row: 1 / 3;
}
.planet-picker-label {
  grid-column: 2;
  font:
    9px var(--font-geist-mono),
    monospace;
  letter-spacing: 1px;
  color: #93a48a;
  pointer-events: none;
}
select {
  grid-column: 2;
  grid-row: 2;
  width: 100%;
  min-width: 0;
  border: 0;
  padding: 2px 0;
  color: #e7ede6;
  background: transparent;
  font:
    14px var(--font-geist-sans),
    sans-serif;
  cursor: pointer;
  appearance: none;
  color-scheme: dark;
}
select:focus-visible {
  outline: 2px solid #b6e58c;
  outline-offset: 4px;
}
option {
  background: #182219;
  color: #e7ede6;
}
.planet-picker-arrow {
  grid-column: 3;
  grid-row: 1 / 3;
  pointer-events: none;
}
@media (max-width: 760px) {
  .planet-picker {
    position: relative;
    left: auto;
    transform: none;
    order: 3;
    width: 100%;
    grid-template-columns: 20px 1fr minmax(90px, auto) 15px;
    min-width: 0;
    padding: 10px 12px;
  }
  .planet-picker > svg:first-child {
    grid-row: 1;
  }
  .planet-picker-label {
    grid-column: 2;
    grid-row: 1;
    font-size: 10px;
  }
  select {
    grid-column: 3;
    grid-row: 1;
  }
  .planet-picker-arrow {
    grid-column: 4;
    grid-row: 1;
  }
}
</style>

<script setup lang="ts">
import { ref } from 'vue';
import {
  Box,
  Cloud,
  Compass,
  Minus,
  Moon,
  MousePointer2,
  Move,
  Plus,
  Rotate3D,
  RotateCcw,
  Sun,
  Wind,
} from '@lucide/vue';
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui';
import { useEarth } from '../composables/useEarth';
import { biomes } from '../data/biomes';
import { marsBiomes } from '../data/mars-biomes';
import SiteHeader from './SiteHeader.vue';
import WorldSwitch from './WorldSwitch.vue';

const props = withDefaults(defineProps<{ planetId?: 'earth' | 'mars' }>(), {
  planetId: 'earth',
});
const isMars = props.planetId === 'mars';
const planetName = isMars ? 'Mars' : 'Earth';
const destinations = isMars ? marsBiomes : biomes;
const container = ref<HTMLDivElement | null>(null);
const {
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
} = useEarth(container, props.planetId);
</script>

<template>
  <main class="earth-app" :class="{ 'is-night': night, 'is-mars': isMars }">
    <SiteHeader><slot name="planet-picker" /></SiteHeader>

    <section
      class="explorer"
      :aria-label="`Interactive ${planetName} explorer`"
    >
      <div class="scene-backdrop" aria-hidden="true" />
      <div class="world-coordinate coord-top" aria-hidden="true">
        <span>PLANET / {{ isMars ? '004' : '003' }}</span
        ><span>{{
          isMars ? 'A NEW WORLD TO WANDER' : 'EST. 4.5 BILLION YEARS AGO'
        }}</span>
      </div>
      <div
        ref="container"
        class="earth-canvas"
        role="application"
        tabindex="0"
        :aria-label="`3D voxel ${planetName}. Drag or use arrow keys to rotate, scroll or use plus and minus to zoom. Click a block to discover its ${isMars ? 'terrain' : 'biome'}.`"
        @keydown="onKeydown"
      />

      <output v-if="!ready" class="world-loading">
        <template v-if="error"
          ><Box /><strong>Your world couldn’t load.</strong
          ><span>Check your connection and enable WebGL in your browser.</span
          ><button class="retry-button" @click="reload">
            Try again <RotateCcw :size="15" /></button
        ></template>
        <template v-else
          ><Box class="loading-cube" /><span
            >Placing the last few blocks…</span
          ></template
        >
      </output>

      <div class="intro-panel">
        <div class="eyebrow">
          <span class="status-dot" />
          {{
            isMars
              ? 'A LITTLE FURTHER FROM HOME'
              : 'THE WORLD, A LITTLE DIFFERENT'
          }}
        </div>
        <h1 tabindex="-1">
          {{ isMars ? 'RED ' : 'SMALL ' }}<br />BLOCKS.<br /><span>{{
            isMars ? 'NEW WORLD.' : 'BIG WORLD.'
          }}</span>
        </h1>
        <p v-if="isMars">
          A world of rust, rock, and possibility.<br class="desktop-break" />
          Your next small adventure.
        </p>
        <p v-else>
          Our home planet. Reimagined, one<br class="desktop-break" />
          block at a time.
        </p>
        <div class="intro-rule" />
        <span class="explore-note"
          ><MousePointer2 :size="15" /> Go on. Give it a spin.</span
        >
      </div>

      <div class="time-tabs">
        <RadioGroupRoot
          v-model="lighting"
          class="time-list"
          orientation="horizontal"
          aria-label="World lighting"
        >
          <RadioGroupItem value="day" class="time-button"
            ><Sun :size="16" /> Day</RadioGroupItem
          >
          <RadioGroupItem value="night" class="time-button"
            ><Moon :size="16" /> Night</RadioGroupItem
          >
        </RadioGroupRoot>
      </div>

      <div class="world-tools" aria-label="Camera controls">
        <button
          :disabled="!ready"
          aria-label="Zoom in"
          title="Zoom in"
          @click="zoom(-1)"
        >
          <Plus :size="20" />
        </button>
        <button
          :disabled="!ready"
          aria-label="Zoom out"
          title="Zoom out"
          @click="zoom(1)"
        >
          <Minus :size="20" />
        </button>
        <span />
        <button
          :disabled="!ready"
          aria-label="Reset view"
          title="Reset view"
          @click="reset"
        >
          <RotateCcw :size="18" />
        </button>
      </div>

      <div class="orbit-caption">
        <span class="orbit-cross">+</span
        ><span>{{ planetName.toUpperCase() }}</span
        ><span class="orbit-line" /><span>{{
          isMars ? 'THE RED PLANET' : 'THE OVERWORLD'
        }}</span>
      </div>
      <div class="world-hint">
        <Move :size="14" /><span>Drag to rotate</span
        ><span class="hint-dot">·</span><span>Scroll to zoom</span>
      </div>
    </section>

    <section
      class="control-deck"
      :aria-label="
        isMars
          ? 'World settings and terrain destinations'
          : 'World settings and biome destinations'
      "
    >
      <div class="settings-group">
        <label for="auto-rotate"
          ><Rotate3D :size="17" /><span>Auto-rotate</span
          ><WorldSwitch id="auto-rotate" v-model="rotating" label="Auto-rotate"
        /></label>
        <label for="show-clouds"
          ><component :is="isMars ? Wind : Cloud" :size="17" /><span>{{
            isMars ? 'Dust haze' : 'Clouds'
          }}</span
          ><WorldSwitch
            id="show-clouds"
            v-model="clouds"
            :label="isMars ? 'Show dust haze' : 'Show clouds'"
        /></label>
      </div>
      <div class="biome-picker">
        <div class="biome-caption">
          {{ isMars ? 'OFF THE BEATEN PLANET' : 'A LITTLE BIT OF EVERYTHING'
          }}<span>{{ isMars ? 'JUMP TO A TERRAIN' : 'JUMP TO A BIOME' }}</span>
        </div>
        <fieldset
          class="hotbar"
          :aria-label="isMars ? 'Jump to a terrain' : 'Jump to a biome'"
        >
          <button
            v-for="(biome, index) in destinations"
            :key="biome.id"
            :aria-pressed="active === biome.id"
            :disabled="!ready"
            class="biome-button"
            :class="{ selected: active === biome.id }"
            :style="{ '--biome-color': biome.color }"
            :title="`Explore ${biome.label}`"
            @click="focusBiome(index)"
          >
            <span class="slot-number">0{{ index + 1 }}</span
            ><component
              :is="biome.icon"
              :size="25"
              :stroke-width="1.6"
            /><span>{{ biome.name }}</span>
          </button>
        </fieldset>
      </div>
      <div class="world-status">
        <span class="status-dot" />
        <div>
          <strong>{{
            ready ? 'All blocks accounted for.' : 'Building your little world.'
          }}</strong
          ><span>{{
            ready
              ? count.toLocaleString('en-US') + ' BLOCKS · ONE PLANET'
              : 'SOME THINGS ARE WORTH THE WAIT'
          }}</span>
        </div>
      </div>
    </section>
    <footer class="footer">
      <span>A little perspective goes a long way.</span
      ><span><Compass :size="13" /> BUILT FOR THE WANDERER IN YOU</span
      ><span>PLANETCRAFT <span class="footer-version">V.01</span></span>
    </footer>
  </main>
</template>

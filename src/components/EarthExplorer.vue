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
} from '@lucide/vue';
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui';
import { useEarth } from '../composables/useEarth';
import { biomes } from '../data/biomes';
import SiteHeader from './SiteHeader.vue';
import WorldSwitch from './WorldSwitch.vue';

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
} = useEarth(container);
</script>

<template>
  <main class="earth-app" :class="{ 'is-night': night }">
    <SiteHeader><slot name="planet-picker" /></SiteHeader>

    <section class="explorer" aria-label="Interactive Earth explorer">
      <div class="scene-backdrop" aria-hidden="true" />
      <div class="world-coordinate coord-top" aria-hidden="true">
        <span>PLANET / 003</span><span>EST. 4.5 BILLION YEARS AGO</span>
      </div>
      <div
        ref="container"
        class="earth-canvas"
        role="application"
        tabindex="0"
        aria-label="3D voxel Earth. Drag or use arrow keys to rotate, scroll or use plus and minus to zoom. Click a block to discover its biome."
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
          <span class="status-dot" /> THE WORLD, A LITTLE DIFFERENT
        </div>
        <h1 tabindex="-1">SMALL <br />BLOCKS.<br /><span>BIG WORLD.</span></h1>
        <p>
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
        <span class="orbit-cross">+</span><span>EARTH</span
        ><span class="orbit-line" /><span>THE OVERWORLD</span>
      </div>
      <div class="world-hint">
        <Move :size="14" /><span>Drag to rotate</span
        ><span class="hint-dot">·</span><span>Scroll to zoom</span>
      </div>
    </section>

    <section
      class="control-deck"
      aria-label="World settings and biome destinations"
    >
      <div class="settings-group">
        <label for="auto-rotate"
          ><Rotate3D :size="17" /><span>Auto-rotate</span
          ><WorldSwitch id="auto-rotate" v-model="rotating" label="Auto-rotate"
        /></label>
        <label for="show-clouds"
          ><Cloud :size="17" /><span>Clouds</span
          ><WorldSwitch id="show-clouds" v-model="clouds" label="Show clouds"
        /></label>
      </div>
      <div class="biome-picker">
        <div class="biome-caption">
          A LITTLE BIT OF EVERYTHING<span>JUMP TO A BIOME</span>
        </div>
        <fieldset class="hotbar" aria-label="Jump to a biome">
          <button
            v-for="(biome, index) in biomes"
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
      ><span>EARTHCRAFT <span class="footer-version">V.01</span></span>
    </footer>
  </main>
</template>

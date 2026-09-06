<script setup lang="ts">
import { ref } from 'vue';
import {
  Box,
  Cloud,
  Compass,
  Globe2,
  Minus,
  Moon,
  MousePointer2,
  Move,
  Plus,
  Rotate3D,
  Sun,
} from '@lucide/vue';
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui';
import { useEarth } from '../composables/useEarth';
import WorldSwitch from './WorldSwitch.vue';

const container = ref<HTMLDivElement | null>(null);
const homeUrl = import.meta.env.BASE_URL;
const { ready, error, lighting, night, clouds, rotating, count, zoom } =
  useEarth(container);
</script>

<template>
  <main class="earth-app" :class="{ 'is-night': night }">
    <header class="topbar">
      <a class="brand" :href="homeUrl" aria-label="Earthcraft home"
        ><span class="brand-mark"><Box :size="25" :stroke-width="1.8" /></span
        ><span>earthcraft<span class="brand-period">.</span></span></a
      >
      <div class="nav-current">
        <Globe2 :size="15" /><span>World explorer</span
        ><span class="nav-badge">01</span>
      </div>
      <div class="header-right">
        <span class="edition">A WORLD IN BLOCKS</span>
      </div>
    </header>

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
        aria-label="3D voxel Earth. Drag to rotate and scroll to zoom."
      />

      <output v-if="!ready" class="world-loading">
        <Box class="loading-cube" />
        <span>{{
          error ? 'Your world could not load.' : 'Building your little world…'
        }}</span>
      </output>

      <div class="intro-panel">
        <div class="eyebrow">
          <span class="status-dot" /> THE WORLD, A LITTLE DIFFERENT
        </div>
        <h1>SMALL <br />BLOCKS.<br /><span>BIG WORLD.</span></h1>
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

    <section class="control-deck" aria-label="World settings">
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

<script setup lang="ts">
import HelpDialog from './HelpDialog.vue';

const homeUrl = import.meta.env.BASE_URL;
</script>

<template>
  <header class="topbar" :class="{ 'with-planet-picker': !!$slots.default }">
    <a class="brand" :href="homeUrl" aria-label="Earthcraft home">
      <img
        class="brand-mark"
        :src="`${homeUrl}favicon.svg`"
        alt=""
        width="38"
        height="40"
      />
      <span>earthcraft<span class="brand-period">.</span></span>
    </a>
    <slot />
    <div class="header-right">
      <span class="edition">A WORLD IN BLOCKS</span><HelpDialog />
    </div>
  </header>
</template>

<style scoped>
@media (max-width: 760px) {
  .with-planet-picker {
    height: auto;
    min-height: 70px;
    padding-top: 16px;
    padding-bottom: 16px;
    flex-wrap: wrap;
    gap: 16px;
  }
}
</style>

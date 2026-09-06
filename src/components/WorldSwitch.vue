<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui';

defineProps<{ id: string; label: string }>();
const checked = defineModel<boolean>({ required: true });
</script>

<template>
  <SwitchRoot :id="id" v-model="checked" :aria-label="label" data-slot="switch">
    <SwitchThumb data-slot="switch-thumb" />
  </SwitchRoot>
</template>

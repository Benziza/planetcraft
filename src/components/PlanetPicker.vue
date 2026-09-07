<script setup lang="ts">
import { computed } from 'vue';
import { Check, ChevronDown, Orbit } from '@lucide/vue';
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectViewport,
} from 'reka-ui';
import { planets } from '../data/planets';

const props = defineProps<{ planetId: string }>();
const emit = defineEmits<{ choose: [id: string] }>();
const selected = computed(() =>
  planets.find((planet) => planet.id === props.planetId),
);
let navigating = false;

function choose(value: unknown) {
  if (
    typeof value !== 'string' ||
    !planets.some((planet) => planet.id === value)
  )
    return;
  navigating = value !== props.planetId;
  emit('choose', value);
}

function restoreFocus(event: Event) {
  // Navigation focuses the new page heading; dismissal returns to the picker.
  if (navigating) event.preventDefault();
  navigating = false;
}
</script>

<template>
  <div class="planet-picker" :data-planet="planetId">
    <SelectRoot :model-value="planetId" @update:model-value="choose">
      <SelectTrigger class="planet-picker-trigger" aria-label="Choose a planet">
        <Orbit class="planet-picker-icon" :size="20" aria-hidden="true" />
        <span class="planet-picker-label">CHOOSE A PLANET</span>
        <span class="planet-picker-value">{{
          selected?.name ?? 'Unknown planet'
        }}</span>
        <ChevronDown
          class="planet-picker-arrow"
          :size="15"
          aria-hidden="true"
        />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent
          class="planet-menu"
          aria-label="Planets"
          :data-planet="planetId"
          position="popper"
          align="start"
          :side-offset="6"
          :collision-padding="12"
          :body-lock="false"
          @close-auto-focus="restoreFocus"
        >
          <SelectViewport class="planet-menu-viewport">
            <SelectItem
              v-if="!selected"
              :value="planetId"
              disabled
              class="planet-option"
            >
              <SelectItemText>Unknown planet</SelectItemText>
            </SelectItem>
            <SelectItem
              v-for="planet in planets"
              :key="planet.id"
              :value="planet.id"
              class="planet-option"
            >
              <SelectItemText>{{ planet.name }}</SelectItemText>
              <SelectItemIndicator class="planet-option-check">
                <Check :size="15" aria-hidden="true" />
              </SelectItemIndicator>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>

<style scoped>
.planet-picker,
:global(.planet-menu) {
  --picker-background: #182219;
  --picker-border: #506441;
  --picker-accent: #b6e58c;
  --picker-muted: #93a48a;
  --picker-hover: #2c3b26;
}
.planet-picker[data-planet='mars'],
:global(.planet-menu[data-planet='mars']) {
  --picker-background: #2b1d16;
  --picker-border: #80583f;
  --picker-accent: #efab82;
  --picker-muted: #c09c86;
  --picker-hover: #493023;
}
.planet-picker {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  min-width: 212px;
}
.planet-picker-trigger {
  display: grid;
  grid-template-columns: 20px minmax(110px, 1fr) 15px;
  align-items: center;
  column-gap: 12px;
  width: 100%;
  min-height: 50px;
  padding: 8px 13px;
  border: 1px solid var(--picker-border);
  border-radius: 0;
  background: var(--picker-background);
  box-shadow: inset 0 -3px #0003;
  color: var(--picker-accent);
  text-align: left;
}
.planet-picker-trigger:hover,
.planet-picker-trigger[data-state='open'] {
  border-color: var(--picker-accent);
}
.planet-picker-trigger:focus-visible {
  outline: 2px solid var(--picker-accent);
  outline-offset: 3px;
}
.planet-picker-icon {
  grid-column: 1;
  grid-row: 1 / 3;
}
.planet-picker-label {
  grid-column: 2;
  grid-row: 1;
  font:
    9px var(--font-geist-mono),
    monospace;
  letter-spacing: 1px;
  color: var(--picker-muted);
}
.planet-picker-value {
  grid-column: 2;
  grid-row: 2;
  padding-top: 2px;
  color: #e7ede6;
  font-size: 14px;
}
.planet-picker-arrow {
  grid-column: 3;
  grid-row: 1 / 3;
  transition: transform 150ms;
}
.planet-picker-trigger[data-state='open'] .planet-picker-arrow {
  transform: rotate(180deg);
}
.planet-picker-trigger > * {
  pointer-events: none;
}
:global(.planet-menu) {
  z-index: 30;
  width: var(--reka-select-trigger-width);
  max-height: var(--reka-select-content-available-height);
  overflow: hidden;
  border: 1px solid var(--picker-border);
  border-radius: 0;
  padding: 4px;
  background: var(--picker-background);
  color: #e7ede6;
  box-shadow:
    0 8px 24px #0007,
    inset 0 -2px #0003;
}
.planet-menu-viewport {
  max-height: min(
    340px,
    calc(var(--reka-select-content-available-height) - 10px)
  );
  overflow-y: auto;
}
.planet-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 36px;
  padding: 8px 10px;
  border: 1px solid transparent;
  font:
    14px var(--font-geist-sans),
    sans-serif;
  cursor: pointer;
  user-select: none;
  outline: none;
}
.planet-option[data-state='checked'] {
  color: var(--picker-accent);
}
.planet-option[data-highlighted] {
  background: var(--picker-hover);
  border-color: var(--picker-border);
  outline: none;
}
.planet-option[data-disabled] {
  color: var(--picker-muted);
  cursor: default;
}
.planet-option-check {
  color: var(--picker-accent);
}
@media (max-width: 760px) {
  .planet-picker {
    position: relative;
    left: auto;
    transform: none;
    order: 3;
    width: 100%;
    min-width: 0;
  }
  .planet-picker-trigger {
    grid-template-columns: 20px 1fr minmax(90px, auto) 15px;
    min-height: 44px;
    padding: 10px 12px;
  }
  .planet-picker-icon,
  .planet-picker-label,
  .planet-picker-value,
  .planet-picker-arrow {
    grid-row: 1;
  }
  .planet-picker-label {
    font-size: 10px;
  }
  .planet-picker-value {
    grid-column: 3;
    padding: 0;
  }
  .planet-picker-arrow {
    grid-column: 4;
  }
}
</style>

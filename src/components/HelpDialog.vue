<script setup lang="ts">
import { ref } from 'vue';
import { HelpCircle, MousePointer2, Move, Plus, X } from '@lucide/vue';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui';

const open = ref(false);
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger class="help-button"
      ><HelpCircle :size="17" /><span>How to play</span></DialogTrigger
    >
    <DialogPortal>
      <DialogOverlay class="help-overlay" />
      <DialogContent class="help-dialog">
        <header>
          <span class="eyebrow">A LITTLE FIELD GUIDE</span>
          <DialogTitle data-slot="dialog-title"
            >Make yourself at home.</DialogTitle
          >
          <DialogDescription data-slot="dialog-description"
            >There’s a whole little world to explore.</DialogDescription
          >
        </header>
        <div class="help-row">
          <Move />
          <div>
            <strong>Turn the world</strong>
            <p>
              Drag with your mouse or one finger. Arrow keys work when the world
              is focused.
            </p>
          </div>
        </div>
        <div class="help-row">
          <Plus />
          <div>
            <strong>Get a closer look</strong>
            <p>Scroll, pinch with two fingers, or use the + and − buttons.</p>
          </div>
        </div>
        <div class="help-row">
          <MousePointer2 />
          <div>
            <strong>Discover a block</strong>
            <p>
              Click a block to highlight its biome below. Pick a biome to visit
              a place.
            </p>
          </div>
        </div>
        <p class="help-note">
          Continents follow Natural Earth coastlines. Biomes and terrain are
          playful interpretations. An independent creation, inspired by
          Minecraft.
        </p>
        <DialogClose class="help-close" aria-label="Close guide"
          ><X :size="18"
        /></DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

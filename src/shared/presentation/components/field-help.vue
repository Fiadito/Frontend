<script setup>
import {ref, useId} from 'vue';

/**
 * The "?" help icon placed next to each form field (section 6 b of the report).
 *
 * @remarks
 * The hint opens on hover, keyboard focus or click and closes with Escape.
 */
defineProps({text: {type: String, required: true}});

const visible = ref(false);
const hintId = useId();
</script>

<template>
  <span class="help" @mouseenter="visible = true" @mouseleave="visible = false">
    <button type="button" class="help__button" :aria-describedby="hintId" :aria-expanded="visible" aria-label="Ayuda"
            @focus="visible = true" @blur="visible = false" @click.prevent="visible = !visible" @keydown.esc="visible = false">?</button>
    <span :id="hintId" role="tooltip" class="help__hint" :class="{ 'help__hint--visible': visible }">{{ text }}</span>
  </span>
</template>

<style scoped>
.help {
  position: relative;
  display: inline-flex;
}

.help__button {
  width: 18px;
  height: 18px;
  padding: 0;
  border-radius: 50%;
  border: 1.5px solid var(--fi-soft);
  background: transparent;
  color: var(--fi-muted);
  font: 700 11px/1 var(--fi-font);
  cursor: help;
  display: inline-grid;
  place-items: center;
}

.help__button:hover, .help__button[aria-expanded="true"] {
  background: var(--fi-primary);
  border-color: var(--fi-primary);
  color: #fff;
}

.help__hint {
  position: absolute;
  z-index: 40;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: min(270px, 70vw);
  padding: .55rem .75rem;
  border-radius: 8px;
  background: #1e293b;
  color: #fff;
  font-size: .8rem;
  font-weight: 400;
  line-height: 1.4;
  visibility: hidden;
  opacity: 0;
  transition: opacity .12s;
  pointer-events: none;
}

.help__hint--visible {
  visibility: visible;
  opacity: 1;
}
</style>

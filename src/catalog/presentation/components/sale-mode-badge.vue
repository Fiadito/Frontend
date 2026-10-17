<script setup>
import {saleModeLabels} from '@/catalog/domain/model/sale-mode.js';

/**
 * Badge of the sale mode of a product.
 */
defineProps({mode: {type: String, required: true}});
const tones = {AMBAS: 'info', CUOTAS: 'violet', PAGO_UNICO: 'warn'};
</script>

<template>
  <span class="fi-badge" :class="`fi-badge--${tones[mode] ?? 'info'}`">{{ saleModeLabels[mode] ?? mode }}</span>
</template>

<script setup>
import {computed} from 'vue';

/**
 * Colored status pill: Pendiente, Pagado, En mora, Activo, Inactivo...
 */
const props = defineProps({status: {type: String, required: true}});

const config = {
  PENDIENTE: {label: 'Pendiente', tone: 'warn', icon: 'pi pi-clock'},
  PAGADA: {label: 'Pagado', tone: 'ok', icon: 'pi pi-check'},
  EN_MORA: {label: 'En mora', tone: 'bad', icon: 'pi pi-exclamation-circle'},
  ACTIVO: {label: 'Activo', tone: 'ok', icon: ''},
  INACTIVO: {label: 'Inactivo', tone: 'muted', icon: ''}
};

const item = computed(() => config[props.status] ?? {label: props.status, tone: 'info', icon: ''});
</script>

<template>
  <span class="fi-badge" :class="`fi-badge--${item.tone}`"><i v-if="item.icon" :class="item.icon" aria-hidden="true"></i>{{ item.label }}</span>
</template>

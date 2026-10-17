<script setup>
/**
 * Fiadito logo: the blue checked ledger of the mockups plus the name.
 */
defineProps({size: {type: String, default: 'md'}, light: {type: Boolean, default: false}});
</script>

<template>
  <span class="brand" :class="[`brand--${size}`, { 'brand--light': light }]">
    <svg class="brand__icon" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="4" y="10" width="30" height="34" rx="4" fill="#0b5ed7"/>
      <rect x="12" y="4" width="32" height="34" rx="5" fill="#0d6efd" stroke="#fff" stroke-width="2"/>
      <path d="M19 21l6 6 11-12" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="brand__name">Fiadito</span>
  </span>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: .55rem;
  font-weight: 800;
  color: var(--fi-text);
  letter-spacing: -.02em;
}

.brand--light {
  color: var(--fi-primary);
}

.brand--md .brand__icon {
  width: 34px;
  height: 34px;
}

.brand--md .brand__name {
  font-size: 1.75rem;
}

.brand--lg .brand__icon {
  width: 52px;
  height: 52px;
}

.brand--lg .brand__name {
  font-size: 2.6rem;
}
</style>

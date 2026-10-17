<script setup>
/**
 * Title, subtitle and actions of a screen.
 */
defineProps({title: {type: String, required: true}, subtitle: {type: String, default: ''}});
</script>

<template>
  <header class="page-header">
    <div>
      <slot name="before"/>
      <h1>{{ title }}</h1>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div class="page-header__actions">
      <slot/>
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.page-header__subtitle {
  margin: .25rem 0 0;
  color: var(--fi-muted);
  font-size: 1.02rem;
}

.page-header__actions {
  display: flex;
  gap: .6rem;
  align-items: center;
  flex-wrap: wrap;
}
</style>

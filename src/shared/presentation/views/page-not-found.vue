<script setup>
import BrandMark from '@/shared/presentation/components/brand-mark.vue';
</script>

<template>
  <main class="not-found">
    <brand-mark size="lg"/>
    <h1>Página no encontrada</h1>
    <p class="fi-muted">La dirección que buscas no existe.</p>
    <router-link to="/">Volver al inicio</router-link>
  </main>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: .75rem;
  padding: 1rem;
  text-align: center;
}
</style>

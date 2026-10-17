<script setup>
/**
 * Root component: hosts the router view and the global toast / confirmation services.
 */
</script>

<template>
  <pv-toast position="top-right"/>
  <pv-confirm-dialog/>
  <router-view/>
</template>

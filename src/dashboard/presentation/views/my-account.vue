<script setup>
import {onMounted, ref} from 'vue';
import {useToast} from 'primevue/usetoast';
import {billingStore} from '@/billing/application/billing.store.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import AccountStatementView from '@/dashboard/presentation/components/account-statement-view.vue';

/**
 * Mi estado de cuenta (Figura 11): the member only sees his own data (CP11), read only.
 * GET /socios/me/estado-cuenta uses the idSocio of the JWT.
 */
const toast = useToast();
const statement = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    statement.value = await billingStore.statement();
  } catch (message) {
    toast.add({severity: 'error', summary: 'No se pudo cargar tu estado de cuenta', detail: String(message), life: 6000});
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <page-header title="Mi estado de cuenta" :subtitle="statement?.socio.nombres ?? ''"/>
  <account-statement-view v-if="statement" :statement="statement"/>
  <div v-else-if="loading" class="fi-empty"><i class="pi pi-spin pi-spinner"></i></div>
</template>

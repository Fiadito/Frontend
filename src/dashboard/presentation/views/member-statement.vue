<script setup>
import {onMounted, ref} from 'vue';
import {useToast} from 'primevue/usetoast';
import {billingStore} from '@/billing/application/billing.store.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import AccountStatementView from '@/dashboard/presentation/components/account-statement-view.vue';

/**
 * Plan de pago y estado de cuenta of a member, opened by the business from Socios (GET /socios/{id}/estado-cuenta).
 */
const props = defineProps({memberId: {type: String, required: true}});
const toast = useToast();
const statement = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    statement.value = await billingStore.statement(Number(props.memberId));
  } catch (message) {
    toast.add({severity: 'error', summary: 'No se pudo cargar el estado de cuenta', detail: String(message), life: 6000});
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <page-header title="Estado de cuenta" :subtitle="statement ? `${statement.socio.nombres} · DNI ${statement.socio.dni}` : ''">
    <template #before>
      <router-link :to="{ name: 'members' }" class="back"><i class="pi pi-arrow-left"></i> Socios</router-link>
    </template>
  </page-header>
  <account-statement-view v-if="statement" :statement="statement"/>
  <div v-else-if="loading" class="fi-empty"><i class="pi pi-spin pi-spinner"></i></div>
  <div v-else class="fi-empty"><i class="pi pi-user"></i><strong>No se encontró el socio</strong></div>
</template>

<style scoped>
.back {
  display: inline-flex;
  gap: .4rem;
  align-items: center;
  color: var(--fi-muted);
  text-decoration: none;
  margin-bottom: .3rem;
}
</style>

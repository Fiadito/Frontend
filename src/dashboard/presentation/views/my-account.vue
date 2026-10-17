<script setup>
import {onMounted, ref} from 'vue';
import {useToast} from 'primevue/usetoast';
import {iamStore} from '@/iam/application/iam.store.js';
import {membershipStore} from '@/membership/application/membership.store.js';
import {catalogStore} from '@/catalog/application/catalog.store.js';
import {creditStore} from '@/credit/application/credit.store.js';
import {billingStore} from '@/billing/application/billing.store.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import AccountStatementView from '@/dashboard/presentation/components/account-statement-view.vue';

/**
 * Mi estado de cuenta (Figura 11): the member only sees his own data (CP11), read only.
 * Every query is filtered by his idSocio, as GET /socios/me/estado-cuenta will do in the backend.
 */
const toast = useToast();
const member = ref(null);
const loading = ref(true);

onMounted(async () => {
  const user = iamStore.currentUser;
  try {
    const [loaded] = await Promise.all([
      membershipStore.loadOne(user.memberId),
      catalogStore.load(user.businessId),
      creditStore.load({idSocio: user.memberId}),
      billingStore.load({idSocio: user.memberId})
    ]);
    member.value = loaded;
  } catch (message) {
    toast.add({severity: 'error', summary: 'No se pudo cargar tu estado de cuenta', detail: String(message), life: 6000});
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <page-header title="Mi estado de cuenta" :subtitle="member?.fullName ?? ''"/>
  <account-statement-view v-if="member" :member="member"/>
  <div v-else-if="loading" class="fi-empty"><i class="pi pi-spin pi-spinner"></i></div>
</template>

<script setup>
import {computed, onMounted} from 'vue';
import {membershipStore} from '@/membership/application/membership.store.js';
import {useBusinessData} from '@/dashboard/application/use-business-data.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import AccountStatementView from '@/dashboard/presentation/components/account-statement-view.vue';

/**
 * Plan de pago y estado de cuenta of a member, opened by the business from Socios.
 */
const props = defineProps({memberId: {type: String, required: true}});
const {loading, reload} = useBusinessData();
const member = computed(() => membershipStore.findById(props.memberId) ?? null);

onMounted(reload);
</script>

<template>
  <page-header title="Estado de cuenta" :subtitle="member ? `${member.fullName} · DNI ${member.dni}` : ''">
    <template #before>
      <router-link :to="{ name: 'members' }" class="back"><i class="pi pi-arrow-left"></i> Socios</router-link>
    </template>
  </page-header>
  <account-statement-view v-if="member" :member="member"/>
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

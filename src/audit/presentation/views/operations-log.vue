<script setup>
import {computed, onMounted, ref} from 'vue';
import {auditStore} from '@/audit/application/audit.store.js';
import {operationActions} from '@/audit/domain/model/operation-log.entity.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';

/**
 * Bitácora (CP12): every operation of the business with user, date and time.
 */
const {formatDateTime} = useFormatting();
const action = ref('TODAS');
const actionOptions = [{label: 'Todas las acciones', value: 'TODAS'}, ...operationActions.map(value => ({label: value, value}))];
const tones = {LOGIN: 'info', LOGIN_FALLIDO: 'bad', LOGOUT: 'muted', REGISTRAR: 'ok', EDITAR: 'violet', VENDER: 'info', PAGAR: 'ok', CONSULTAR: 'muted'};

const filtered = computed(() => auditStore.operations.filter(item => action.value === 'TODAS' || item.action === action.value));

onMounted(() => auditStore.load());
</script>

<template>
  <section class="fi-card">
    <page-header title="Bitácora" subtitle="Registro de las operaciones realizadas en Fiadito: quién hizo qué y cuándo.">
      <pv-select v-model="action" :options="actionOptions" option-label="label" option-value="value" aria-label="Filtrar por acción"/>
      <pv-button icon="pi pi-refresh" severity="secondary" outlined aria-label="Actualizar" @click="auditStore.load()"/>
    </page-header>
    <pv-message v-if="auditStore.errors.length" severity="error" :closable="false">{{ auditStore.errors[0] }}</pv-message>
    <pv-data-table :value="filtered" data-key="id" :loading="auditStore.loading" paginator :rows="15" size="small" scrollable>
      <template #empty><div class="fi-empty"><i class="pi pi-history"></i><span>No hay operaciones registradas.</span></div></template>
      <pv-column header="Fecha y hora">
        <template #body="{ data }"><span class="fi-money">{{ formatDateTime(data.occurredAt) }}</span></template>
      </pv-column>
      <pv-column field="userName" header="Usuario"/>
      <pv-column header="Acción">
        <template #body="{ data }"><span class="fi-badge" :class="`fi-badge--${tones[data.action] ?? 'info'}`">{{ data.action }}</span></template>
      </pv-column>
      <pv-column field="entity" header="Entidad"/>
      <pv-column field="recordId" header="ID registro"/>
      <pv-column field="detail" header="Detalle"/>
      <pv-column field="ip" header="IP"/>
    </pv-data-table>
  </section>
</template>

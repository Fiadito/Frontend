<script setup>
import {computed, onMounted, ref} from 'vue';
import {useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {billingStore} from '@/billing/application/billing.store.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import StatCard from '@/shared/presentation/components/stat-card.vue';
import StatusBadge from '@/shared/presentation/components/status-badge.vue';

/**
 * Panel (Figura 3): summary of the credits and the payment plan of the current credits
 * (n_cuota, fecha_vencimiento, saldo_inicial, amortizacion, cuota, saldo_final), from GET /panel.
 */
const router = useRouter();
const toast = useToast();
const {formatMoney, formatDate, formatShortDate} = useFormatting();
const loading = ref(false);
const panel = ref(null);
const view = ref('PENDIENTES');
const viewOptions = [{label: 'Por cobrar', value: 'PENDIENTES'}, {label: 'Todo el plan', value: 'TODAS'}];

const rows = computed(() => (panel.value?.plan ?? []).filter(item => view.value === 'TODAS' || item.estado !== 'PAGADA'));
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

onMounted(async () => {
  loading.value = true;
  try {
    panel.value = await billingStore.panel();
  } catch (message) {
    toast.add({severity: 'error', summary: 'No se pudo cargar el panel', detail: String(message), life: 6000});
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <page-header title="Panel" subtitle="Resumen de créditos y plan de pagos de los créditos vigentes">
    <pv-button label="Registrar venta" icon="pi pi-shopping-cart" @click="router.push({ name: 'sale-registration' })"/>
  </page-header>

  <div class="fi-grid fi-grid--4 stats">
    <stat-card icon="pi pi-wallet" label="Total por cobrar" :value="formatMoney(panel?.totalPorCobrar ?? 0)" value-tone="primary"
               :note="`En ${plural(panel?.creditosVigentes ?? 0, 'crédito')} vigente${(panel?.creditosVigentes ?? 0) === 1 ? '' : 's'}`"/>
    <stat-card icon="pi pi-exclamation-circle" tone="bad" label="Monto vencido" :value="formatMoney(panel?.montoVencido ?? 0)" value-tone="bad"
               :note="panel?.obligacionesVencidas ? `${plural(panel.obligacionesVencidas, 'obligación')} vencida(s), sin contar la mora` : 'No hay cuotas vencidas'"/>
    <stat-card icon="pi pi-calendar" tone="ok" label="Próximo pago" :value="panel?.proximoPago ? formatDate(panel.proximoPago.fecha) : '—'" value-tone="primary"
               :note="panel?.proximoPago ? `${formatMoney(panel.proximoPago.monto)} · ${panel.proximoPago.cantidad} pago(s) programado(s)` : 'Sin pagos programados'"/>
    <stat-card icon="pi pi-users" tone="violet" label="Socios en mora" :value="String(panel?.sociosEnMora ?? 0)"
               :note="`De ${panel?.sociosConCredito ?? 0} socio(s) con crédito`"/>
  </div>

  <section class="fi-card">
    <div class="fi-card__header">
      <div>
        <h2>Plan de pagos de los créditos vigentes</h2>
        <p class="fi-soft"><i class="pi pi-info-circle"></i> Fechas de pago: 15 y 30 (o último día del mes)</p>
      </div>
      <pv-select-button v-model="view" :options="viewOptions" option-label="label" option-value="value" :allow-empty="false"/>
    </div>
    <pv-data-table :value="rows" data-key="clave" :loading="loading" paginator :rows="10" size="small" scrollable>
      <template #empty>
        <div class="fi-empty"><i class="pi pi-check-circle"></i><strong>No hay pagos pendientes</strong><span>Las ventas en cuotas y a pago único aparecerán aquí.</span></div>
      </template>
      <pv-column header="Fecha de pago">
        <template #body="{ data }">{{ formatDate(data.fechaVencimiento) }}</template>
      </pv-column>
      <pv-column header="Socio" field="nombreSocio"/>
      <pv-column header="Venta / cuota">
        <template #body="{ data }">{{ data.producto }} · compra {{ formatShortDate(data.fechaHoraCompra) }} · <strong>{{ data.concepto }}</strong></template>
      </pv-column>
      <pv-column header="Saldo inicial" body-class="fi-table-number" header-class="fi-table-number">
        <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.saldoInicial) }}</span></template>
      </pv-column>
      <pv-column header="Amortización" body-class="fi-table-number" header-class="fi-table-number">
        <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.amortizacion) }}</span></template>
      </pv-column>
      <pv-column header="Cuota" body-class="fi-table-number" header-class="fi-table-number">
        <template #body="{ data }"><strong class="fi-money">{{ formatMoney(data.monto) }}</strong></template>
      </pv-column>
      <pv-column header="Saldo final" body-class="fi-table-number" header-class="fi-table-number">
        <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.saldoFinal) }}</span></template>
      </pv-column>
      <pv-column header="Estado">
        <template #body="{ data }"><status-badge :status="data.estado"/></template>
      </pv-column>
    </pv-data-table>
  </section>
</template>

<style scoped>
.stats {
  margin-bottom: 1.25rem;
}

.fi-card__header p {
  margin: .2rem 0 0;
}
</style>

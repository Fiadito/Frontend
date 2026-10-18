<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useToast} from 'primevue/usetoast';
import {billingStore} from '@/billing/application/billing.store.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import StatCard from '@/shared/presentation/components/stat-card.vue';
import StatusBadge from '@/shared/presentation/components/status-badge.vue';
import FieldHelp from '@/shared/presentation/components/field-help.vue';

/**
 * Reporte de corte (Figura 9, module 7.8): per member, the single-payment purchases and the
 * installments due on the payment date that follows the cut-off (GET /reportes/corte).
 */
const toast = useToast();
const {formatMoney, formatDate, formatDateTime} = useFormatting();

const options = ref([]);
const selected = ref(null);
const report = ref(null);
const loading = ref(false);

const cutoffOptions = computed(() => options.value.map(option => ({
  label: `${formatDate(option.fechaCorte)} → paga ${formatDate(option.fechaPago)}`, value: option.fechaCorte
})));
const groups = computed(() => report.value?.grupos ?? []);

const load = async () => {
  if (!selected.value) return;
  loading.value = true;
  try {
    report.value = await billingStore.cutoffReport(selected.value);
  } catch (message) {
    toast.add({severity: 'error', summary: 'No se pudo generar el reporte', detail: String(message), life: 6000});
  } finally {
    loading.value = false;
  }
};

watch(selected, load);
onMounted(async () => {
  try {
    options.value = await billingStore.cutoffOptions();
    selected.value = options.value.find(option => option.actual)?.fechaCorte ?? options.value[0]?.fechaCorte ?? null;
  } catch (message) {
    toast.add({severity: 'error', summary: 'No se pudieron cargar los cortes', detail: String(message), life: 6000});
  }
});
</script>

<template>
  <div class="head">
    <page-header title="Reporte de corte" subtitle="Consulta las compras y cuotas de cada corte y el monto que debe pagarse."/>
    <div class="deadline">
      <span class="deadline__icon"><i class="pi pi-calendar"></i></span>
      <div>
        <p>Paga hasta el</p>
        <strong>{{ report ? formatDate(report.fechaPago) : '—' }}</strong>
        <small>Después se cobra interés moratorio por día de atraso.</small>
      </div>
    </div>
  </div>

  <section class="fi-card selector">
    <div class="fi-field">
      <label for="cutoff">Fecha de corte <field-help text="Los cortes son los días 10 y 25 a las 23:59. El corte del 10 se paga el 15 y el del 25, el 30 (o el último día del mes)."/></label>
      <pv-select input-id="cutoff" v-model="selected" :options="cutoffOptions" option-label="label" option-value="value"/>
    </div>
    <span v-if="report?.preliminar" class="fi-badge fi-badge--warn"><i class="pi pi-info-circle"></i>Corte aún abierto: reporte preliminar</span>
  </section>

  <div class="fi-grid fi-grid--3 stats">
    <stat-card icon="pi pi-calendar" label="Fecha de corte" :value="report ? formatDate(report.fechaCorte) : '—'" note="Hasta las 23:59"/>
    <stat-card icon="pi pi-file" label="Total del corte" :value="formatMoney(report?.total ?? 0)" value-tone="primary"/>
    <stat-card icon="pi pi-users" label="Socios / ítems en el corte" :value="`${groups.length} / ${report?.cantidadItems ?? 0}`" note="Compras a pago único y cuotas"/>
  </div>

  <section class="fi-card">
    <h2 class="mb">Detalle por socio</h2>
    <div v-if="loading" class="fi-empty"><i class="pi pi-spin pi-spinner"></i></div>
    <div v-else-if="groups.length === 0" class="fi-empty">
      <i class="pi pi-inbox"></i><strong>No hay pagos en este corte</strong><span>Ninguna compra ni cuota vence el {{ report ? formatDate(report.fechaPago) : '—' }}.</span>
    </div>
    <article v-for="group in groups" :key="group.idSocio" class="group">
      <header class="group__header">
        <div>
          <strong>{{ group.nombres }}</strong>
          <span class="fi-soft"> · DNI {{ group.dni }}</span>
        </div>
        <span>Total a pagar: <strong class="fi-money">{{ formatMoney(group.total, group.moneda) }}</strong></span>
      </header>
      <pv-data-table :value="group.items" data-key="clave" size="small" scrollable>
        <pv-column header="Fecha de compra">
          <template #body="{ data }">{{ formatDateTime(data.fechaHoraCompra) }}</template>
        </pv-column>
        <pv-column header="Producto">
          <template #body="{ data }">{{ data.producto }} <span class="fi-soft">× {{ data.cantidad }}</span></template>
        </pv-column>
        <pv-column header="Concepto">
          <template #body="{ data }">{{ data.concepto }}</template>
        </pv-column>
        <pv-column header="Monto de la compra" body-class="fi-table-number" header-class="fi-table-number">
          <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.montoCompra, group.moneda) }}</span></template>
        </pv-column>
        <pv-column header="A pagar" body-class="fi-table-number" header-class="fi-table-number">
          <template #body="{ data }"><strong class="fi-money">{{ formatMoney(data.monto, group.moneda) }}</strong></template>
        </pv-column>
        <pv-column header="Estado">
          <template #body="{ data }"><status-badge :status="data.estado"/></template>
        </pv-column>
      </pv-data-table>
    </article>

    <div v-if="groups.length" class="total">
      <span class="total__icon"><i class="pi pi-database"></i></span>
      <div>
        <p>Total a pagar en este corte</p>
        <strong>{{ formatMoney(report.total) }}</strong>
      </div>
      <dl>
        <template v-for="group in groups" :key="group.idSocio">
          <dt>{{ group.nombres }} ({{ group.items.length }} ítem{{ group.items.length === 1 ? '' : 's' }})</dt>
          <dd class="fi-money">{{ formatMoney(group.total, group.moneda) }}</dd>
        </template>
        <dt class="total__sum">Total del corte</dt>
        <dd class="total__sum fi-money">{{ formatMoney(report.total) }}</dd>
      </dl>
    </div>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.deadline {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--fi-primary-soft);
  border-radius: var(--fi-radius);
  padding: 1rem 1.4rem;
  margin-bottom: 1.25rem;
}

.deadline__icon, .total__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #cfe0ff;
  color: var(--fi-primary);
  display: grid;
  place-items: center;
  font-size: 1.5rem;
}

.deadline p, .total p {
  margin: 0;
}

.deadline strong {
  display: block;
  font-size: 2rem;
  color: var(--fi-primary);
}

.deadline small {
  color: var(--fi-muted);
}

.selector {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.selector .fi-field {
  width: min(100%, 360px);
}

.stats {
  margin-bottom: 1.25rem;
}

.mb {
  margin-bottom: 1rem;
}

.group {
  border: 1px solid var(--fi-line);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.group__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: .8rem 1rem;
  background: #fff;
  border-bottom: 1px solid var(--fi-line);
}

.total {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: 1.2rem 1.5rem;
  background: var(--fi-primary-surface);
  border-radius: 12px;
  padding: 1.2rem 1.5rem;
}

.total strong {
  font-size: 2.2rem;
  color: var(--fi-primary);
}

.total dl {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: .4rem 1rem;
  margin: 0;
  padding-left: 1.5rem;
  border-left: 1px solid #cfe0ff;
}

.total dd {
  margin: 0;
  text-align: right;
}

.total__sum {
  font-weight: 700;
}

@media (max-width: 800px) {
  .total {
    grid-template-columns: auto 1fr;
  }

  .total dl {
    grid-column: 1 / -1;
    padding-left: 0;
    border-left: 0;
  }
}
</style>

<script setup>
import {computed, ref, watch} from 'vue';
import {paymentMethodLabel} from '@/billing/domain/model/payment-method.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import StatCard from '@/shared/presentation/components/stat-card.vue';
import StatusBadge from '@/shared/presentation/components/status-badge.vue';
import ScheduleTable from '@/credit/presentation/components/schedule-table.vue';

/**
 * Account statement of a member (Figura 11, module 7.10): next payment, debt, credit limit,
 * available credit, agreed late rate, payment plans and payment history. Read only; every amount
 * comes from GET /socios/me/estado-cuenta (or /socios/{id}/estado-cuenta for the business).
 */
const props = defineProps({statement: {type: Object, required: true}});
const {formatMoney, formatDate, formatRate, formatShortDate} = useFormatting();

const member = computed(() => props.statement.socio);
const currency = computed(() => member.value.moneda);
const ratePeriodDays = {TEA: 360, TES: 180, TET: 90, TEM: 30, TEQ: 15};
const sales = computed(() => [...props.statement.ventas]
    .sort((a, b) => Number(a.estado === 'PAGADA') - Number(b.estado === 'PAGADA') || b.fechaHoraCompra.localeCompare(a.fechaHoraCompra)));
const saleOptions = computed(() => sales.value.map(sale => ({
  value: sale.id,
  label: `${sale.producto} × ${sale.cantidad} · ${formatShortDate(sale.fechaHoraCompra)} · ${sale.modalidad === 'CUOTAS' ? `${sale.nCuotas} cuotas` : 'pago único'}${sale.estado === 'PAGADA' ? ' (pagada)' : ''}`
})));
const selectedSaleId = ref(null);
watch(sales, list => {
  if (!list.some(sale => sale.id === selectedSaleId.value)) selectedSaleId.value = list[0]?.id ?? null;
}, {immediate: true});
const selectedSale = computed(() => sales.value.find(sale => sale.id === selectedSaleId.value) ?? null);
const scheduleRows = computed(() => props.statement.obligaciones.filter(item => item.idVenta === selectedSaleId.value).map(item => ({
  number: item.numero, dueDate: item.fechaVencimiento, openingBalance: Number(item.saldoInicial), amortization: Number(item.amortizacion),
  amount: Number(item.monto), closingBalance: Number(item.saldoFinal), status: item.estado
})));
</script>

<template>
  <div class="fi-grid fi-grid--4">
    <stat-card icon="pi pi-calendar" label="Próximo pago" :value="statement.proximoPago ? formatDate(statement.proximoPago.fecha) : 'Sin pagos'">
      <p v-if="statement.proximoPago" class="next">{{ formatMoney(statement.proximoPago.monto, currency) }}</p>
    </stat-card>
    <stat-card icon="pi pi-file" tone="bad" label="Deuda actual" :value="formatMoney(statement.deudaActual, currency)" value-tone="bad"
               :note="statement.moraHoy > 0 ? `Incluye ${formatMoney(statement.moraHoy, currency)} de mora a hoy` : 'Sin mora a la fecha'"/>
    <stat-card icon="pi pi-link" tone="muted" label="Límite de crédito" :value="formatMoney(member.limiteCredito, currency)"/>
    <stat-card icon="pi pi-credit-card" tone="ok" label="Disponible" :value="formatMoney(statement.creditoDisponible, currency)" value-tone="ok"
               note="Límite − deuda vigente"/>
  </div>
  <div class="fi-grid fi-grid--2 rates">
    <stat-card icon="pi pi-percentage" :label="`Tasa moratoria pactada (${member.periodoTasaMora})`" :value="formatRate(member.valorTasaMora)"
               note="Solo se cobra por días de atraso"/>
    <stat-card icon="pi pi-percentage" label="Tasa efectiva diaria moratoria (TED)" :value="formatRate(member.tedMora)"
               :note="`TED = (1 + TEP)^(1/${ratePeriodDays[member.periodoTasaMora]}) − 1`"/>
  </div>

  <section class="fi-card">
    <div class="fi-card__header">
      <h2>Plan de pagos (cuotas quincenales iguales)</h2>
      <pv-select v-if="saleOptions.length > 1" v-model="selectedSaleId" :options="saleOptions" option-label="label" option-value="value"
                 aria-label="Elegir compra" class="sale-select"/>
    </div>
    <template v-if="selectedSale">
      <div class="summary">
        <div><span>Monto de la compra</span><strong>{{ formatMoney(selectedSale.monto, currency) }}</strong></div>
        <div><span>Número de cuotas</span><strong>{{ selectedSale.modalidad === 'CUOTAS' ? selectedSale.nCuotas : '1 (pago único)' }}</strong></div>
        <div><span>Valor de cuota (fijo)</span><strong>{{ formatMoney(selectedSale.cuota, currency) }}</strong></div>
        <div><span>Total a pagar</span><strong>{{ formatMoney(selectedSale.totalAPagar, currency) }}</strong></div>
        <div><span>Frecuencia</span><strong>Quincenal</strong></div>
      </div>
      <schedule-table :rows="scheduleRows" :currency="currency" show-status/>
    </template>
    <div v-else class="fi-empty"><i class="pi pi-calendar"></i><strong>Sin compras al crédito</strong></div>
  </section>

  <div class="fi-grid fi-grid--2 bottom">
    <section class="fi-card">
      <h2 class="mb">Pagos pendientes</h2>
      <pv-data-table :value="statement.pendientes" data-key="obligacion.clave" size="small" scrollable>
        <template #empty><div class="fi-empty"><i class="pi pi-check-circle"></i><span>No tiene pagos pendientes.</span></div></template>
        <pv-column header="Concepto">
          <template #body="{ data }">{{ data.obligacion.concepto }} <span class="fi-soft">· {{ data.obligacion.producto }}</span></template>
        </pv-column>
        <pv-column header="Vence">
          <template #body="{ data }">{{ formatDate(data.obligacion.fechaVencimiento) }}</template>
        </pv-column>
        <pv-column header="Monto" body-class="fi-table-number" header-class="fi-table-number">
          <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.obligacion.monto, currency) }}</span></template>
        </pv-column>
        <pv-column header="Mora a hoy" body-class="fi-table-number" header-class="fi-table-number">
          <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.moraHoy, currency) }}</span></template>
        </pv-column>
        <pv-column header="Estado">
          <template #body="{ data }"><status-badge :status="data.obligacion.estado"/></template>
        </pv-column>
      </pv-data-table>
    </section>
    <section class="fi-card">
      <h2 class="mb">Historial de pagos</h2>
      <pv-data-table :value="statement.pagos" data-key="id" size="small" scrollable>
        <template #empty>
          <div class="fi-empty"><i class="pi pi-file"></i><strong>Aún no hay pagos registrados</strong><span>Los pagos realizados se mostrarán aquí.</span></div>
        </template>
        <pv-column header="Fecha">
          <template #body="{ data }">{{ formatDate(data.fechaPagoReal) }}</template>
        </pv-column>
        <pv-column header="Concepto" field="concepto"/>
        <pv-column header="Mora" body-class="fi-table-number" header-class="fi-table-number">
          <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.interesMora, currency) }}</span></template>
        </pv-column>
        <pv-column header="Monto" body-class="fi-table-number" header-class="fi-table-number">
          <template #body="{ data }"><strong class="fi-money">{{ formatMoney(data.totalPagado, currency) }}</strong></template>
        </pv-column>
        <pv-column header="Medio">
          <template #body="{ data }">{{ paymentMethodLabel(data.medioPago) }}</template>
        </pv-column>
      </pv-data-table>
    </section>
  </div>
</template>

<style scoped>
.next {
  margin: .1rem 0 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--fi-primary);
}

.rates {
  margin: 1rem 0 1.25rem;
}

.sale-select {
  width: min(100%, 460px);
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  background: var(--fi-primary-surface);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}

.summary span {
  display: block;
  color: var(--fi-muted);
  font-size: .85rem;
}

.summary strong {
  font-size: 1.1rem;
}

.bottom {
  margin-top: 1.25rem;
  align-items: start;
}

.bottom .fi-card + .fi-card {
  margin-top: 0;
}

.mb {
  margin-bottom: 1rem;
}
</style>

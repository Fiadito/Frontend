<script setup>
import {computed, ref, watch} from 'vue';
import {paymentMethodLabel} from '@/billing/domain/model/payment-method.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import StatCard from '@/shared/presentation/components/stat-card.vue';
import StatusBadge from '@/shared/presentation/components/status-badge.vue';
import ScheduleTable from '@/credit/presentation/components/schedule-table.vue';
import PaymentPlanDialog from '@/credit/presentation/components/payment-plan-dialog.vue';

/**
 * Account statement of a member (Figura 11, module 7.10): next payment, debt (capital + interest), credit limit,
 * available credit, payment plans with the interest of each installment (and the effective rate of each sale) and
 * payment history. The late interest only appears for overdue obligations (estimated with TEA 60 %; the real late rate
 * is entered when the payment is registered). Every amount comes from GET /socios/me/estado-cuenta (or /socios/{id}/estado-cuenta).
 *
 * @remarks With editable = true (business), the plan can be opened in the payment-plan dialog to change the rate of the sale.
 */
const props = defineProps({statement: {type: Object, required: true}, editable: {type: Boolean, default: false}});
const emit = defineEmits(['changed']);
const {formatMoney, formatDate, formatRate, formatShortDate} = useFormatting();

const member = computed(() => props.statement.socio);
const currency = computed(() => member.value.moneda);
const sales = computed(() => [...props.statement.ventas]
    .sort((a, b) => Number(a.estado === 'PAGADA') - Number(b.estado === 'PAGADA') || b.fechaHoraCompra.localeCompare(a.fechaHoraCompra)));
const saleOptions = computed(() => sales.value.map(sale => ({
  value: sale.id,
  label: `${sale.producto} × ${sale.cantidad} · ${formatShortDate(sale.fechaHoraCompra)} · ${sale.modalidad === 'CUOTAS' ? `${sale.nCuotas} cuotas` : 'pago único'}${sale.estado === 'PAGADA' ? ' (pagada)' : ''}`
})));
const selectedSaleId = ref(null);
const planVisible = ref(false);
watch(sales, list => {
  if (!list.some(sale => sale.id === selectedSaleId.value)) selectedSaleId.value = list[0]?.id ?? null;
}, {immediate: true});
const selectedSale = computed(() => sales.value.find(sale => sale.id === selectedSaleId.value) ?? null);
const scheduleRows = computed(() => props.statement.obligaciones.filter(item => item.idVenta === selectedSaleId.value).map(item => ({
  number: item.numero, dueDate: item.fechaVencimiento, openingBalance: Number(item.saldoInicial), interest: Number(item.interes ?? 0),
  amortization: Number(item.amortizacion), amount: Number(item.monto), closingBalance: Number(item.saldoFinal), status: item.estado
})));
const hasOverdue = computed(() => props.statement.pendientes.some(item => item.diasMora > 0));
</script>

<template>
  <div class="fi-grid fi-grid--4">
    <stat-card icon="pi pi-calendar" label="Próximo pago" :value="statement.proximoPago ? formatDate(statement.proximoPago.fecha) : 'Sin pagos'">
      <p v-if="statement.proximoPago" class="next">{{ formatMoney(statement.proximoPago.monto, currency) }}</p>
    </stat-card>
    <stat-card icon="pi pi-file" tone="bad" label="Deuda actual" :value="formatMoney(statement.deudaActual, currency)" value-tone="bad"
               :note="statement.moraHoy > 0
                 ? `Capital ${formatMoney(statement.deudaCapital, currency)} + interés ${formatMoney(statement.interesPendiente, currency)} + mora estimada ${formatMoney(statement.moraHoy, currency)}`
                 : `Capital ${formatMoney(statement.deudaCapital, currency)} + interés ${formatMoney(statement.interesPendiente, currency)}`"/>
    <stat-card icon="pi pi-link" tone="muted" label="Límite de crédito" :value="formatMoney(member.limiteCredito, currency)"/>
    <stat-card icon="pi pi-credit-card" tone="ok" label="Disponible" :value="formatMoney(statement.creditoDisponible, currency)" value-tone="ok"
               note="Límite − capital pendiente"/>
  </div>

  <section class="fi-card plan">
    <div class="fi-card__header">
      <h2>Plan de pagos (cuotas quincenales con interés)</h2>
      <div class="plan__tools">
        <pv-select v-if="saleOptions.length > 1" v-model="selectedSaleId" :options="saleOptions" option-label="label" option-value="value"
                   aria-label="Elegir compra" class="sale-select"/>
        <pv-button v-if="editable && selectedSale && selectedSale.estado !== 'PAGADA'" label="Cambiar tasa" icon="pi pi-percentage"
                   size="small" variant="outlined" @click="planVisible = true"/>
      </div>
    </div>
    <template v-if="selectedSale">
      <div class="summary">
        <div><span>Monto (capital)</span><strong>{{ formatMoney(selectedSale.monto, currency) }}</strong></div>
        <div><span>Tasa pactada</span><strong>{{ selectedSale.periodoTasa }} {{ formatRate(selectedSale.valorTasa, 2) }}</strong></div>
        <div><span>TEQ de cada cuota</span><strong>{{ formatRate(selectedSale.tasaQuincenal) }}</strong></div>
        <div><span>Número de cuotas</span><strong>{{ selectedSale.modalidad === 'CUOTAS' ? selectedSale.nCuotas : '1 (pago único)' }}</strong></div>
        <div><span>Cuota (fija)</span><strong>{{ formatMoney(selectedSale.cuota, currency) }}</strong></div>
        <div><span>Interés total</span><strong>{{ formatMoney(selectedSale.interesTotal, currency) }}</strong></div>
        <div><span>Total a pagar</span><strong>{{ formatMoney(selectedSale.totalAPagar, currency) }}</strong></div>
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
        <pv-column header="Cuota" body-class="fi-table-number" header-class="fi-table-number">
          <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.obligacion.monto, currency) }}</span></template>
        </pv-column>
        <pv-column v-if="hasOverdue" header="Mora estimada" body-class="fi-table-number" header-class="fi-table-number">
          <template #body="{ data }">
            <span v-if="data.diasMora > 0" class="fi-money" v-tooltip.top="`${data.diasMora} día(s) de atraso, estimada con TEA 60 %`">{{ formatMoney(data.moraHoy, currency) }}</span>
            <span v-else class="fi-soft">—</span>
          </template>
        </pv-column>
        <pv-column header="Estado">
          <template #body="{ data }"><status-badge :status="data.obligacion.estado"/></template>
        </pv-column>
      </pv-data-table>
      <p v-if="hasOverdue" class="fi-muted note">La mora solo aparece en lo vencido. Se estima con TEA 60 %; la tasa real se coloca al registrar el pago.</p>
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
        <pv-column header="Interés" body-class="fi-table-number" header-class="fi-table-number">
          <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.imputacionInteres, currency) }}</span></template>
        </pv-column>
        <pv-column header="Mora" body-class="fi-table-number" header-class="fi-table-number">
          <template #body="{ data }">
            <span v-if="data.diasMora > 0" class="fi-money">{{ formatMoney(data.interesMora, currency) }}</span>
            <span v-else class="fi-soft">—</span>
          </template>
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

  <payment-plan-dialog v-if="editable" v-model:visible="planVisible" :sale-id="selectedSale?.id ?? null" :currency="currency"
                       @changed="emit('changed')"/>
</template>

<style scoped>
.next {
  margin: .1rem 0 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--fi-primary);
}

.plan {
  margin-top: 1.25rem;
}

.plan__tools {
  display: flex;
  gap: .5rem;
  align-items: center;
  flex-wrap: wrap;
}

.sale-select {
  width: min(100%, 460px);
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
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

.note {
  margin: .6rem 0 0;
  font-size: .82rem;
}

.mb {
  margin-bottom: 1rem;
}
</style>

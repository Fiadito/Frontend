<script setup>
import {computed, ref, watch} from 'vue';
import {catalogStore} from '@/catalog/application/catalog.store.js';
import {creditStore} from '@/credit/application/credit.store.js';
import {billingStore} from '@/billing/application/billing.store.js';
import {paymentMethodLabel} from '@/billing/domain/model/payment-method.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import StatCard from '@/shared/presentation/components/stat-card.vue';
import StatusBadge from '@/shared/presentation/components/status-badge.vue';
import ScheduleTable from '@/credit/presentation/components/schedule-table.vue';

/**
 * Account statement of a member (Figura 11, module 7.10): next payment, debt, credit limit,
 * available credit, agreed late rate, payment plans and payment history. Read only.
 */
const props = defineProps({member: {type: Object, required: true}});
const {formatMoney, formatDate, formatRate, formatShortDate} = useFormatting();

const statement = computed(() => billingStore.statementOf(props.member));
const currency = computed(() => props.member.currency);
const sales = computed(() => creditStore.sales.filter(sale => sale.memberId === props.member.id)
    .sort((a, b) => Number(a.isPaid) - Number(b.isPaid) || b.purchaseDateTime.localeCompare(a.purchaseDateTime)));
const productName = id => {
  const product = catalogStore.findById(id);
  return product ? `${product.brand} ${product.description}` : `Producto ${id}`;
};
const saleOptions = computed(() => sales.value.map(sale => ({
  value: sale.id,
  label: `${productName(sale.productId)} × ${sale.quantity} · ${formatShortDate(sale.purchaseDate)} · ${sale.isInInstallments ? `${sale.installmentCount} cuotas` : 'pago único'}${sale.isPaid ? ' (pagada)' : ''}`
})));
const selectedSaleId = ref(null);
watch(sales, list => {
  if (!list.some(sale => sale.id === selectedSaleId.value)) selectedSaleId.value = list[0]?.id ?? null;
}, {immediate: true});
const selectedSale = computed(() => sales.value.find(sale => sale.id === selectedSaleId.value) ?? null);
const scheduleRows = computed(() => {
  const sale = selectedSale.value;
  if (!sale) return [];
  const obligations = statement.value.obligations.filter(item => item.sale.id === sale.id);
  return obligations.map(item => {
    const row = item.installment ?? {number: 1, dueDate: item.dueDate, openingBalance: item.amount, amortization: item.amount, amount: item.amount, closingBalance: 0};
    return {number: row.number, dueDate: row.dueDate, openingBalance: row.openingBalance, amortization: row.amortization, amount: row.amount,
      closingBalance: row.closingBalance, status: item.statusOn(statement.value.today)};
  });
});

const payments = computed(() => billingStore.payments.filter(payment => payment.memberId === props.member.id)
    .sort((a, b) => b.paymentDate.compareTo(a.paymentDate))
    .map(payment => ({
      payment,
      label: statement.value.obligations.find(item => (payment.installmentId ? item.installment?.id === payment.installmentId : item.sale.id === payment.saleId && !item.installment))?.label ?? ''
    })));
</script>

<template>
  <div class="fi-grid fi-grid--4">
    <stat-card icon="pi pi-calendar" label="Próximo pago" :value="statement.nextPayment ? formatDate(statement.nextPayment.date) : 'Sin pagos'">
      <p v-if="statement.nextPayment" class="next">{{ formatMoney(statement.nextPayment.amount, currency) }}</p>
    </stat-card>
    <stat-card icon="pi pi-file" tone="bad" label="Deuda actual" :value="formatMoney(statement.debtToday, currency)" value-tone="bad"
               :note="statement.lateInterestToday > 0 ? `Incluye ${formatMoney(statement.lateInterestToday, currency)} de mora a hoy` : 'Sin mora a la fecha'"/>
    <stat-card icon="pi pi-link" tone="muted" label="Límite de crédito" :value="formatMoney(member.creditLimit, currency)"/>
    <stat-card icon="pi pi-credit-card" tone="ok" label="Disponible" :value="formatMoney(statement.availableCredit, currency)" value-tone="ok"
               note="Límite − deuda vigente"/>
  </div>
  <div class="fi-grid fi-grid--2 rates">
    <stat-card icon="pi pi-percentage" :label="`Tasa moratoria pactada (${member.lateRatePeriod})`" :value="formatRate(member.lateRateValue)"
               note="Solo se cobra por días de atraso"/>
    <stat-card icon="pi pi-percentage" label="Tasa efectiva diaria moratoria (TED)" :value="formatRate(member.lateRate.toDaily())"
               :note="`TED = (1 + TEP)^(1/${member.lateRate.days}) − 1`"/>
  </div>

  <section class="fi-card">
    <div class="fi-card__header">
      <h2>Plan de pagos (cuotas quincenales iguales)</h2>
      <pv-select v-if="saleOptions.length > 1" v-model="selectedSaleId" :options="saleOptions" option-label="label" option-value="value"
                 aria-label="Elegir compra" class="sale-select"/>
    </div>
    <template v-if="selectedSale">
      <div class="summary">
        <div><span>Monto de la compra</span><strong>{{ formatMoney(selectedSale.amount, currency) }}</strong></div>
        <div><span>Número de cuotas</span><strong>{{ selectedSale.isInInstallments ? selectedSale.installmentCount : '1 (pago único)' }}</strong></div>
        <div><span>Valor de cuota (fijo)</span><strong>{{ formatMoney(selectedSale.installmentAmount, currency) }}</strong></div>
        <div><span>Total a pagar</span><strong>{{ formatMoney(selectedSale.totalToPay, currency) }}</strong></div>
        <div><span>Frecuencia</span><strong>Quincenal</strong></div>
      </div>
      <schedule-table :rows="scheduleRows" :currency="currency" show-status/>
    </template>
    <div v-else class="fi-empty"><i class="pi pi-calendar"></i><strong>Sin compras al crédito</strong></div>
  </section>

  <div class="fi-grid fi-grid--2 bottom">
    <section class="fi-card">
      <h2 class="mb">Pagos pendientes</h2>
      <pv-data-table :value="statement.pending" data-key="obligation.key" size="small" scrollable>
        <template #empty><div class="fi-empty"><i class="pi pi-check-circle"></i><span>No tiene pagos pendientes.</span></div></template>
        <pv-column header="Concepto">
          <template #body="{ data }">{{ data.obligation.label }} <span class="fi-soft">· {{ productName(data.obligation.sale.productId) }}</span></template>
        </pv-column>
        <pv-column header="Vence">
          <template #body="{ data }">{{ formatDate(data.obligation.dueDate) }}</template>
        </pv-column>
        <pv-column header="Monto" body-class="fi-table-number" header-class="fi-table-number">
          <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.obligation.amount, currency) }}</span></template>
        </pv-column>
        <pv-column header="Mora a hoy" body-class="fi-table-number" header-class="fi-table-number">
          <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.lateInterestToday, currency) }}</span></template>
        </pv-column>
        <pv-column header="Estado">
          <template #body="{ data }"><status-badge :status="data.status"/></template>
        </pv-column>
      </pv-data-table>
    </section>
    <section class="fi-card">
      <h2 class="mb">Historial de pagos</h2>
      <pv-data-table :value="payments" data-key="payment.id" size="small" scrollable>
        <template #empty>
          <div class="fi-empty"><i class="pi pi-file"></i><strong>Aún no hay pagos registrados</strong><span>Los pagos realizados se mostrarán aquí.</span></div>
        </template>
        <pv-column header="Fecha">
          <template #body="{ data }">{{ formatDate(data.payment.paymentDate) }}</template>
        </pv-column>
        <pv-column header="Concepto" field="label"/>
        <pv-column header="Mora" body-class="fi-table-number" header-class="fi-table-number">
          <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.payment.lateInterest, currency) }}</span></template>
        </pv-column>
        <pv-column header="Monto" body-class="fi-table-number" header-class="fi-table-number">
          <template #body="{ data }"><strong class="fi-money">{{ formatMoney(data.payment.totalPaid, currency) }}</strong></template>
        </pv-column>
        <pv-column header="Medio">
          <template #body="{ data }">{{ paymentMethodLabel(data.payment.method) }}</template>
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

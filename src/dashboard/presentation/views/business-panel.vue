<script setup>
import {computed, onMounted, ref} from 'vue';
import {useRouter} from 'vue-router';
import {membershipStore} from '@/membership/application/membership.store.js';
import {catalogStore} from '@/catalog/application/catalog.store.js';
import {creditStore} from '@/credit/application/credit.store.js';
import {billingStore} from '@/billing/application/billing.store.js';
import {useBusinessData} from '@/dashboard/application/use-business-data.js';
import {ObligationStatus} from '@/billing/domain/model/obligation.js';
import {roundMoney} from '@/shared/domain/model/rounding.js';
import {systemClock} from '@/shared/domain/model/system-clock.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import StatCard from '@/shared/presentation/components/stat-card.vue';
import StatusBadge from '@/shared/presentation/components/status-badge.vue';

/**
 * Panel (Figura 3): summary of the credits and the payment plan of the current credits
 * (n_cuota, fecha_vencimiento, saldo_inicial, amortizacion, cuota, saldo_final).
 */
const router = useRouter();
const {formatMoney, formatDate, formatShortDate} = useFormatting();
const {loading, reload} = useBusinessData();
const today = systemClock.today();
const view = ref('PENDIENTES');
const viewOptions = [{label: 'Por cobrar', value: 'PENDIENTES'}, {label: 'Todo el plan', value: 'TODAS'}];

const currentSales = computed(() => creditStore.sales.filter(sale => !sale.isPaid));
const pending = computed(() => billingStore.obligations.filter(item => !item.isPaid));
const overdue = computed(() => pending.value.filter(item => item.statusOn(today) === ObligationStatus.OVERDUE));
const nextPayment = computed(() => {
  const upcoming = pending.value.filter(item => item.dueDate.compareTo(today) >= 0);
  if (!upcoming.length) return null;
  const date = upcoming[0].dueDate;
  const items = upcoming.filter(item => item.dueDate.compareTo(date) === 0);
  return {date, amount: roundMoney(items.reduce((sum, item) => sum + item.amount, 0)), count: items.length};
});
const membersWithCredit = computed(() => new Set(pending.value.map(item => item.memberId)).size);
const membersOverdue = computed(() => new Set(overdue.value.map(item => item.memberId)).size);

const rows = computed(() => {
  const source = view.value === 'PENDIENTES' ? pending.value : billingStore.obligations.filter(item => !item.sale.isPaid);
  return source.map(item => {
    const product = catalogStore.findById(item.sale.productId);
    const plan = item.installment ?? {openingBalance: item.amount, amortization: item.amount, amount: item.amount, closingBalance: 0};
    return {
      key: item.key, obligation: item, member: membershipStore.findById(item.memberId),
      sale: `${product ? product.description : 'Producto'} · compra ${formatShortDate(item.sale.purchaseDate)}`,
      openingBalance: plan.openingBalance, amortization: plan.amortization, amount: plan.amount, closingBalance: plan.closingBalance,
      status: item.statusOn(today)
    };
  });
});

onMounted(reload);
</script>

<template>
  <page-header title="Panel" subtitle="Resumen de créditos y plan de pagos de los créditos vigentes">
    <pv-button label="Registrar venta" icon="pi pi-shopping-cart" @click="router.push({ name: 'sale-registration' })"/>
  </page-header>

  <div class="fi-grid fi-grid--4 stats">
    <stat-card icon="pi pi-wallet" label="Total por cobrar" :value="formatMoney(pending.reduce((s, i) => s + i.amount, 0))" value-tone="primary"
               :note="`En ${currentSales.length} crédito${currentSales.length === 1 ? '' : 's'} vigente${currentSales.length === 1 ? '' : 's'}`"/>
    <stat-card icon="pi pi-exclamation-circle" tone="bad" label="Monto vencido" :value="formatMoney(overdue.reduce((s, i) => s + i.amount, 0))" value-tone="bad"
               :note="overdue.length ? `${overdue.length} obligación(es) vencida(s), sin contar la mora` : 'No hay cuotas vencidas'"/>
    <stat-card icon="pi pi-calendar" tone="ok" label="Próximo pago" :value="nextPayment ? formatDate(nextPayment.date) : '—'" value-tone="primary"
               :note="nextPayment ? `${formatMoney(nextPayment.amount)} · ${nextPayment.count} pago(s) programado(s)` : 'Sin pagos programados'"/>
    <stat-card icon="pi pi-users" tone="violet" label="Socios en mora" :value="String(membersOverdue)" :note="`De ${membersWithCredit} socio(s) con crédito`"/>
  </div>

  <section class="fi-card">
    <div class="fi-card__header">
      <div>
        <h2>Plan de pagos de los créditos vigentes</h2>
        <p class="fi-soft"><i class="pi pi-info-circle"></i> Fechas de pago: 15 y 30 (o último día del mes)</p>
      </div>
      <pv-select-button v-model="view" :options="viewOptions" option-label="label" option-value="value" :allow-empty="false"/>
    </div>
    <pv-data-table :value="rows" data-key="key" :loading="loading" paginator :rows="10" size="small" scrollable>
      <template #empty>
        <div class="fi-empty"><i class="pi pi-check-circle"></i><strong>No hay pagos pendientes</strong><span>Las ventas en cuotas y a pago único aparecerán aquí.</span></div>
      </template>
      <pv-column header="Fecha de pago">
        <template #body="{ data }">{{ formatDate(data.obligation.dueDate) }}</template>
      </pv-column>
      <pv-column header="Socio">
        <template #body="{ data }">{{ data.member?.fullName }}</template>
      </pv-column>
      <pv-column header="Venta / cuota">
        <template #body="{ data }">{{ data.sale }} · <strong>{{ data.obligation.label }}</strong></template>
      </pv-column>
      <pv-column header="Saldo inicial" body-class="fi-table-number" header-class="fi-table-number">
        <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.openingBalance) }}</span></template>
      </pv-column>
      <pv-column header="Amortización" body-class="fi-table-number" header-class="fi-table-number">
        <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.amortization) }}</span></template>
      </pv-column>
      <pv-column header="Cuota" body-class="fi-table-number" header-class="fi-table-number">
        <template #body="{ data }"><strong class="fi-money">{{ formatMoney(data.amount) }}</strong></template>
      </pv-column>
      <pv-column header="Saldo final" body-class="fi-table-number" header-class="fi-table-number">
        <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.closingBalance) }}</span></template>
      </pv-column>
      <pv-column header="Estado">
        <template #body="{ data }"><status-badge :status="data.status"/></template>
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

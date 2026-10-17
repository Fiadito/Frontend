<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useToast} from 'primevue/usetoast';
import {membershipStore} from '@/membership/application/membership.store.js';
import {catalogStore} from '@/catalog/application/catalog.store.js';
import {billingStore} from '@/billing/application/billing.store.js';
import {useBusinessData} from '@/dashboard/application/use-business-data.js';
import {paymentMethodLabel, paymentMethods} from '@/billing/domain/model/payment-method.js';
import {CalendarDate} from '@/shared/domain/model/calendar-date.js';
import {systemClock} from '@/shared/domain/model/system-clock.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import FieldHelp from '@/shared/presentation/components/field-help.vue';
import StatusBadge from '@/shared/presentation/components/status-badge.vue';

/**
 * Registrar pago (Figura 10, module 7.9): select a pending obligation, enter the real date and
 * the method, review the total due (with late interest) and how the payment is imputed.
 * Only full payments are accepted (CP10).
 */
const toast = useToast();
const {formatMoney, formatDate, formatRate} = useFormatting();
const {loading, reload} = useBusinessData();
const today = systemClock.today();

const obligationKey = ref(null);
const paymentDate = ref(new Date(today.year, today.month - 1, today.day));
const method = ref('EFECTIVO');
const paid = ref(null);
const saving = ref(false);
const error = ref('');

const productName = id => {
  const product = catalogStore.findById(id);
  return product ? `${product.brand} ${product.description}` : `Producto ${id}`;
};
const memberOf = obligation => membershipStore.findById(obligation.memberId);

const pendingOptions = computed(() => billingStore.obligations.filter(item => !item.isPaid).map(item => ({
  key: item.key,
  label: `${item.code} — ${memberOf(item)?.fullName ?? 'Socio'} — ${productName(item.sale.productId)} — ${item.label} — vence ${formatDate(item.dueDate)}`,
  status: item.statusOn(today)
})));

const obligation = computed(() => billingStore.obligations.find(item => item.key === obligationKey.value) ?? null);
const member = computed(() => (obligation.value ? memberOf(obligation.value) : null));
const dateIso = computed(() => (paymentDate.value ? CalendarDate.from(paymentDate.value).toIsoString() : ''));
const quote = computed(() => (obligation.value && member.value && dateIso.value ? billingStore.quote(obligation.value, member.value, dateIso.value) : null));
const currency = computed(() => member.value?.currency ?? 'PEN');

watch(quote, value => {
  paid.value = value ? value.total : null;
  error.value = '';
});

const history = computed(() => [...billingStore.payments].sort((a, b) => b.paymentDate.compareTo(a.paymentDate) || b.id - a.id).map(payment => {
  const sale = billingStore.obligations.find(item => item.sale.id === payment.saleId)?.sale;
  const label = payment.installmentId ? billingStore.obligations.find(item => item.installment?.id === payment.installmentId)?.label : 'Pago único';
  return {payment, member: membershipStore.findById(payment.memberId), product: sale ? productName(sale.productId) : '', label};
}));

const register = async () => {
  error.value = '';
  if (!obligation.value) {
    error.value = 'Selecciona una obligación pendiente.';
    return;
  }
  saving.value = true;
  try {
    const saved = await billingStore.register({obligation: obligation.value, member: member.value, paymentDate: dateIso.value, method: method.value, paid: paid.value ?? 0});
    toast.add({severity: 'success', summary: 'Pago registrado', detail: `${member.value.fullName}: ${formatMoney(saved.totalPaid, currency.value)}`, life: 4000});
    obligationKey.value = null;
  } catch (message) {
    error.value = String(message);
  } finally {
    saving.value = false;
  }
};

onMounted(reload);
</script>

<template>
  <page-header title="Registrar pago" subtitle="Registra el pago de una obligación pendiente y visualiza su detalle y la imputación del monto."/>

  <section class="fi-card layout">
    <form class="form" novalidate @submit.prevent="register">
      <pv-message v-if="error" severity="error" :closable="false" role="alert">{{ error }}</pv-message>
      <div class="fi-field">
        <label for="obligation">Obligación pendiente <span class="fi-required">*</span>
          <field-help text="Cuota o compra a pago único que aún no se paga. Las vencidas aparecen como “En mora”."/></label>
        <pv-select input-id="obligation" v-model="obligationKey" :options="pendingOptions" option-label="label" option-value="key" filter
                   placeholder="Selecciona una obligación" :loading="loading" empty-message="No hay obligaciones pendientes">
          <template #option="{ option }">
            <span class="option">{{ option.label }} <status-badge :status="option.status"/></span>
          </template>
        </pv-select>
      </div>
      <div class="fi-grid fi-grid--2">
        <div class="fi-field">
          <label for="paymentDate">Fecha real <span class="fi-required">*</span>
            <field-help text="Día en que el socio paga. Si es posterior a la fecha de pago, se cobra interés moratorio por los días de atraso."/></label>
          <pv-date-picker input-id="paymentDate" v-model="paymentDate" date-format="dd/mm/yy" show-icon/>
        </div>
        <div class="fi-field">
          <label for="method">Medio de pago <span class="fi-required">*</span> <field-help text="Efectivo, Yape, Plin o transferencia bancaria."/></label>
          <pv-select input-id="method" v-model="method" :options="paymentMethods" option-label="label" option-value="code"/>
        </div>
        <div class="fi-field">
          <label for="paid">Monto <span class="fi-required">*</span> <field-help text="Debe ser igual al total exigible. No se aceptan pagos parciales."/></label>
          <pv-input-group>
            <pv-input-group-addon>{{ currency === 'USD' ? 'US$' : 'S/' }}</pv-input-group-addon>
            <pv-input-number input-id="paid" v-model="paid" :min-fraction-digits="2" :max-fraction-digits="2" locale="en-US" :min="0"/>
          </pv-input-group>
        </div>
      </div>
      <div>
        <pv-button type="submit" label="Registrar pago" icon="pi pi-check" :loading="saving" :disabled="!obligation"/>
      </div>
    </form>

    <aside class="fi-summary detail" aria-live="polite">
      <h2>Detalle de la obligación</h2>
      <template v-if="quote">
        <dl>
          <dt>Socio</dt>
          <dd>{{ member.fullName }}</dd>
          <dt>Concepto</dt>
          <dd>{{ obligation.label }}</dd>
          <dt>Fecha de pago</dt>
          <dd>{{ formatDate(obligation.dueDate) }}</dd>
          <dt>Pago exigible (D)</dt>
          <dd>{{ formatMoney(quote.amount, currency) }}</dd>
          <dt>Días de mora (dm)</dt>
          <dd>{{ quote.lateDays }} día{{ quote.lateDays === 1 ? '' : 's' }}</dd>
          <dt>Tasa moratoria pactada</dt>
          <dd>{{ member.lateRatePeriod }} {{ formatRate(member.lateRateValue) }}</dd>
          <dt>TED moratoria</dt>
          <dd>{{ formatRate(quote.dailyRate) }}</dd>
          <dt>Intereses por mora</dt>
          <dd>{{ formatMoney(quote.lateInterest, currency) }}</dd>
          <dt class="fi-summary__total">Total exigible</dt>
          <dd class="fi-summary__total">{{ formatMoney(quote.total, currency) }}</dd>
        </dl>
        <p class="fi-formula">Imor = D × ((1 + TED)^dm − 1) = {{ quote.amount.toFixed(2) }} × ((1 + {{ quote.dailyRate.toFixed(7) }})^{{ quote.lateDays }} − 1)</p>
        <h2 class="mt">Imputación del pago</h2>
        <dl>
          <dt>1.º Interés moratorio</dt>
          <dd>{{ formatMoney(quote.lateImputation, currency) }}</dd>
          <dt>2.º Capital</dt>
          <dd>{{ formatMoney(quote.capitalImputation, currency) }}</dd>
          <dt class="fi-summary__total">Total imputado</dt>
          <dd class="fi-summary__total">{{ formatMoney(quote.total, currency) }}</dd>
        </dl>
      </template>
      <p v-else class="fi-muted">Selecciona una obligación para ver el total exigible.</p>
    </aside>
  </section>

  <section class="fi-card">
    <h2 class="mb">Pagos registrados</h2>
    <pv-data-table :value="history" data-key="payment.id" paginator :rows="8" size="small" scrollable :loading="loading">
      <template #empty><div class="fi-empty"><i class="pi pi-credit-card"></i><span>Aún no hay pagos registrados.</span></div></template>
      <pv-column header="Fecha">
        <template #body="{ data }">{{ formatDate(data.payment.paymentDate) }}</template>
      </pv-column>
      <pv-column header="Socio">
        <template #body="{ data }">{{ data.member?.fullName }}</template>
      </pv-column>
      <pv-column header="Obligación">
        <template #body="{ data }">{{ data.product }} · {{ data.label }}</template>
      </pv-column>
      <pv-column header="Días de mora" field="payment.lateDays"/>
      <pv-column header="Mora" body-class="fi-table-number" header-class="fi-table-number">
        <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.payment.lateInterest) }}</span></template>
      </pv-column>
      <pv-column header="Monto" body-class="fi-table-number" header-class="fi-table-number">
        <template #body="{ data }"><strong class="fi-money">{{ formatMoney(data.payment.totalPaid) }}</strong></template>
      </pv-column>
      <pv-column header="Medio de pago">
        <template #body="{ data }">{{ paymentMethodLabel(data.payment.method) }}</template>
      </pv-column>
    </pv-data-table>
  </section>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.option {
  display: inline-flex;
  gap: .5rem;
  align-items: center;
  white-space: normal;
}

.detail h2 {
  font-size: 1.1rem;
  margin-bottom: .7rem;
}

.mt {
  margin-top: 1.2rem;
}

.mb {
  margin-bottom: 1rem;
}

@media (max-width: 1000px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

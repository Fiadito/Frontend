<script setup>
import {computed, onMounted, reactive, ref, watch} from 'vue';
import {useToast} from 'primevue/usetoast';
import {billingStore} from '@/billing/application/billing.store.js';
import {paymentMethodLabel, paymentMethods} from '@/billing/domain/model/payment-method.js';
import {CreditPolicy, lateRateError} from '@/credit/domain/model/credit-policy.js';
import {CalendarDate} from '@/shared/domain/model/calendar-date.js';
import {systemClock} from '@/shared/domain/model/system-clock.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import FieldHelp from '@/shared/presentation/components/field-help.vue';
import StatusBadge from '@/shared/presentation/components/status-badge.vue';
import RateField from '@/shared/presentation/components/rate-field.vue';
import PaymentPlanDialog from '@/credit/presentation/components/payment-plan-dialog.vue';

/**
 * Registrar pago (Figura 10, module 7.9): select a pending obligation, enter the real date and the method, review the
 * total due and how the payment is imputed (late interest → compensatory interest → capital).
 * The late rate is only asked when the obligation is overdue (TEA 60 % by default). The backend computes the quote
 * (POST /pagos/cotizacion), rejects partial payments (CP10) and future dates, and blocks double payments.
 */
const toast = useToast();
const {formatMoney, formatDate, formatRate} = useFormatting();
const today = systemClock.today();
const maxDate = new Date(today.year, today.month - 1, today.day);

const obligationKey = ref(null);
const paymentDate = ref(new Date(today.year, today.month - 1, today.day));
const method = ref('EFECTIVO');
const paid = ref(null);
const saving = ref(false);
const error = ref('');
const quote = ref(null);
const planVisible = ref(false);
const lateRate = reactive({period: CreditPolicy.DEFAULT_LATE_RATE_PERIOD, percent: CreditPolicy.DEFAULT_LATE_RATE * 100});

const loading = computed(() => billingStore.loading);
const pendingOptions = computed(() => billingStore.pending.map(item => ({
  key: item.clave,
  label: `${item.codigo} — ${item.nombreSocio} — ${item.producto} — ${item.concepto} — vence ${formatDate(item.fechaVencimiento)}`,
  status: item.estado
})));
const obligation = computed(() => billingStore.pending.find(item => item.clave === obligationKey.value) ?? null);
const dateIso = computed(() => (paymentDate.value ? CalendarDate.from(paymentDate.value).toIsoString() : ''));
/** Overdue = the real date is after the due date: only then the late rate appears. */
const isLate = computed(() => Boolean(obligation.value && dateIso.value && dateIso.value > obligation.value.fechaVencimiento));
const rateError = computed(() => (isLate.value ? lateRateError(lateRate.period, lateRate.percent === null ? null : lateRate.percent / 100) : null));

let sequence = 0;
watch([obligation, dateIso, () => lateRate.period, () => lateRate.percent], async () => {
  error.value = '';
  quote.value = null;
  paid.value = null;
  if (!obligation.value || !dateIso.value || rateError.value) return;
  const current = ++sequence;
  try {
    const result = await billingStore.quote(obligation.value, dateIso.value, isLate.value ? lateRate : null);
    if (current !== sequence) return;
    quote.value = result;
    paid.value = Number(result.totalExigible);
  } catch (message) {
    if (current === sequence) error.value = String(message);
  }
});

const register = async () => {
  // Guard against double submit (Enter twice or double click): only one request at a time.
  if (saving.value) return;
  error.value = '';
  if (!obligation.value) {
    error.value = 'Selecciona una obligación pendiente.';
    return;
  }
  if (rateError.value) {
    error.value = rateError.value;
    return;
  }
  saving.value = true;
  try {
    const saved = await billingStore.registerPayment({
      obligation: obligation.value, paymentDate: dateIso.value, method: method.value, paid: paid.value ?? 0,
      lateRate: isLate.value ? lateRate : null
    });
    toast.add({severity: 'success', summary: 'Pago registrado', detail: `${saved.nombreSocio}: ${formatMoney(saved.totalPagado)}`, life: 4000});
    obligationKey.value = null;
  } catch (message) {
    error.value = String(message);
  } finally {
    saving.value = false;
  }
};

onMounted(() => billingStore.loadPayments()
    .catch(message => toast.add({severity: 'error', summary: 'No se pudieron cargar los pagos', detail: String(message), life: 6000})));
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
        <div v-if="obligation">
          <pv-button type="button" label="Ver plan de pagos" icon="pi pi-calendar" text size="small" @click="planVisible = true"/>
        </div>
      </div>
      <div class="fi-grid fi-grid--2">
        <div class="fi-field">
          <label for="paymentDate">Fecha real <span class="fi-required">*</span>
            <field-help text="Día en que el socio paga (no puede ser futura). Si es posterior al vencimiento, se cobra interés moratorio por los días de atraso."/></label>
          <pv-date-picker input-id="paymentDate" v-model="paymentDate" date-format="dd/mm/yy" :max-date="maxDate" show-icon/>
        </div>
        <div class="fi-field">
          <label for="method">Medio de pago <span class="fi-required">*</span> <field-help text="Efectivo, Yape, Plin o transferencia bancaria."/></label>
          <pv-select input-id="method" v-model="method" :options="paymentMethods" option-label="label" option-value="code"/>
        </div>
      </div>

      <section v-if="isLate" class="fi-section late">
        <h3 class="fi-section__title">Tasa moratoria (la cuota está vencida)</h3>
        <div class="fi-section__body">
          <rate-field id-prefix="late-rate" v-model:period="lateRate.period" v-model:percent="lateRate.percent" label="Tasa moratoria"
                      help="Se coloca ahora porque el pago es posterior al vencimiento. Su TEA equivalente debe ser de al menos 40 % (60 % por defecto)."
                      hint="TEA equivalente mínima 40 %. Por defecto TEA 60 %."/>
          <pv-message v-if="rateError" severity="warn" :closable="false" class="mt-s">{{ rateError }}</pv-message>
        </div>
      </section>

      <div class="fi-field">
        <label for="paid">Monto <span class="fi-required">*</span> <field-help text="Debe ser igual al total exigible. No se aceptan pagos parciales."/></label>
        <pv-input-group>
          <pv-input-group-addon>S/</pv-input-group-addon>
          <pv-input-number input-id="paid" v-model="paid" :min-fraction-digits="2" :max-fraction-digits="2" locale="en-US" :min="0"/>
        </pv-input-group>
      </div>
      <div>
        <pv-button type="submit" label="Registrar pago" icon="pi pi-check" :loading="saving" :disabled="!obligation || saving || Boolean(rateError)"/>
      </div>
    </form>

    <aside class="fi-summary detail" aria-live="polite">
      <h2>Detalle de la obligación</h2>
      <template v-if="quote">
        <dl>
          <dt>Socio</dt>
          <dd>{{ quote.nombreSocio }}</dd>
          <dt>Concepto</dt>
          <dd>{{ quote.concepto }}</dd>
          <dt>Vencimiento</dt>
          <dd>{{ formatDate(quote.fechaVencimiento) }}</dd>
          <dt>Cuota exigible (D)</dt>
          <dd>{{ formatMoney(quote.montoExigible) }}</dd>
          <dt>&nbsp;&nbsp;Interés compensatorio</dt>
          <dd>{{ formatMoney(quote.interesCompensatorio) }}</dd>
          <dt>&nbsp;&nbsp;Capital</dt>
          <dd>{{ formatMoney(quote.capital) }}</dd>
          <template v-if="quote.vencida">
            <dt>Días de atraso (dm)</dt>
            <dd>{{ quote.diasMora }} día{{ quote.diasMora === 1 ? '' : 's' }}</dd>
            <dt>Tasa moratoria</dt>
            <dd>{{ quote.periodoTasaMora }} {{ formatRate(quote.valorTasaMora) }}</dd>
            <dt>TED moratoria</dt>
            <dd>{{ formatRate(quote.tedMora) }}</dd>
            <dt>Interés moratorio</dt>
            <dd>{{ formatMoney(quote.interesMora) }}</dd>
          </template>
          <template v-else>
            <dt>Mora</dt>
            <dd>Pago a tiempo: sin mora</dd>
          </template>
          <dt class="fi-summary__total">Total exigible</dt>
          <dd class="fi-summary__total">{{ formatMoney(quote.totalExigible) }}</dd>
        </dl>
        <p v-if="quote.vencida" class="fi-formula">Imor = D × ((1 + TED)^dm − 1) = {{ Number(quote.montoExigible).toFixed(2) }} × ((1 + {{ Number(quote.tedMora).toFixed(9) }})^{{ quote.diasMora }} − 1)</p>
        <h2 class="mt">Imputación del pago</h2>
        <dl>
          <template v-if="quote.vencida">
            <dt>1.º Interés moratorio</dt>
            <dd>{{ formatMoney(quote.imputacionMora) }}</dd>
          </template>
          <dt>{{ quote.vencida ? '2.º' : '1.º' }} Interés compensatorio</dt>
          <dd>{{ formatMoney(quote.imputacionInteres) }}</dd>
          <dt>{{ quote.vencida ? '3.º' : '2.º' }} Capital</dt>
          <dd>{{ formatMoney(quote.imputacionCapital) }}</dd>
          <dt class="fi-summary__total">Total imputado</dt>
          <dd class="fi-summary__total">{{ formatMoney(quote.totalExigible) }}</dd>
        </dl>
      </template>
      <p v-else class="fi-muted">Selecciona una obligación para ver el total exigible.</p>
    </aside>
  </section>

  <section class="fi-card">
    <h2 class="mb">Pagos registrados</h2>
    <pv-data-table :value="billingStore.payments" data-key="id" paginator :rows="8" size="small" scrollable :loading="loading">
      <template #empty><div class="fi-empty"><i class="pi pi-credit-card"></i><span>Aún no hay pagos registrados.</span></div></template>
      <pv-column header="Fecha">
        <template #body="{ data }">{{ formatDate(data.fechaPagoReal) }}</template>
      </pv-column>
      <pv-column header="Socio" field="nombreSocio"/>
      <pv-column header="Obligación">
        <template #body="{ data }">{{ data.producto }} · {{ data.concepto }}</template>
      </pv-column>
      <pv-column header="Días de atraso" field="diasMora"/>
      <pv-column header="Tasa moratoria">
        <template #body="{ data }">{{ data.periodoTasaMora ? `${data.periodoTasaMora} ${formatRate(data.valorTasaMora, 2)}` : '—' }}</template>
      </pv-column>
      <pv-column header="Mora" body-class="fi-table-number" header-class="fi-table-number">
        <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.interesMora) }}</span></template>
      </pv-column>
      <pv-column header="Interés" body-class="fi-table-number" header-class="fi-table-number">
        <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.imputacionInteres) }}</span></template>
      </pv-column>
      <pv-column header="Monto" body-class="fi-table-number" header-class="fi-table-number">
        <template #body="{ data }"><strong class="fi-money">{{ formatMoney(data.totalPagado) }}</strong></template>
      </pv-column>
      <pv-column header="Medio de pago">
        <template #body="{ data }">{{ paymentMethodLabel(data.medioPago) }}</template>
      </pv-column>
    </pv-data-table>
  </section>

  <payment-plan-dialog v-model:visible="planVisible" :sale-id="obligation?.idVenta ?? null"/>
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

.late {
  border-color: var(--fi-bad, #dc2626);
}

.detail h2 {
  font-size: 1.1rem;
  margin-bottom: .7rem;
}

.mt {
  margin-top: 1.2rem;
}

.mt-s {
  margin-top: .75rem;
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

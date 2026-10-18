<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useToast} from 'primevue/usetoast';
import {billingStore} from '@/billing/application/billing.store.js';
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
 * The backend computes the quote (POST /pagos/cotizacion) and rejects partial payments (CP10).
 */
const toast = useToast();
const {formatMoney, formatDate, formatRate} = useFormatting();
const today = systemClock.today();

const obligationKey = ref(null);
const paymentDate = ref(new Date(today.year, today.month - 1, today.day));
const method = ref('EFECTIVO');
const paid = ref(null);
const saving = ref(false);
const error = ref('');
const quote = ref(null);

const loading = computed(() => billingStore.loading);
const pendingOptions = computed(() => billingStore.pending.map(item => ({
  key: item.clave,
  label: `${item.codigo} — ${item.nombreSocio} — ${item.producto} — ${item.concepto} — vence ${formatDate(item.fechaVencimiento)}`,
  status: item.estado
})));
const obligation = computed(() => billingStore.pending.find(item => item.clave === obligationKey.value) ?? null);
const dateIso = computed(() => (paymentDate.value ? CalendarDate.from(paymentDate.value).toIsoString() : ''));

let sequence = 0;
watch([obligation, dateIso], async () => {
  error.value = '';
  quote.value = null;
  paid.value = null;
  if (!obligation.value || !dateIso.value) return;
  const current = ++sequence;
  try {
    const result = await billingStore.quote(obligation.value, dateIso.value);
    if (current !== sequence) return;
    quote.value = result;
    paid.value = Number(result.totalExigible);
  } catch (message) {
    if (current === sequence) error.value = String(message);
  }
});

const register = async () => {
  error.value = '';
  if (!obligation.value) {
    error.value = 'Selecciona una obligación pendiente.';
    return;
  }
  saving.value = true;
  try {
    const saved = await billingStore.registerPayment({obligation: obligation.value, paymentDate: dateIso.value, method: method.value, paid: paid.value ?? 0});
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
            <pv-input-group-addon>S/</pv-input-group-addon>
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
          <dd>{{ quote.nombreSocio }}</dd>
          <dt>Concepto</dt>
          <dd>{{ quote.concepto }}</dd>
          <dt>Fecha de pago</dt>
          <dd>{{ formatDate(quote.fechaVencimiento) }}</dd>
          <dt>Pago exigible (D)</dt>
          <dd>{{ formatMoney(quote.montoExigible) }}</dd>
          <dt>Días de mora (dm)</dt>
          <dd>{{ quote.diasMora }} día{{ quote.diasMora === 1 ? '' : 's' }}</dd>
          <dt>Tasa moratoria pactada</dt>
          <dd>{{ quote.periodoTasaMora }} {{ formatRate(quote.valorTasaMora) }}</dd>
          <dt>TED moratoria</dt>
          <dd>{{ formatRate(quote.tedMora) }}</dd>
          <dt>Intereses por mora</dt>
          <dd>{{ formatMoney(quote.interesMora) }}</dd>
          <dt class="fi-summary__total">Total exigible</dt>
          <dd class="fi-summary__total">{{ formatMoney(quote.totalExigible) }}</dd>
        </dl>
        <p class="fi-formula">Imor = D × ((1 + TED)^dm − 1) = {{ Number(quote.montoExigible).toFixed(2) }} × ((1 + {{ Number(quote.tedMora).toFixed(7) }})^{{ quote.diasMora }} − 1)</p>
        <h2 class="mt">Imputación del pago</h2>
        <dl>
          <dt>1.º Interés moratorio</dt>
          <dd>{{ formatMoney(quote.imputacionMora) }}</dd>
          <dt>2.º Capital</dt>
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
      <pv-column header="Días de mora" field="diasMora"/>
      <pv-column header="Mora" body-class="fi-table-number" header-class="fi-table-number">
        <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.interesMora) }}</span></template>
      </pv-column>
      <pv-column header="Monto" body-class="fi-table-number" header-class="fi-table-number">
        <template #body="{ data }"><strong class="fi-money">{{ formatMoney(data.totalPagado) }}</strong></template>
      </pv-column>
      <pv-column header="Medio de pago">
        <template #body="{ data }">{{ paymentMethodLabel(data.medioPago) }}</template>
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

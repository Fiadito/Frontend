<script setup>
import {computed, onMounted, reactive, ref, watch} from 'vue';
import {useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {membershipStore} from '@/membership/application/membership.store.js';
import {catalogStore} from '@/catalog/application/catalog.store.js';
import {creditStore} from '@/credit/application/credit.store.js';
import {allowsMode, SaleMode} from '@/catalog/domain/model/sale-mode.js';
import {CreditPolicy} from '@/credit/domain/model/credit-policy.js';
import {systemClock} from '@/shared/domain/model/system-clock.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import FieldHelp from '@/shared/presentation/components/field-help.vue';
import RateField from '@/shared/presentation/components/rate-field.vue';
import RateConversion from '@/shared/presentation/components/rate-conversion.vue';
import ScheduleTable from '@/credit/presentation/components/schedule-table.vue';
import PaymentPlanDialog from '@/credit/presentation/components/payment-plan-dialog.vue';

/**
 * Registrar venta (Figura 8, module 7.6): member, product or combo, quantity, date-time, payment mode
 * (single payment or up to 8 fortnightly installments) and the effective rate of the sale (equivalent TEA 15 %–27 %).
 * The backend simulates the sale (POST /ventas/simulacion) and shows the amount, the interest and the French plan before saving it.
 */
const router = useRouter();
const toast = useToast();
const {formatMoney, formatDate, formatRate} = useFormatting();
const loading = ref(false);

/** "YYYY-MM-DDTHH:mm" ⇄ Date for the date picker. */
const toLocalText = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const fromLocalText = text => new Date(Number(text.slice(0, 4)), Number(text.slice(5, 7)) - 1, Number(text.slice(8, 10)), Number(text.slice(11, 13)), Number(text.slice(14, 16)));

const form = reactive({
  memberId: null, productId: null, quantity: 1, purchaseDate: fromLocalText(systemClock.nowLocal()), paymentMode: SaleMode.INSTALLMENTS,
  installmentCount: 8, ratePeriod: CreditPolicy.DEFAULT_SALE_RATE_PERIOD, ratePercent: CreditPolicy.DEFAULT_SALE_RATE * 100
});
const saving = ref(false);
const attempted = ref(false);
const simulation = ref(null);
const simulating = ref(false);
const lastSale = ref(null);
const planVisible = ref(false);
const maxDate = (() => {
  const today = systemClock.today();
  return new Date(today.year, today.month - 1, today.day, 23, 59);
})();

const activeMembers = computed(() => membershipStore.members.filter(member => member.isActive));
/** Combos first: they are the easy way to reach the minimum of S/ 400 with cheap drinks. */
const activeProducts = computed(() => catalogStore.products.filter(product => product.isActive)
    .sort((a, b) => Number(b.isCombo) - Number(a.isCombo))
    .map(product => ({id: product.id, displayName: product.displayName, listPrice: product.listPrice, isCombo: product.isCombo})));
const member = computed(() => membershipStore.findById(form.memberId) ?? null);
const product = computed(() => catalogStore.findById(form.productId) ?? null);
const currency = computed(() => member.value?.currency ?? 'PEN');
const minimumQuantity = computed(() => product.value?.minimumQuantity ?? 1);

const modeOptions = computed(() => [
  {label: 'Pago único', value: SaleMode.SINGLE_PAYMENT, disabled: product.value ? !allowsMode(product.value.saleMode, SaleMode.SINGLE_PAYMENT) : false},
  {label: 'Cuotas quincenales', value: SaleMode.INSTALLMENTS, disabled: product.value ? !allowsMode(product.value.saleMode, SaleMode.INSTALLMENTS) : false}
]);
const maxInstallments = computed(() => member.value?.maxInstallments ?? CreditPolicy.MAX_INSTALLMENTS);

watch(product, value => {
  if (!value) return;
  if (!allowsMode(value.saleMode, form.paymentMode)) form.paymentMode = value.saleMode === SaleMode.SINGLE_PAYMENT ? SaleMode.SINGLE_PAYMENT : SaleMode.INSTALLMENTS;
  if ((form.quantity ?? 0) * value.listPrice < CreditPolicy.MIN_AMOUNT) form.quantity = value.minimumQuantity;
});
watch(member, value => {
  if (value) form.installmentCount = Math.min(form.installmentCount || 8, value.maxInstallments);
});

const request = computed(() => ({
  memberId: form.memberId, productId: form.productId, quantity: form.quantity ?? 0,
  purchaseDateTime: form.purchaseDate ? toLocalText(form.purchaseDate) : null, paymentMode: form.paymentMode,
  installmentCount: form.installmentCount ?? 0, ratePeriod: form.ratePeriod, ratePercent: form.ratePercent
}));
const hasSelection = computed(() => Boolean(member.value && product.value));

let timer = null;
let sequence = 0;
const simulate = () => {
  clearTimeout(timer);
  if (!hasSelection.value) {
    simulation.value = null;
    return;
  }
  timer = setTimeout(async () => {
    const current = ++sequence;
    simulating.value = true;
    try {
      const result = await creditStore.simulate(request.value);
      if (current === sequence) simulation.value = result;
    } catch (message) {
      if (current === sequence) simulation.value = {errors: [String(message)], schedule: []};
    } finally {
      if (current === sequence) simulating.value = false;
    }
  }, 250);
};
watch(request, simulate, {deep: true});

const errors = computed(() => simulation.value?.errors ?? []);

const resetForm = () => {
  Object.assign(form, {productId: null, quantity: 1, purchaseDate: fromLocalText(systemClock.nowLocal())});
  attempted.value = false;
};

const register = async () => {
  // Guard against double submit (Enter twice or double click): only one request at a time.
  if (saving.value || simulating.value) return;
  attempted.value = true;
  if (!hasSelection.value || errors.value.length) return;
  saving.value = true;
  try {
    const saved = await creditStore.register(request.value);
    lastSale.value = saved;
    toast.add({severity: 'success', summary: 'Venta registrada', detail: `${saved.memberName}: ${formatMoney(saved.amount, currency.value)} – primer pago ${formatDate(saved.paymentDate)}`, life: 5000});
    await membershipStore.load();
    resetForm();
  } catch (message) {
    toast.add({severity: 'error', summary: 'No se registró la venta', detail: String(message), life: 6000});
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([membershipStore.load(), catalogStore.load()]);
  } catch (message) {
    toast.add({severity: 'error', summary: 'No se pudieron cargar los datos', detail: String(message), life: 6000});
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <page-header title="Registrar venta" subtitle="Registra una compra al fiado con su tasa efectiva y revisa su plan de pagos antes de guardarla."/>

  <pv-message v-if="lastSale" severity="success" :closable="true" class="mb" @close="lastSale = null">
    <div class="last-sale">
      <span>Venta registrada: {{ lastSale.memberName }} · {{ lastSale.productName }} × {{ lastSale.quantity }} ·
        {{ formatMoney(lastSale.totalToPay, currency) }} con interés.</span>
      <pv-button label="Ver plan de pagos" icon="pi pi-calendar" size="small" @click="planVisible = true"/>
    </div>
  </pv-message>

  <form novalidate @submit.prevent="register">
    <section class="fi-card">
      <h2 class="mb">Datos de la venta</h2>
      <div class="fi-grid fi-grid--2">
        <div class="fi-field">
          <label for="member">Socio <span class="fi-required">*</span> <field-help text="Socio activo que realiza la compra. Se valida su crédito disponible."/></label>
          <pv-select input-id="member" v-model="form.memberId" :options="activeMembers" option-label="fullName" option-value="id" filter
                     :filter-fields="['fullName', 'dni']" placeholder="Selecciona un socio" :loading="loading" empty-message="No hay socios activos">
            <template #option="{ option }">{{ option.fullName }} <span class="fi-soft">· DNI {{ option.dni }}</span></template>
          </pv-select>
        </div>
        <div class="fi-field">
          <label for="product">Producto o combo <span class="fi-required">*</span> <field-help text="Producto o combo activo del catálogo. Se usa su precio de lista (crédito). Los combos de S/ 100, 200 o 400 llegan rápido al mínimo de S/ 400."/></label>
          <pv-select input-id="product" v-model="form.productId" :options="activeProducts" option-label="displayName" option-value="id" filter
                     placeholder="Selecciona un producto o combo" :loading="loading" empty-message="No hay productos activos">
            <template #option="{ option }">
              <span v-if="option.isCombo" class="fi-badge combo-tag">Combo</span>
              <span>{{ option.displayName }}</span><span class="fi-soft"> · {{ formatMoney(option.listPrice) }}</span>
            </template>
          </pv-select>
        </div>
        <div class="fi-field">
          <label for="quantity">Cantidad <span class="fi-required">*</span> <field-help text="Unidades o combos comprados. Precio de lista × cantidad debe estar entre S/ 400.00 y S/ 1,000.00."/></label>
          <pv-input-number input-id="quantity" v-model="form.quantity" show-buttons :min="1" :max="999"/>
          <small v-if="product" class="fi-hint">
            Mínimo para llegar a S/ 400: {{ minimumQuantity }} {{ product.isCombo ? 'combo(s)' : 'unidad(es)' }}
            <pv-button v-if="form.quantity !== minimumQuantity" type="button" label="Usar mínimo" text size="small" class="hint-button"
                       @click="form.quantity = minimumQuantity"/>
          </small>
        </div>
        <div class="fi-field">
          <label for="purchaseDate">Fecha y hora de compra <span class="fi-required">*</span> <field-help text="No puede ser futura. Hasta el día 10 o 25 a las 23:59 la compra entra al corte de ese día."/></label>
          <pv-date-picker input-id="purchaseDate" v-model="form.purchaseDate" show-time hour-format="24" date-format="dd/mm/yy" :max-date="maxDate" show-icon/>
        </div>
        <div class="fi-field">
          <span class="fi-label">Modalidad de pago <span class="fi-required">*</span> <field-help text="Pago único en la fecha de pago (con una quincena de interés), o cuotas quincenales fijas con interés (método francés)."/></span>
          <pv-select-button v-model="form.paymentMode" :options="modeOptions" option-label="label" option-value="value" option-disabled="disabled" :allow-empty="false"/>
        </div>
        <div class="fi-field">
          <label for="installments">N° de cuotas quincenales <field-help text="De 1 hasta el máximo del socio (8 cuotas = 4 meses)."/></label>
          <pv-input-number input-id="installments" v-model="form.installmentCount" show-buttons :min="1" :max="maxInstallments"
                           :disabled="form.paymentMode !== SaleMode.INSTALLMENTS"/>
          <small class="fi-hint">Máximo del socio: {{ maxInstallments }} cuotas</small>
        </div>
      </div>
    </section>

    <section class="fi-card">
      <h2 class="mb">Tasa efectiva de la venta</h2>
      <div class="fi-grid fi-grid--2 rate">
        <div>
          <rate-field id-prefix="sale-rate" v-model:period="form.ratePeriod" v-model:percent="form.ratePercent"
                      help="Tasa del interés del plan de pagos. Se elige en cada venta (puede ser TEA, TES, TET, TEM o TEQ) y se puede cambiar después desde el plan de pagos."
                      hint="Su TEA equivalente debe estar entre 15 % y 27 %. Cada cuota usa su TEQ."/>
          <p class="fi-muted note">La tasa moratoria no se pacta aquí: se coloca al registrar el pago, solo si la cuota está vencida.</p>
        </div>
        <rate-conversion title="Conversión de la tasa de la venta" :period="form.ratePeriod" :value="form.ratePercent === null ? null : form.ratePercent / 100"/>
      </div>
    </section>

    <section class="fi-card">
      <h2 class="mb">Cálculo de la venta</h2>
      <div class="fi-grid fi-grid--5">
        <div class="calc">
          <span>Monto de la compra</span>
          <strong>{{ simulation?.amount != null ? formatMoney(simulation.amount, currency) : '—' }}</strong>
          <small>{{ product ? `${formatMoney(product.listPrice, currency)} × ${form.quantity ?? 0}` : 'Precio de lista × cantidad' }}</small>
        </div>
        <div class="calc">
          <span>Fecha de pago asignada</span>
          <strong>{{ simulation?.paymentDate ? formatDate(simulation.paymentDate) : '—' }}</strong>
          <small>{{ simulation?.cutoffDate ? `Corte del ${formatDate(simulation.cutoffDate)}` : 'Según el corte' }}</small>
        </div>
        <div class="calc">
          <span>{{ form.paymentMode === SaleMode.INSTALLMENTS ? 'Cuota quincenal' : 'Pago único' }}</span>
          <strong>{{ simulation?.installmentAmount != null ? formatMoney(simulation.installmentAmount, currency) : '—' }}</strong>
          <small>{{ simulation?.periodRate != null ? `TEQ ${formatRate(simulation.periodRate)}` : 'C = P · i / (1 − (1 + i)^−n)' }}</small>
        </div>
        <div class="calc">
          <span>Interés total</span>
          <strong>{{ simulation?.interestTotal != null ? formatMoney(simulation.interestTotal, currency) : '—' }}</strong>
          <small>{{ simulation?.totalToPay != null ? `Total a pagar ${formatMoney(simulation.totalToPay, currency)}` : 'Capital + interés' }}</small>
        </div>
        <div class="calc">
          <span>Crédito disponible</span>
          <strong :class="{ 'calc--bad': member && simulation?.amount > member.availableCredit }">{{ member ? formatMoney(member.availableCredit, currency) : '—' }}</strong>
          <small>{{ member ? `Límite ${formatMoney(member.creditLimit, currency)}` : 'Selecciona un socio' }}</small>
        </div>
      </div>

      <pv-message v-if="hasSelection && errors.length" severity="warn" :closable="false" class="mt" role="alert">
        <ul class="errors">
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </pv-message>
      <pv-message v-else-if="attempted && !hasSelection" severity="warn" :closable="false" class="mt">Selecciona un socio y un producto.</pv-message>
    </section>

    <section v-if="form.paymentMode === SaleMode.INSTALLMENTS" class="fi-card">
      <div class="fi-card__header">
        <h2>Plan de pagos</h2>
        <span class="fi-soft">Cuotas quincenales fijas con interés (método francés) · vencen los días 15 y 30 (o último día del mes)</span>
      </div>
      <schedule-table v-if="simulation?.schedule?.length" :rows="simulation.schedule" :total="simulation.totalToPay ?? null" :currency="currency"/>
      <div v-else class="fi-empty"><i class="pi pi-calendar"></i><span>Selecciona socio, producto, cantidad y tasa para ver el plan de pagos.</span></div>
    </section>

    <div class="footer-actions">
      <pv-button type="button" label="Cancelar" severity="secondary" outlined @click="router.push({ name: 'panel' })"/>
      <pv-button type="submit" label="Registrar venta" icon="pi pi-check" :loading="saving" :disabled="!hasSelection || simulating || saving"/>
    </div>
  </form>

  <payment-plan-dialog v-model:visible="planVisible" :sale-id="lastSale?.id ?? null" :currency="currency"/>
</template>

<style scoped>
.mb {
  margin-bottom: 1rem;
}

.mt {
  margin-top: 1rem;
}

.note {
  margin: .75rem 0 0;
  font-size: .85rem;
}

.rate {
  align-items: start;
}

.last-sale {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
}

.combo-tag {
  margin-right: .4rem;
  background: var(--fi-primary-surface);
  color: var(--fi-primary);
}

.hint-button {
  padding: 0 .3rem;
}

.calc {
  background: var(--fi-surface);
  border-radius: 10px;
  padding: .9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: .15rem;
}

.calc span {
  color: var(--fi-muted);
  font-size: .85rem;
}

.calc strong {
  font-size: 1.35rem;
  font-variant-numeric: tabular-nums;
}

.calc small {
  color: var(--fi-soft);
  font-size: .78rem;
}

.calc--bad {
  color: var(--fi-bad);
}

.errors {
  margin: 0;
  padding-left: 1.1rem;
}

.footer-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1.25rem;
}
</style>

<script setup>
import {computed, onMounted, reactive, ref, watch} from 'vue';
import {useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {membershipStore} from '@/membership/application/membership.store.js';
import {catalogStore} from '@/catalog/application/catalog.store.js';
import {creditStore} from '@/credit/application/credit.store.js';
import {billingStore} from '@/billing/application/billing.store.js';
import {useBusinessData} from '@/dashboard/application/use-business-data.js';
import {allowsMode, SaleMode} from '@/catalog/domain/model/sale-mode.js';
import {CreditPolicy} from '@/credit/domain/model/credit-policy.js';
import {systemClock} from '@/shared/domain/model/system-clock.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import FieldHelp from '@/shared/presentation/components/field-help.vue';
import ScheduleTable from '@/credit/presentation/components/schedule-table.vue';

/**
 * Registrar venta (Figura 8, module 7.6): member, product, quantity, date-time and payment mode
 * (single payment or up to 8 fortnightly installments). Shows the amount and the payment plan
 * before saving the operation.
 */
const router = useRouter();
const toast = useToast();
const {formatMoney, formatDate} = useFormatting();
const {loading, reload} = useBusinessData();

/** "YYYY-MM-DDTHH:mm" ⇄ Date for the date picker. */
const toLocalText = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const fromLocalText = text => new Date(Number(text.slice(0, 4)), Number(text.slice(5, 7)) - 1, Number(text.slice(8, 10)), Number(text.slice(11, 13)), Number(text.slice(14, 16)));

const form = reactive({memberId: null, productId: null, quantity: 1, purchaseDate: fromLocalText(systemClock.nowLocal()), paymentMode: SaleMode.INSTALLMENTS, installmentCount: 8});
const saving = ref(false);
const attempted = ref(false);
const maxDate = (() => {
  const today = systemClock.today();
  return new Date(today.year, today.month - 1, today.day, 23, 59);
})();

const activeMembers = computed(() => membershipStore.members.filter(member => member.isActive));
const activeProducts = computed(() => catalogStore.products.filter(product => product.isActive)
    .map(product => ({...product, displayName: product.displayName, listPrice: product.listPrice})));
const member = computed(() => membershipStore.findById(form.memberId) ?? null);
const product = computed(() => catalogStore.findById(form.productId) ?? null);
const statement = computed(() => (member.value ? billingStore.statementOf(member.value) : null));
const currency = computed(() => member.value?.currency ?? 'PEN');

const modeOptions = computed(() => [
  {label: 'Pago único', value: SaleMode.SINGLE_PAYMENT, disabled: product.value ? !allowsMode(product.value.saleMode, SaleMode.SINGLE_PAYMENT) : false},
  {label: 'Cuotas quincenales', value: SaleMode.INSTALLMENTS, disabled: product.value ? !allowsMode(product.value.saleMode, SaleMode.INSTALLMENTS) : false}
]);
const maxInstallments = computed(() => member.value?.maxInstallments ?? CreditPolicy.MAX_INSTALLMENTS);

watch(product, value => {
  if (!value) return;
  if (!allowsMode(value.saleMode, form.paymentMode)) form.paymentMode = value.saleMode === SaleMode.SINGLE_PAYMENT ? SaleMode.SINGLE_PAYMENT : SaleMode.INSTALLMENTS;
});
watch(member, value => {
  if (value) form.installmentCount = Math.min(form.installmentCount || 8, value.maxInstallments);
});

const simulation = computed(() => creditStore.simulate({
  member: member.value, product: product.value, quantity: form.quantity ?? 0,
  purchaseDateTime: form.purchaseDate ? toLocalText(form.purchaseDate) : '', paymentMode: form.paymentMode,
  installmentCount: form.installmentCount ?? 0, memberCapitalDebt: statement.value?.capitalDebt ?? 0
}));
const sale = computed(() => simulation.value.sale);
const hasSelection = computed(() => member.value && product.value);

const resetForm = () => {
  Object.assign(form, {productId: null, quantity: 1, purchaseDate: fromLocalText(systemClock.nowLocal())});
  attempted.value = false;
};

const register = async () => {
  attempted.value = true;
  if (simulation.value.errors.length) return;
  saving.value = true;
  try {
    const saved = await creditStore.register(simulation.value, product.value.description, member.value.fullName);
    toast.add({severity: 'success', summary: 'Venta registrada', detail: `${member.value.fullName}: ${formatMoney(saved.amount, currency.value)} – primer pago ${formatDate(saved.paymentDate)}`, life: 5000});
    resetForm();
  } catch (message) {
    toast.add({severity: 'error', summary: 'No se registró la venta', detail: String(message), life: 6000});
  } finally {
    saving.value = false;
  }
};

onMounted(reload);
</script>

<template>
  <page-header title="Registrar venta" subtitle="Registra una compra al fiado y revisa su plan de pago antes de guardarla."/>

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
          <label for="product">Producto <span class="fi-required">*</span> <field-help text="Producto activo del catálogo. Se usa su precio de lista (crédito)."/></label>
          <pv-select input-id="product" v-model="form.productId" :options="activeProducts" option-label="displayName" option-value="id" filter
                     placeholder="Selecciona un producto" :loading="loading" empty-message="No hay productos activos">
            <template #option="{ option }">
              <span>{{ option.displayName }}</span><span class="fi-soft"> · {{ formatMoney(option.listPrice) }}</span>
            </template>
          </pv-select>
        </div>
        <div class="fi-field">
          <label for="quantity">Cantidad <span class="fi-required">*</span> <field-help text="Unidades compradas (≥ 1). Precio de lista × cantidad debe estar entre S/ 400.00 y S/ 1,000.00."/></label>
          <pv-input-number input-id="quantity" v-model="form.quantity" show-buttons :min="1" :max="999"/>
        </div>
        <div class="fi-field">
          <label for="purchaseDate">Fecha y hora de compra <span class="fi-required">*</span> <field-help text="No puede ser futura. Hasta el día 10 o 25 a las 23:59 la compra entra al corte de ese día."/></label>
          <pv-date-picker input-id="purchaseDate" v-model="form.purchaseDate" show-time hour-format="24" date-format="dd/mm/yy" :max-date="maxDate" show-icon/>
        </div>
        <div class="fi-field">
          <span class="fi-label">Modalidad de pago <span class="fi-required">*</span> <field-help text="Pago único en la fecha de pago, o cuotas quincenales iguales (sin interés compensatorio)."/></span>
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
      <h2 class="mb">Cálculo de la venta</h2>
      <div class="fi-grid fi-grid--5">
        <div class="calc">
          <span>Precio de lista</span>
          <strong>{{ product ? formatMoney(product.listPrice, currency) : '—' }}</strong>
          <small>Por unidad</small>
        </div>
        <div class="calc">
          <span>Monto de la compra</span>
          <strong>{{ sale ? formatMoney(sale.amount, currency) : '—' }}</strong>
          <small>Precio de lista × cantidad</small>
        </div>
        <div class="calc">
          <span>Fecha de pago asignada</span>
          <strong>{{ sale ? formatDate(sale.paymentDate) : '—' }}</strong>
          <small>{{ simulation.cutoffDate ? `Corte del ${formatDate(simulation.cutoffDate)}` : 'Según el corte' }}</small>
        </div>
        <div class="calc">
          <span>{{ form.paymentMode === SaleMode.INSTALLMENTS ? 'Cuota quincenal' : 'Monto a pagar (S = C)' }}</span>
          <strong>{{ sale ? formatMoney(sale.installmentAmount, currency) : '—' }}</strong>
          <small>{{ form.paymentMode === SaleMode.INSTALLMENTS ? `C = P / ${form.installmentCount || 'n'}` : 'Pago único' }}</small>
        </div>
        <div class="calc">
          <span>Crédito disponible</span>
          <strong :class="{ 'calc--bad': statement && sale && sale.amount > statement.availableCredit }">{{ statement ? formatMoney(statement.availableCredit, currency) : '—' }}</strong>
          <small>{{ member ? `Límite ${formatMoney(member.creditLimit, currency)}` : 'Selecciona un socio' }}</small>
        </div>
      </div>

      <pv-message v-if="hasSelection && simulation.errors.length && (attempted || sale)" severity="warn" :closable="false" class="mt" role="alert">
        <ul class="errors">
          <li v-for="error in simulation.errors" :key="error">{{ error }}</li>
        </ul>
      </pv-message>
      <pv-message v-else-if="attempted && simulation.errors.length" severity="warn" :closable="false" class="mt">{{ simulation.errors[0] }}</pv-message>
    </section>

    <section v-if="form.paymentMode === SaleMode.INSTALLMENTS" class="fi-card">
      <div class="fi-card__header">
        <h2>Plan de pagos</h2>
        <span class="fi-soft">Cuotas quincenales iguales · vencen los días 15 y 30 (o último día del mes)</span>
      </div>
      <schedule-table v-if="simulation.schedule.length" :rows="simulation.schedule" :total="sale?.totalToPay ?? null" :currency="currency"/>
      <div v-else class="fi-empty"><i class="pi pi-calendar"></i><span>Selecciona socio, producto y cantidad para ver el plan de pagos.</span></div>
    </section>

    <div class="footer-actions">
      <pv-button type="button" label="Cancelar" severity="secondary" outlined @click="router.push({ name: 'panel' })"/>
      <pv-button type="submit" label="Registrar venta" icon="pi pi-check" :loading="saving" :disabled="!hasSelection"/>
    </div>
  </form>
</template>

<style scoped>
.mb {
  margin-bottom: 1rem;
}

.mt {
  margin-top: 1rem;
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

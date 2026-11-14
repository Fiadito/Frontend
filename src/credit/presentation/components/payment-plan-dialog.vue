<script setup>
import {computed, ref, watch} from 'vue';
import {creditStore} from '@/credit/application/credit.store.js';
import {CreditPolicy, saleRateError} from '@/credit/domain/model/credit-policy.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import ScheduleTable from '@/credit/presentation/components/schedule-table.vue';
import RateField from '@/shared/presentation/components/rate-field.vue';
import RateConversion from '@/shared/presentation/components/rate-conversion.vue';
import StatusBadge from '@/shared/presentation/components/status-badge.vue';

/**
 * Plan de pagos de una venta, a un clic desde Socios, Panel, Registrar venta y Registrar pago.
 * Muestra la tasa pactada, su TEQ, el interés de cada cuota y permite cambiar la tasa de la venta:
 * las cuotas pagadas no cambian y las pendientes se recalculan desde su saldo (PATCH /ventas/{id}/tasa).
 */
const props = defineProps({
  visible: {type: Boolean, default: false},
  saleId: {type: Number, default: null},
  currency: {type: String, default: 'PEN'},
  editable: {type: Boolean, default: true}
});
const emit = defineEmits(['update:visible', 'changed']);
const {formatMoney, formatDate, formatRate} = useFormatting();

const sale = ref(null);
const loading = ref(false);
const error = ref('');
const changing = ref(false);
const saving = ref(false);
const rate = ref({period: CreditPolicy.DEFAULT_SALE_RATE_PERIOD, percent: CreditPolicy.DEFAULT_SALE_RATE * 100});

const load = async () => {
  if (!props.saleId) return;
  loading.value = true;
  error.value = '';
  try {
    sale.value = await creditStore.find(props.saleId);
    rate.value = {period: sale.value.ratePeriod, percent: Number((sale.value.rateValue * 100).toFixed(7))};
  } catch (message) {
    error.value = String(message);
  } finally {
    loading.value = false;
  }
};

watch(() => [props.visible, props.saleId], ([visible]) => {
  changing.value = false;
  if (visible) load();
}, {immediate: true});

const rows = computed(() => {
  if (!sale.value) return [];
  if (sale.value.isInInstallments) {
    return sale.value.installments.map(i => ({
      number: i.number, dueDate: i.dueDate, openingBalance: i.openingBalance, interest: i.interest, amortization: i.amortization,
      amount: i.amount, closingBalance: i.closingBalance, status: i.status
    }));
  }
  return [{number: 1, dueDate: sale.value.paymentDate, openingBalance: sale.value.amount, interest: sale.value.interestTotal,
    amortization: sale.value.amount, amount: sale.value.totalToPay, closingBalance: 0, status: sale.value.status}];
});
const paidCount = computed(() => rows.value.filter(row => row.status === 'PAGADA').length);
const rateError = computed(() => saleRateError(rate.value.period, rate.value.percent === null ? null : rate.value.percent / 100));

const applyRate = async () => {
  if (saving.value || rateError.value) return;
  saving.value = true;
  error.value = '';
  try {
    sale.value = await creditStore.changeRate(sale.value.id, rate.value.period, rate.value.percent);
    changing.value = false;
    emit('changed', sale.value);
  } catch (message) {
    error.value = String(message);
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <pv-dialog :visible="visible" modal header="Plan de pagos" :style="{ width: 'min(1040px, 96vw)' }" :draggable="false"
             @update:visible="emit('update:visible', $event)">
    <pv-message v-if="error" severity="error" :closable="false" role="alert" class="mb">{{ error }}</pv-message>
    <div v-if="loading" class="fi-empty"><i class="pi pi-spin pi-spinner"></i><span>Cargando el plan…</span></div>
    <template v-else-if="sale">
      <div class="head">
        <div>
          <strong>{{ sale.memberName }}</strong>
          <span class="fi-soft"> · {{ sale.productName }} × {{ sale.quantity }} · compra {{ formatDate(sale.purchaseDate) }}</span>
        </div>
        <status-badge :status="sale.status"/>
      </div>

      <div class="summary">
        <div><span>Monto (capital)</span><strong>{{ formatMoney(sale.amount, currency) }}</strong></div>
        <div><span>Tasa pactada</span><strong>{{ sale.ratePeriod }} {{ formatRate(sale.rateValue) }}</strong></div>
        <div><span>TEQ de cada cuota</span><strong>{{ formatRate(sale.periodRate) }}</strong></div>
        <div><span>TEA equivalente</span><strong>{{ formatRate(sale.annualRate) }}</strong></div>
        <div><span>{{ sale.isInInstallments ? `Cuota (${sale.installmentCount})` : 'Pago único' }}</span><strong>{{ formatMoney(sale.installmentAmount, currency) }}</strong></div>
        <div><span>Interés total</span><strong>{{ formatMoney(sale.interestTotal, currency) }}</strong></div>
        <div><span>Total a pagar</span><strong>{{ formatMoney(sale.totalToPay, currency) }}</strong></div>
      </div>

      <schedule-table :rows="rows" :currency="currency" show-status/>
      <p class="fi-formula">Método francés: C = P · i / (1 − (1 + i)^−n), con i = TEQ. Interés = saldo inicial × TEQ. La mora solo se cobra si una cuota se paga después de su vencimiento.</p>

      <section v-if="editable && !sale.isPaid" class="fi-section change">
        <div class="change__header">
          <h3 class="fi-section__title">Tasa efectiva de esta venta</h3>
          <pv-button v-if="!changing" label="Cambiar tasa" icon="pi pi-percentage" size="small" variant="outlined" @click="changing = true"/>
        </div>
        <template v-if="changing">
          <div class="fi-grid fi-grid--2 change__body">
            <div>
              <rate-field id-prefix="plan-rate" v-model:period="rate.period" v-model:percent="rate.percent" label="Nueva tasa efectiva"
                          help="Su TEA equivalente debe estar entre 15 % y 27 %." hint="TEA equivalente entre 15 % y 27 %."/>
              <pv-message v-if="rateError" severity="warn" :closable="false" class="mt">{{ rateError }}</pv-message>
              <p class="fi-muted">
                {{ paidCount ? `Las ${paidCount} cuota(s) pagadas no cambian; ` : '' }}las cuotas pendientes se recalculan desde su saldo de capital,
                en sus mismas fechas.
              </p>
              <div class="actions">
                <pv-button label="Cancelar" text severity="secondary" @click="changing = false"/>
                <pv-button label="Recalcular plan" icon="pi pi-refresh" :loading="saving" :disabled="Boolean(rateError)" @click="applyRate"/>
              </div>
            </div>
            <rate-conversion title="Conversión de la nueva tasa" :period="rate.period" :value="rate.percent === null ? null : rate.percent / 100"/>
          </div>
        </template>
      </section>
    </template>
  </pv-dialog>
</template>

<style scoped>
.mb {
  margin-bottom: 1rem;
}

.mt {
  margin-top: .75rem;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: .75rem;
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: .75rem 1rem;
  background: var(--fi-primary-surface);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}

.summary span {
  display: block;
  color: var(--fi-muted);
  font-size: .82rem;
}

.summary strong {
  font-size: 1.02rem;
}

.change {
  margin-top: 1.25rem;
}

.change__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.change__body {
  margin-top: .75rem;
  align-items: start;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: .5rem;
}
</style>

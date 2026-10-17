<script setup>
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import StatusBadge from '@/shared/presentation/components/status-badge.vue';

/**
 * Payment plan table (Tabla 2: n_cuota, fecha_vencimiento, saldo_inicial, amortizacion, cuota, saldo_final).
 */
defineProps({
  rows: {type: Array, required: true},
  total: {type: Number, default: null},
  currency: {type: String, default: 'PEN'},
  showStatus: {type: Boolean, default: false}
});
const {formatMoney, formatDate} = useFormatting();
</script>

<template>
  <pv-data-table :value="rows" data-key="number" scrollable size="small" striped-rows>
    <pv-column field="number" header="N°" style="width: 4rem"/>
    <pv-column header="Vencimiento">
      <template #body="{ data }">{{ formatDate(data.dueDate) }}</template>
    </pv-column>
    <pv-column header="Saldo inicial" body-class="fi-table-number" header-class="fi-table-number">
      <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.openingBalance, currency) }}</span></template>
    </pv-column>
    <pv-column header="Amortización" body-class="fi-table-number" header-class="fi-table-number">
      <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.amortization, currency) }}</span></template>
    </pv-column>
    <pv-column header="Cuota" body-class="fi-table-number" header-class="fi-table-number">
      <template #body="{ data }"><strong class="fi-money">{{ formatMoney(data.amount, currency) }}</strong></template>
    </pv-column>
    <pv-column header="Saldo final" body-class="fi-table-number" header-class="fi-table-number">
      <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.closingBalance, currency) }}</span></template>
    </pv-column>
    <pv-column v-if="showStatus" header="Estado">
      <template #body="{ data }"><status-badge :status="data.status"/></template>
    </pv-column>
    <template v-if="total !== null" #footer>
      <div class="total">Total a pagar: <strong class="fi-money">{{ formatMoney(total, currency) }}</strong></div>
    </template>
  </pv-data-table>
</template>

<style scoped>
.total {
  text-align: right;
}
</style>

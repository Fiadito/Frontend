<script setup>
import {computed} from 'vue';
import {EffectiveRate, RatePeriod} from '@/shared/domain/model/effective-rate.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';

/**
 * Shows the conversion of an effective rate to TED, TEQ, TEM and TEA (7 decimals in %).
 * Used for the rate of a sale (its TEQ is the rate of each installment) and for the late rate.
 */
const props = defineProps({
  title: {type: String, default: 'Conversión de la tasa'},
  period: {type: String, required: true},
  value: {type: Number, default: null}
});
const {formatRate} = useFormatting();

const conversion = computed(() => {
  if (props.value === null || !(props.value >= 0) || !RatePeriod[props.period]) return null;
  const rate = new EffectiveRate(props.period, props.value);
  return {ted: rate.toDaily(), teq: rate.toPeriod('TEQ'), tem: rate.toPeriod('TEM'), tea: rate.toAnnual()};
});
const percent = computed(() => (props.value === null ? '—' : `${(props.value * 100).toFixed(7).replace(/\.?0+$/, '')}%`));
</script>

<template>
  <div class="fi-summary" aria-live="polite">
    <h3 class="conversion__title">{{ title }}</h3>
    <dl v-if="conversion">
      <dt>Tasa efectiva diaria (TED)</dt>
      <dd><strong>{{ formatRate(conversion.ted) }}</strong></dd>
      <dt>Tasa efectiva quincenal (TEQ)</dt>
      <dd>{{ formatRate(conversion.teq) }}</dd>
      <dt>Tasa efectiva mensual (TEM)</dt>
      <dd>{{ formatRate(conversion.tem) }}</dd>
      <dt>TEA equivalente</dt>
      <dd>{{ formatRate(conversion.tea) }}</dd>
    </dl>
    <p v-else class="fi-muted">Ingresa la tasa para ver su conversión.</p>
    <p v-if="RatePeriod[period]" class="fi-formula">TED = (1 + {{ percent }})^(1/{{ RatePeriod[period].days }}) − 1</p>
  </div>
</template>

<style scoped>
.conversion__title {
  margin: 0 0 .6rem;
  color: var(--fi-primary);
  font-size: 1rem;
}

.fi-formula {
  margin: .7rem 0 0;
}
</style>

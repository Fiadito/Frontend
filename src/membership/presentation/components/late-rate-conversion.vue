<script setup>
import {computed} from 'vue';
import {EffectiveRate, RatePeriod} from '@/shared/domain/model/effective-rate.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';

/**
 * Shows the conversion of the agreed late rate to TED (formula 1) and its equivalents.
 */
const props = defineProps({period: {type: String, required: true}, value: {type: Number, default: null}});
const {formatRate} = useFormatting();

const conversion = computed(() => {
  if (props.value === null || !(props.value >= 0)) return null;
  const rate = new EffectiveRate(props.period, props.value);
  return {n: rate.days, ted: rate.toDaily(), teq: rate.toPeriod('TEQ'), tem: rate.toPeriod('TEM'), tea: rate.toPeriod('TEA')};
});
const percent = computed(() => (props.value === null ? '—' : `${(props.value * 100).toFixed(7).replace(/\.?0+$/, '')}%`));
</script>

<template>
  <div class="fi-summary" aria-live="polite">
    <h3 class="conversion__title">Conversión de la tasa moratoria</h3>
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
    <p class="fi-formula">TED = (1 + {{ percent }})^(1/{{ RatePeriod[period].days }}) − 1</p>
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

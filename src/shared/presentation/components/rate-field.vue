<script setup>
import {ratePeriods} from '@/shared/domain/model/effective-rate.js';
import FieldHelp from '@/shared/presentation/components/field-help.vue';

/**
 * Period (TEA, TES, TET, TEM, TEQ) + value in % of an effective rate.
 * Use with v-model:period and v-model:percent (the percent is a number like 20 for 20 %).
 */
defineProps({
  idPrefix: {type: String, required: true},
  label: {type: String, default: 'Tasa efectiva'},
  help: {type: String, default: ''},
  hint: {type: String, default: ''},
  disabled: {type: Boolean, default: false}
});
const period = defineModel('period', {type: String, required: true});
const percent = defineModel('percent', {type: Number, default: null});
</script>

<template>
  <div class="fi-grid fi-grid--2 rate-field">
    <div class="fi-field">
      <label :for="`${idPrefix}-period`">Periodo de la tasa <field-help v-if="help" :text="help"/></label>
      <pv-select :input-id="`${idPrefix}-period`" v-model="period" :options="ratePeriods()" option-label="label" option-value="code"
                 :disabled="disabled"/>
    </div>
    <div class="fi-field">
      <label :for="`${idPrefix}-value`">{{ label }} (%)</label>
      <pv-input-group>
        <pv-input-number :input-id="`${idPrefix}-value`" v-model="percent" :min-fraction-digits="2" :max-fraction-digits="7" locale="en-US"
                         :min="0" :disabled="disabled"/>
        <pv-input-group-addon>%</pv-input-group-addon>
      </pv-input-group>
      <small v-if="hint" class="fi-hint">{{ hint }}</small>
    </div>
  </div>
</template>

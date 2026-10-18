<script setup>
import {computed, reactive, ref, watch} from 'vue';
import {Member} from '@/membership/domain/model/member.entity.js';
import {CreditPolicy} from '@/credit/domain/model/credit-policy.js';
import {ratePeriods} from '@/shared/domain/model/effective-rate.js';
import {membershipStore} from '@/membership/application/membership.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import FieldHelp from '@/shared/presentation/components/field-help.vue';
import LateRateConversion from '@/membership/presentation/components/late-rate-conversion.vue';

/**
 * Registrar / Editar socio (Figura 5): personal data, effective late rate (≥ 40 %), credit
 * conditions and access of the member, with the conversion of the late rate to TED.
 */
const props = defineProps({visible: {type: Boolean, default: false}, member: {type: Object, default: null}});
const emit = defineEmits(['update:visible', 'saved']);

const blank = () => ({
  dni: '', fullName: '', phone: '', address: '', currency: 'PEN', lateRatePeriod: CreditPolicy.DEFAULT_LATE_RATE_PERIOD,
  lateRatePercent: CreditPolicy.DEFAULT_LATE_RATE * 100, creditLimit: CreditPolicy.DEFAULT_CREDIT_LIMIT,
  maxInstallments: CreditPolicy.MAX_INSTALLMENTS, email: '', password: ''
});
const form = reactive(blank());
const error = ref('');
const saving = ref(false);
const isNew = computed(() => !props.member);

watch(() => props.visible, visible => {
  if (!visible) return;
  error.value = '';
  Object.assign(form, blank());
  if (props.member) {
    const m = props.member;
    Object.assign(form, {
      dni: m.dni, fullName: m.fullName, phone: m.phone, address: m.address, currency: m.currency, lateRatePeriod: m.lateRatePeriod,
      lateRatePercent: Number((m.lateRateValue * 100).toFixed(7)), creditLimit: m.creditLimit, maxInstallments: m.maxInstallments
    });
    form.email = m.email;
  }
});

const close = () => emit('update:visible', false);

const save = async () => {
  error.value = '';
  saving.value = true;
  try {
    const member = new Member({
      id: props.member?.id ?? null, businessId: iamStore.currentUser.businessId, dni: form.dni.trim(), fullName: form.fullName,
      phone: form.phone ?? '', address: form.address, currency: form.currency, lateRatePeriod: form.lateRatePeriod,
      lateRateValue: form.lateRatePercent === null ? NaN : Number((form.lateRatePercent / 100).toFixed(9)),
      creditLimit: form.creditLimit ?? NaN, maxInstallments: form.maxInstallments ?? NaN, status: props.member?.status ?? 'ACTIVO'
    });
    await membershipStore.save(member, isNew.value && form.email ? {email: form.email, password: form.password} : null);
    emit('saved', isNew.value ? 'Socio registrado.' : 'Cambios guardados.');
    close();
  } catch (message) {
    error.value = String(message);
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <pv-dialog :visible="visible" modal :header="isNew ? 'Registrar socio' : 'Editar socio'" :style="{ width: 'min(960px, 96vw)' }"
             :draggable="false" @update:visible="emit('update:visible', $event)">
    <form id="member-form" novalidate @submit.prevent="save">
      <pv-message v-if="error" severity="error" :closable="false" role="alert" class="mb-3">{{ error }}</pv-message>

      <section class="fi-section">
        <h3 class="fi-section__title">Datos del socio</h3>
        <div class="fi-section__body fi-grid fi-grid--3">
          <div class="fi-field">
            <label for="dni">DNI <field-help text="Documento Nacional de Identidad: 8 dígitos. No puede repetirse en tu negocio."/></label>
            <pv-input-text id="dni" v-model="form.dni" inputmode="numeric" maxlength="8" placeholder="8 dígitos"/>
          </div>
          <div class="fi-field">
            <label for="fullName">Nombres y apellidos <field-help text="Nombre completo del socio, como figura en su DNI."/></label>
            <pv-input-text id="fullName" v-model="form.fullName"/>
          </div>
          <div class="fi-field">
            <label for="phone">Celular <field-help text="Número de 9 dígitos que empieza con 9 (opcional)."/></label>
            <pv-input-text id="phone" v-model="form.phone" inputmode="tel" maxlength="11" placeholder="987451220"/>
          </div>
          <div class="fi-field" style="grid-column: span 2">
            <label for="address">Dirección <field-help text="Domicilio del socio (opcional)."/></label>
            <pv-input-text id="address" v-model="form.address"/>
          </div>
          <div class="fi-field">
            <label for="currency">Moneda del crédito <field-help text="Moneda en la que se registran las compras del socio: soles o dólares."/></label>
            <pv-select input-id="currency" v-model="form.currency" :options="CreditPolicy.CURRENCIES" option-label="label" option-value="code"/>
          </div>
        </div>
      </section>

      <div class="fi-grid fi-grid--2 mt-3 rate-row">
        <section class="fi-section">
          <h3 class="fi-section__title">Tasa efectiva moratoria</h3>
          <div class="fi-section__body fi-grid fi-grid--2">
            <div class="fi-field">
              <label for="period">Periodo de la tasa <field-help text="Periodo en que se pacta la tasa efectiva: anual, semestral, trimestral, mensual o quincenal. Solo se usan tasas efectivas."/></label>
              <pv-select input-id="period" v-model="form.lateRatePeriod" :options="ratePeriods()" option-label="label" option-value="code"/>
            </div>
            <div class="fi-field">
              <label for="rate">Tasa efectiva (%) <field-help text="Tasa efectiva moratoria pactada, mínimo 40 %. Se cobra solo por los días de atraso después de la fecha de pago."/></label>
              <pv-input-group>
                <pv-input-number input-id="rate" v-model="form.lateRatePercent" :min-fraction-digits="7" :max-fraction-digits="7" locale="en-US" :min="0"/>
                <pv-input-group-addon>%</pv-input-group-addon>
              </pv-input-group>
              <small class="fi-hint">Mínimo 40 %. Por defecto TEA 60 %.</small>
            </div>
          </div>
        </section>
        <late-rate-conversion :period="form.lateRatePeriod" :value="form.lateRatePercent === null ? null : form.lateRatePercent / 100"/>
      </div>

      <section class="fi-section mt-3">
        <h3 class="fi-section__title">Condiciones del crédito</h3>
        <div class="fi-section__body fi-grid fi-grid--4">
          <div class="fi-field">
            <label for="limit">Límite de crédito <field-help text="Deuda máxima que puede tener el socio: entre S/ 400.00 y S/ 1,000.00."/></label>
            <pv-input-group>
              <pv-input-group-addon>{{ form.currency === 'USD' ? 'US$' : 'S/' }}</pv-input-group-addon>
              <pv-input-number input-id="limit" v-model="form.creditLimit" :min-fraction-digits="2" :max-fraction-digits="2" locale="en-US"/>
            </pv-input-group>
            <small class="fi-hint">Entre S/ 400.00 y S/ 1,000.00</small>
          </div>
          <div class="fi-field">
            <label for="maxInstallments">Cuotas quincenales máximas <field-help text="Número máximo de cuotas quincenales que puede elegir el socio, de 1 a 8 (4 meses)."/></label>
            <pv-input-number input-id="maxInstallments" v-model="form.maxInstallments" show-buttons :min="1" :max="8"/>
            <small class="fi-hint">Máximo 8 cuotas = 4 meses</small>
          </div>
          <div class="fi-field">
            <label for="cutoffs">Fechas de corte <field-help text="Regla fija del sistema: las compras hasta el día 10 o 25 (23:59) se pagan en la fecha de pago siguiente."/></label>
            <pv-input-text id="cutoffs" model-value="Días 10 y 25 · 23:59" disabled/>
          </div>
          <div class="fi-field">
            <label for="paydays">Fechas de pago <field-help text="Regla fija del sistema: días 15 y 30 (o el último día del mes)."/></label>
            <pv-input-text id="paydays" model-value="Días 15 y 30" disabled/>
          </div>
        </div>
      </section>

      <section class="fi-section mt-3">
        <h3 class="fi-section__title">Acceso del socio</h3>
        <div class="fi-section__body fi-grid fi-grid--2">
          <div class="fi-field">
            <label for="memberEmail">Correo electrónico <field-help text="Con este correo el socio consulta su estado de cuenta. Es opcional y no puede estar usado por otra cuenta."/></label>
            <pv-input-text id="memberEmail" v-model="form.email" type="email" :disabled="!isNew" placeholder="socio@correo.pe"/>
          </div>
          <div class="fi-field">
            <label for="memberPassword">Contraseña inicial <field-help text="Mínimo 8 caracteres. Entrégala al socio para que ingrese a Fiadito."/></label>
            <pv-password input-id="memberPassword" v-model="form.password" :feedback="false" toggle-mask :disabled="!isNew"
                         autocomplete="new-password" :placeholder="isNew ? 'Mínimo 8 caracteres' : 'Sin cambios'" fluid/>
          </div>
        </div>
      </section>
    </form>
    <template #footer>
      <pv-button label="Cancelar" text severity="secondary" @click="close"/>
      <pv-button type="submit" form="member-form" :label="isNew ? 'Registrar socio' : 'Guardar cambios'" icon="pi pi-check" :loading="saving"/>
    </template>
  </pv-dialog>
</template>

<style scoped>
.mb-3 {
  margin-bottom: 1rem;
}

.mt-3 {
  margin-top: 1rem;
}

.rate-row {
  align-items: stretch;
}

.rate-row .fi-section + .fi-summary {
  margin: 0;
}
</style>

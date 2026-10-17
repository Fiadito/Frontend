<script setup>
import {reactive, ref} from 'vue';
import {useRouter} from 'vue-router';
import {iamStore} from '@/iam/application/iam.store.js';
import {Business, businessLines} from '@/iam/domain/model/business.entity.js';
import BrandMark from '@/shared/presentation/components/brand-mark.vue';
import FieldHelp from '@/shared/presentation/components/field-help.vue';

/**
 * Registra tu negocio (Figura 2, module 7.2): creates the business and its NEGOCIO account.
 */
const router = useRouter();
const form = reactive({ruc: '', name: '', line: null, address: '', responsible: '', email: '', password: '', confirmation: ''});
const error = ref('');
const loading = ref(false);

const submit = async () => {
  error.value = '';
  loading.value = true;
  try {
    const business = new Business({ruc: form.ruc.trim(), name: form.name, line: form.line ?? '', address: form.address});
    await iamStore.registerBusiness(business, {responsible: form.responsible, email: form.email, password: form.password, confirmation: form.confirmation});
    await router.push({name: 'sign-in', query: {registered: '1'}});
  } catch (message) {
    error.value = String(message);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="signup">
    <form class="signup__form" novalidate @submit.prevent="submit">
      <div class="signup__head">
        <brand-mark size="lg"/>
        <h1>Registra tu negocio</h1>
        <p class="fi-muted">Empieza a llevar tus cuentas con claridad.</p>
      </div>

      <pv-message v-if="error" severity="error" :closable="false" role="alert">{{ error }}</pv-message>

      <div class="fi-grid fi-grid--2">
        <div class="fi-field">
          <label for="ruc">RUC <field-help text="Registro Único de Contribuyentes del negocio: 11 dígitos, sin espacios."/></label>
          <pv-input-text id="ruc" v-model="form.ruc" inputmode="numeric" maxlength="11" placeholder="11 dígitos" size="large"/>
        </div>
        <div class="fi-field">
          <label for="name">Nombre comercial <field-help text="Nombre con el que tus socios conocen al negocio (ej. Fuerza Norte Gym)."/></label>
          <pv-input-text id="name" v-model="form.name" placeholder="Ingresa el nombre comercial" size="large"/>
        </div>
        <div class="fi-field">
          <label for="line">Giro <field-help text="Rubro o actividad principal del negocio."/></label>
          <pv-select input-id="line" v-model="form.line" :options="businessLines" placeholder="Selecciona una opción" size="large"/>
        </div>
        <div class="fi-field">
          <label for="address">Dirección <field-help text="Dirección del local: calle, número y distrito."/></label>
          <pv-input-text id="address" v-model="form.address" placeholder="Ingresa la dirección de tu negocio" size="large"/>
        </div>
        <div class="fi-field">
          <label for="responsible">Responsable <field-help text="Persona que administrará la cuenta del negocio en Fiadito."/></label>
          <pv-input-text id="responsible" v-model="form.responsible" placeholder="Ingresa el nombre del responsable" size="large"/>
        </div>
        <div class="fi-field">
          <label for="email">Correo electrónico <field-help text="Será tu usuario para iniciar sesión. No puede estar registrado en otra cuenta."/></label>
          <pv-input-text id="email" v-model="form.email" type="email" autocomplete="username" placeholder="ejemplo@correo.com" size="large"/>
        </div>
        <div class="fi-field">
          <label for="password">Contraseña <field-help text="Mínimo 8 caracteres. Combina letras y números."/></label>
          <pv-password input-id="password" v-model="form.password" toggle-mask autocomplete="new-password" placeholder="Mínimo 8 caracteres"
                       prompt-label="Elige una contraseña" weak-label="Débil" medium-label="Media" strong-label="Fuerte" size="large" fluid/>
        </div>
        <div class="fi-field">
          <label for="confirmation">Confirmar contraseña <field-help text="Vuelve a escribir la misma contraseña."/></label>
          <pv-password input-id="confirmation" v-model="form.confirmation" :feedback="false" toggle-mask autocomplete="new-password"
                       placeholder="Vuelve a ingresar tu contraseña" size="large" fluid/>
        </div>
      </div>

      <pv-button type="submit" label="Crear cuenta" size="large" class="signup__submit" :loading="loading"/>
      <p class="signup__alt">¿Ya tienes una cuenta? <router-link :to="{ name: 'sign-in' }">Inicia sesión</router-link></p>
      <p class="signup__secure"><i class="pi pi-lock"></i> Acceso seguro para tu negocio</p>
    </form>
  </main>
</template>

<style scoped>
.signup {
  min-height: 100vh;
  background: #fff;
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
}

.signup__form {
  width: min(100%, 950px);
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.signup__head {
  display: grid;
  justify-items: center;
  gap: .6rem;
  text-align: center;
}

.signup__head h1 {
  font-size: clamp(2rem, 4vw, 3.2rem);
}

.signup__head p {
  margin: 0;
  font-size: 1.15rem;
}

.signup__submit {
  width: min(100%, 520px);
  align-self: center;
}

.signup__alt, .signup__secure {
  margin: 0;
  text-align: center;
}

.signup__secure {
  color: var(--fi-soft);
  font-size: .85rem;
}
</style>

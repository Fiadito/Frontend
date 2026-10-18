<script setup>
import {reactive, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {iamStore} from '@/iam/application/iam.store.js';
import {homeRouteFor} from '@/router/index.js';
import BrandMark from '@/shared/presentation/components/brand-mark.vue';
import FieldHelp from '@/shared/presentation/components/field-help.vue';

/**
 * Iniciar sesión (Figura 1): the business or the member signs in with email and password and is
 * sent to the screen of his role.
 */
const router = useRouter();
const route = useRoute();
const form = reactive({email: '', password: ''});
const error = ref('');
const loading = ref(false);

const submit = async () => {
  error.value = '';
  if (!form.email || !form.password) {
    error.value = 'Ingresa tu correo electrónico y tu contraseña.';
    return;
  }
  loading.value = true;
  try {
    const user = await iamStore.signIn(form.email, form.password);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null;
    await router.push(redirect ?? homeRouteFor(user));
  } catch (message) {
    error.value = String(message);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="auth">
    <form class="auth__card" novalidate @submit.prevent="submit">
      <div class="auth__head">
        <brand-mark size="lg"/>
        <h1>Inicia sesión</h1>
        <p class="fi-muted">Tus cuentas claras, siempre.</p>
      </div>

      <pv-message v-if="route.query.registered" severity="success" :closable="false">Cuenta creada. Ya puedes iniciar sesión.</pv-message>
      <pv-message v-if="route.query.expired" severity="warn" :closable="false">Tu sesión expiró. Vuelve a iniciar sesión.</pv-message>
      <pv-message v-if="error" severity="error" :closable="false" role="alert">{{ error }}</pv-message>

      <div class="fi-field">
        <label for="email">Correo electrónico
          <field-help text="Correo con el que se registró el negocio o el que el negocio asignó al socio."/>
        </label>
        <pv-input-text id="email" v-model="form.email" type="email" autocomplete="username" placeholder="Ingresa tu correo electrónico" size="large"/>
      </div>
      <div class="fi-field">
        <label for="password">Contraseña
          <field-help text="Mínimo 8 caracteres. Distingue mayúsculas y minúsculas."/>
        </label>
        <pv-password input-id="password" v-model="form.password" :feedback="false" toggle-mask autocomplete="current-password"
                     placeholder="Ingresa tu contraseña" size="large" fluid/>
      </div>

      <pv-button type="submit" label="Ingresar" size="large" :loading="loading" fluid/>

      <div class="auth__alt">
        <p class="fi-muted">¿Tu negocio aún no tiene cuenta?</p>
        <router-link :to="{ name: 'business-sign-up' }"><strong>Registra tu negocio</strong></router-link>
      </div>
      <p class="auth__secure"><i class="pi pi-lock"></i> Acceso seguro para tu negocio y sus socios</p>
    </form>
  </main>
</template>

<style scoped>
.auth {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
  background: #fff;
}

.auth__card {
  width: min(100%, 585px);
  border: 1px solid var(--fi-line);
  border-radius: 16px;
  padding: 2.5rem 2.3rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
  background: #fff;
}

.auth__head {
  display: grid;
  justify-items: center;
  gap: .7rem;
  text-align: center;
}

.auth__head p {
  margin: 0;
  font-size: 1.15rem;
}

.auth__alt {
  border-top: 1px solid var(--fi-line);
  padding-top: 1rem;
  text-align: center;
}

.auth__alt p {
  margin: 0 0 .2rem;
}

.auth__secure {
  margin: 0 -2.3rem;
  padding: 1rem 0 0;
  border-top: 1px solid var(--fi-line);
  text-align: center;
  color: var(--fi-soft);
  font-size: .85rem;
}

@media (max-width: 520px) {
  .auth__card {
    padding: 1.6rem 1.2rem 1rem;
  }

  .auth__secure {
    margin: 0 -1.2rem;
  }
}
</style>

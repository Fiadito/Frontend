<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {iamStore} from '@/iam/application/iam.store.js';
import {systemClock} from '@/shared/domain/model/system-clock.js';
import BrandMark from '@/shared/presentation/components/brand-mark.vue';

/**
 * Main layout: side menu by role, top bar with the business, the user and "Cerrar sesión".
 */
const route = useRoute();
const router = useRouter();
const toast = useToast();
const menuOpen = ref(false);

const businessMenu = [
  {label: 'Panel', icon: 'pi pi-home', to: {name: 'panel'}},
  {label: 'Socios', icon: 'pi pi-users', to: {name: 'members'}},
  {label: 'Productos', icon: 'pi pi-box', to: {name: 'products'}},
  {label: 'Registrar venta', icon: 'pi pi-shopping-cart', to: {name: 'sale-registration'}},
  {label: 'Reporte de corte', icon: 'pi pi-file', to: {name: 'cutoff-report'}},
  {label: 'Registrar pago', icon: 'pi pi-credit-card', to: {name: 'payment-registration'}},
  {label: 'Bitácora', icon: 'pi pi-history', to: {name: 'operations-log'}}
];
const memberMenu = [{label: 'Mi estado de cuenta', icon: 'pi pi-wallet', to: {name: 'my-account'}}];

const user = computed(() => iamStore.currentUser);
const items = computed(() => (user.value?.isMember() ? memberMenu : businessMenu));
const isActive = item => route.name === item.to.name || (item.to.name === 'members' && route.name === 'member-statement');
const today = systemClock.today().format();

/** CerrarSesion. */
const signOut = () => {
  iamStore.signOut();
  router.push({name: 'sign-in'});
};

const notifyDenied = () => {
  if (route.query.denied) {
    toast.add({severity: 'warn', summary: 'Acceso denegado', detail: 'Tu cuenta no tiene permiso para abrir esa pantalla.', life: 4000});
    router.replace({query: {}});
  }
};

onMounted(notifyDenied);
watch(() => route.fullPath, () => {
  menuOpen.value = false;
  notifyDenied();
});
</script>

<template>
  <div class="shell" :class="{ 'shell--open': menuOpen }">
    <aside class="sidebar" aria-label="Menú principal">
      <div class="sidebar__brand">
        <brand-mark/>
      </div>
      <nav>
        <router-link v-for="item in items" :key="item.label" :to="item.to" class="sidebar__link"
                     :class="{ 'sidebar__link--active': isActive(item) }">
          <i :class="item.icon" aria-hidden="true"></i>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <p class="sidebar__footer">Cortes: días 10 y 25 (23:59)<br>Pagos: días 15 y 30</p>
    </aside>
    <div class="backdrop" @click="menuOpen = false"></div>

    <div class="main">
      <header class="topbar">
        <button class="topbar__menu" type="button" aria-label="Abrir menú" @click="menuOpen = !menuOpen"><i class="pi pi-bars"></i></button>
        <strong class="topbar__business">{{ user?.businessName }}</strong>
        <span class="topbar__spacer"></span>
        <span v-if="systemClock.isSimulated()" class="fi-badge fi-badge--warn" title="Fecha simulada con VITE_SYSTEM_DATE">
          <i class="pi pi-calendar"></i>Hoy: {{ today }}
        </span>
        <span class="topbar__user">
          <span class="topbar__avatar">{{ user?.initials }}</span>
          <span class="topbar__name">{{ user?.name }}</span>
        </span>
        <pv-button label="Cerrar sesión" icon="pi pi-sign-out" outlined size="small" @click="signOut"/>
      </header>
      <main class="content">
        <router-view/>
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--sidebar-width);
  background: #fff;
  border-right: 1px solid var(--fi-line);
  padding: 1.1rem .8rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  z-index: 30;
}

.sidebar__brand {
  padding: 0 .6rem;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: .3rem;
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: .9rem;
  padding: .75rem .9rem;
  border-radius: 10px;
  color: var(--fi-muted);
  text-decoration: none;
  font-size: 1rem;
}

.sidebar__link i {
  font-size: 1.1rem;
  width: 1.3rem;
}

.sidebar__link:hover {
  background: var(--fi-surface);
  color: var(--fi-text);
}

.sidebar__link--active, .sidebar__link--active:hover {
  background: var(--fi-primary-soft);
  color: var(--fi-primary);
  font-weight: 600;
}

.sidebar__footer {
  margin: auto 0 0;
  padding: .8rem;
  font-size: .78rem;
  color: var(--fi-soft);
}

.main {
  margin-left: var(--sidebar-width);
  min-width: 0;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: .8rem 1.5rem;
  background: #fff;
  border-bottom: 1px solid var(--fi-line);
}

.topbar__business {
  font-size: 1.2rem;
}

.topbar__spacer {
  flex: 1;
}

.topbar__user {
  display: inline-flex;
  align-items: center;
  gap: .55rem;
}

.topbar__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--fi-primary-soft);
  color: var(--fi-primary);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: .85rem;
}

.topbar__menu {
  display: none;
  border: 0;
  background: transparent;
  font-size: 1.2rem;
  color: var(--fi-text);
  cursor: pointer;
}

.content {
  padding: 1.5rem;
  max-width: 1400px;
}

.backdrop {
  display: none;
}

@media (max-width: 900px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform .2s;
  }

  .shell--open .sidebar {
    transform: none;
  }

  .shell--open .backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 27, 61, .35);
    z-index: 25;
  }

  .main {
    margin-left: 0;
  }

  .topbar {
    padding: .7rem 1rem;
    gap: .6rem;
  }

  .topbar__menu {
    display: inline-block;
  }

  .topbar__name, .topbar__business {
    display: none;
  }

  .content {
    padding: 1rem;
  }
}
</style>

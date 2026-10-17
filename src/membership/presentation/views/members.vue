<script setup>
import {computed, onMounted, ref} from 'vue';
import {useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {useConfirm} from 'primevue/useconfirm';
import {membershipStore} from '@/membership/application/membership.store.js';
import {billingStore} from '@/billing/application/billing.store.js';
import {useBusinessData} from '@/dashboard/application/use-business-data.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import {RatePeriod} from '@/shared/domain/model/effective-rate.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import StatusBadge from '@/shared/presentation/components/status-badge.vue';
import MemberFormDialog from '@/membership/presentation/components/member-form-dialog.vue';

/**
 * Socios (Figura 4): list of members with their credit conditions, debt, available credit and
 * late status. From here the business registers, edits, gives low and opens the payment plan.
 */
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const {formatMoney, formatRate} = useFormatting();
const {loading, reload} = useBusinessData();

const search = ref('');
const statusFilter = ref('TODOS');
const statusOptions = [{label: 'Todos', value: 'TODOS'}, {label: 'Activos', value: 'ACTIVO'}, {label: 'Inactivos', value: 'INACTIVO'}, {label: 'Con mora', value: 'MORA'}];
const dialogVisible = ref(false);
const editing = ref(null);

const rows = computed(() => membershipStore.members.map(member => {
  const statement = billingStore.statementOf(member);
  return {member, capitalDebt: statement.capitalDebt, available: statement.availableCredit, overdue: statement.isOverdue};
}));

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  return rows.value.filter(row => {
    if (term && !row.member.dni.includes(term) && !row.member.fullName.toLowerCase().includes(term)) return false;
    if (statusFilter.value === 'MORA') return row.overdue;
    return statusFilter.value === 'TODOS' || row.member.status === statusFilter.value;
  });
});

const openNew = () => {
  editing.value = null;
  dialogVisible.value = true;
};

const openEdit = member => {
  editing.value = member;
  dialogVisible.value = true;
};

const onSaved = message => toast.add({severity: 'success', summary: message, life: 3000});

const toggleStatus = row => {
  const deactivating = row.member.isActive;
  confirm.require({
    header: deactivating ? 'Dar de baja al socio' : 'Reactivar socio',
    message: deactivating ? `¿Dar de baja a ${row.member.fullName}? Ya no podrá comprar al crédito.` : `¿Reactivar a ${row.member.fullName}?`,
    icon: 'pi pi-exclamation-triangle',
    acceptProps: {label: deactivating ? 'Dar de baja' : 'Reactivar', severity: deactivating ? 'danger' : 'primary'},
    rejectProps: {label: 'Cancelar', severity: 'secondary', text: true},
    accept: async () => {
      try {
        await membershipStore.toggleStatus(row.member, row.capitalDebt);
        toast.add({severity: 'success', summary: deactivating ? 'Socio dado de baja.' : 'Socio reactivado.', life: 3000});
      } catch (message) {
        toast.add({severity: 'error', summary: 'No se pudo cambiar el estado', detail: String(message), life: 5000});
      }
    }
  });
};

onMounted(reload);
</script>

<template>
  <section class="fi-card">
    <page-header title="Socios" subtitle="Administra los socios y sus condiciones de crédito en Fiadito.">
      <pv-button label="Registrar socio" icon="pi pi-plus" @click="openNew"/>
    </page-header>

    <div class="toolbar">
      <pv-icon-field class="toolbar__search">
        <pv-input-icon class="pi pi-search"/>
        <pv-input-text v-model="search" placeholder="Buscar por DNI o nombre..." aria-label="Buscar socio" fluid/>
      </pv-icon-field>
      <div class="fi-field toolbar__status">
        <label for="status">Estado</label>
        <pv-select input-id="status" v-model="statusFilter" :options="statusOptions" option-label="label" option-value="value"/>
      </div>
    </div>

    <pv-data-table :value="filtered" :loading="loading" data-key="member.id" paginator :rows="8" scrollable
                   paginator-template="CurrentPageReport PrevPageLink PageLinks NextPageLink"
                   current-page-report-template="Mostrando {first} a {last} de {totalRecords} socios">
      <template #empty>
        <div class="fi-empty"><i class="pi pi-users"></i><strong>No hay socios para mostrar</strong><span>Registra tu primer socio con el botón “Registrar socio”.</span></div>
      </template>
      <pv-column field="member.dni" header="DNI"/>
      <pv-column field="member.fullName" header="Socio" sortable/>
      <pv-column header="Tasa moratoria">
        <template #body="{ data }"><span class="fi-money">{{ RatePeriod[data.member.lateRatePeriod].code }} {{ formatRate(data.member.lateRateValue) }}</span></template>
      </pv-column>
      <pv-column header="Moneda">
        <template #body="{ data }">{{ data.member.currency === 'USD' ? 'USD (US$)' : 'PEN (S/)' }}</template>
      </pv-column>
      <pv-column header="Límite">
        <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.member.creditLimit, data.member.currency) }}</span></template>
      </pv-column>
      <pv-column header="Deuda">
        <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.capitalDebt, data.member.currency) }}</span></template>
      </pv-column>
      <pv-column header="Disponible">
        <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.available, data.member.currency) }}</span></template>
      </pv-column>
      <pv-column field="member.maxInstallments" header="Cuotas máx."/>
      <pv-column header="Mora">
        <template #body="{ data }"><span v-if="data.overdue" class="fi-badge fi-badge--bad">Con mora</span><span v-else>–</span></template>
      </pv-column>
      <pv-column header="Estado">
        <template #body="{ data }"><status-badge :status="data.member.status"/></template>
      </pv-column>
      <pv-column header="Acciones">
        <template #body="{ data }">
          <div class="actions">
            <pv-button icon="pi pi-calendar" severity="info" variant="outlined" size="small" aria-label="Ver plan de pago"
                       v-tooltip.top="'Plan de pago y estado de cuenta'" @click="router.push({ name: 'member-statement', params: { memberId: data.member.id } })"/>
            <pv-button icon="pi pi-pencil" severity="info" variant="outlined" size="small" aria-label="Editar socio"
                       v-tooltip.top="'Editar'" @click="openEdit(data.member)"/>
            <pv-button :icon="data.member.isActive ? 'pi pi-trash' : 'pi pi-replay'" :severity="data.member.isActive ? 'danger' : 'success'"
                       variant="outlined" size="small" :aria-label="data.member.isActive ? 'Dar de baja' : 'Reactivar'"
                       v-tooltip.top="data.member.isActive ? 'Dar de baja' : 'Reactivar'" @click="toggleStatus(data)"/>
          </div>
        </template>
      </pv-column>
    </pv-data-table>
  </section>

  <member-form-dialog v-model:visible="dialogVisible" :member="editing" @saved="onSaved"/>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 0;
  border-top: 1px solid var(--fi-line);
}

.toolbar__search {
  width: min(100%, 430px);
}

.toolbar__status {
  width: 210px;
}

.actions {
  display: flex;
  gap: .4rem;
}
</style>

<script setup>
import {computed, onMounted, ref} from 'vue';
import {useToast} from 'primevue/usetoast';
import {useConfirm} from 'primevue/useconfirm';
import {catalogStore} from '@/catalog/application/catalog.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {saleModeLabels} from '@/catalog/domain/model/sale-mode.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import StatusBadge from '@/shared/presentation/components/status-badge.vue';
import SaleModeBadge from '@/catalog/presentation/components/sale-mode-badge.vue';
import ProductFormDialog from '@/catalog/presentation/components/product-form-dialog.vue';

/**
 * Productos (Figura 6): products and services of the business with prices, sale mode and status.
 */
const toast = useToast();
const confirm = useConfirm();
const {formatMoney} = useFormatting();
const search = ref('');
const dialogVisible = ref(false);
const editing = ref(null);

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  return catalogStore.products.filter(product => !term || [product.description, product.brand, product.unit, saleModeLabels[product.saleMode]]
      .some(text => String(text).toLowerCase().includes(term)));
});

const openNew = () => {
  editing.value = null;
  dialogVisible.value = true;
};

const openEdit = product => {
  editing.value = product;
  dialogVisible.value = true;
};

const toggleStatus = product => {
  const deactivating = product.isActive;
  confirm.require({
    header: deactivating ? 'Dar de baja el producto' : 'Reactivar producto',
    message: deactivating ? `¿Dar de baja “${product.description}”? Ya no aparecerá en Registrar venta.` : `¿Reactivar “${product.description}”?`,
    icon: 'pi pi-exclamation-triangle',
    acceptProps: {label: deactivating ? 'Dar de baja' : 'Reactivar', severity: deactivating ? 'danger' : 'primary'},
    rejectProps: {label: 'Cancelar', severity: 'secondary', text: true},
    accept: () => catalogStore.toggleStatus(product)
        .then(() => toast.add({severity: 'success', summary: deactivating ? 'Producto dado de baja.' : 'Producto reactivado.', life: 3000}))
        .catch(message => toast.add({severity: 'error', summary: 'No se pudo cambiar el estado', detail: String(message), life: 5000}))
  });
};

onMounted(() => catalogStore.load(iamStore.currentUser.businessId)
    .catch(message => toast.add({severity: 'error', summary: 'No se pudieron cargar los productos', detail: String(message), life: 6000})));
</script>

<template>
  <section class="fi-card">
    <page-header title="Productos" subtitle="Gestiona los productos y servicios que ofreces en tu negocio.">
      <pv-button label="Agregar producto" icon="pi pi-plus-circle" @click="openNew"/>
    </page-header>

    <pv-icon-field class="search">
      <pv-input-icon class="pi pi-search"/>
      <pv-input-text v-model="search" placeholder="Buscar producto, marca o modalidad..." aria-label="Buscar producto" fluid/>
    </pv-icon-field>

    <pv-data-table :value="filtered" :loading="catalogStore.loading" data-key="id" paginator :rows="10" scrollable
                   paginator-template="CurrentPageReport PrevPageLink PageLinks NextPageLink"
                   current-page-report-template="Mostrando {first} a {last} de {totalRecords} productos">
      <template #empty>
        <div class="fi-empty"><i class="pi pi-box"></i><strong>No hay productos</strong><span>Agrega los productos o servicios que vendes al crédito.</span></div>
      </template>
      <pv-column header="Producto" sortable sort-field="description">
        <template #body="{ data }">
          <div class="product">
            <span class="product__image">
              <img v-if="data.imageUrl" :src="data.imageUrl" :alt="data.description">
              <i v-else class="pi pi-image"></i>
            </span>
            <strong>{{ data.description }}</strong>
          </div>
        </template>
      </pv-column>
      <pv-column field="brand" header="Marca" sortable/>
      <pv-column field="unit" header="Unidad"/>
      <pv-column header="Precio contado" sortable sort-field="cashPrice">
        <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.cashPrice) }}</span></template>
      </pv-column>
      <pv-column header="Precio de lista" sortable sort-field="listPrice">
        <template #body="{ data }"><span class="fi-money">{{ formatMoney(data.listPrice) }}</span></template>
      </pv-column>
      <pv-column header="Modalidad">
        <template #body="{ data }"><sale-mode-badge :mode="data.saleMode"/></template>
      </pv-column>
      <pv-column header="Estado">
        <template #body="{ data }"><status-badge :status="data.status"/></template>
      </pv-column>
      <pv-column header="Acciones">
        <template #body="{ data }">
          <div class="actions">
            <pv-button icon="pi pi-pencil" severity="secondary" variant="outlined" size="small" aria-label="Editar producto" v-tooltip.top="'Editar'" @click="openEdit(data)"/>
            <pv-button :icon="data.isActive ? 'pi pi-ban' : 'pi pi-replay'" :severity="data.isActive ? 'danger' : 'success'" variant="outlined" size="small"
                       :aria-label="data.isActive ? 'Dar de baja' : 'Reactivar'" v-tooltip.top="data.isActive ? 'Dar de baja' : 'Reactivar'" @click="toggleStatus(data)"/>
          </div>
        </template>
      </pv-column>
    </pv-data-table>
  </section>

  <product-form-dialog v-model:visible="dialogVisible" :product="editing"
                       @saved="message => toast.add({ severity: 'success', summary: message, life: 3000 })"/>
</template>

<style scoped>
.search {
  display: block;
  width: min(100%, 650px);
  margin-bottom: 1rem;
}

.product {
  display: flex;
  align-items: center;
  gap: .9rem;
  min-width: 220px;
}

.product__image {
  flex: none;
  width: 64px;
  height: 64px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--fi-surface);
  display: grid;
  place-items: center;
  color: var(--fi-soft);
}

.product__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.actions {
  display: flex;
  gap: .4rem;
}
</style>

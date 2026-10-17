<script setup>
import {computed, reactive, ref, watch} from 'vue';
import {Product, productUnits} from '@/catalog/domain/model/product.entity.js';
import {productSaleModes} from '@/catalog/domain/model/sale-mode.js';
import {catalogStore} from '@/catalog/application/catalog.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {readImageAsDataUrl} from '@/shared/infrastructure/image-file-reader.js';
import FieldHelp from '@/shared/presentation/components/field-help.vue';

/**
 * Agregar / Editar producto (Figura 7): description, brand, supplier, unit, prices,
 * sale mode and image (JPG or PNG up to 2 MB).
 */
const props = defineProps({visible: {type: Boolean, default: false}, product: {type: Object, default: null}});
const emit = defineEmits(['update:visible', 'saved']);

const blank = () => ({description: '', brand: '', supplier: '', unit: 'Unidad', cashPrice: null, listPrice: null, saleMode: 'AMBAS', imageUrl: ''});
const form = reactive(blank());
const error = ref('');
const saving = ref(false);
const fileInput = ref(null);
const isNew = computed(() => !props.product);

watch(() => props.visible, visible => {
  if (!visible) return;
  error.value = '';
  Object.assign(form, blank());
  if (props.product) {
    const p = props.product;
    Object.assign(form, {description: p.description, brand: p.brand, supplier: p.supplier, unit: p.unit, cashPrice: p.cashPrice,
      listPrice: p.listPrice, saleMode: p.saleMode, imageUrl: p.imageUrl});
  }
});

const close = () => emit('update:visible', false);

const onImageChosen = async event => {
  const [file] = event.target.files ?? [];
  event.target.value = '';
  if (!file) return;
  try {
    form.imageUrl = await readImageAsDataUrl(file);
    error.value = '';
  } catch (message) {
    error.value = String(message);
  }
};

const save = async () => {
  error.value = '';
  saving.value = true;
  try {
    await catalogStore.save(new Product({
      id: props.product?.id ?? null, businessId: iamStore.currentUser.businessId, description: form.description, brand: form.brand,
      supplier: form.supplier, unit: form.unit, imageUrl: form.imageUrl, cashPrice: form.cashPrice ?? 0, listPrice: form.listPrice ?? 0,
      saleMode: form.saleMode, status: props.product?.status ?? 'ACTIVO'
    }));
    emit('saved', isNew.value ? 'Producto agregado.' : 'Cambios guardados.');
    close();
  } catch (message) {
    error.value = String(message);
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <pv-dialog :visible="visible" modal :header="isNew ? 'Agregar producto' : 'Editar producto'" :style="{ width: 'min(560px, 96vw)' }"
             :draggable="false" @update:visible="emit('update:visible', $event)">
    <form id="product-form" class="form" novalidate @submit.prevent="save">
      <pv-message v-if="error" severity="error" :closable="false" role="alert">{{ error }}</pv-message>
      <div class="fi-field">
        <label for="description">Descripción <field-help text="Nombre del producto o servicio, con su sabor o detalle (ej. Proteína whey sabor Chocolate)."/></label>
        <pv-input-text id="description" v-model="form.description"/>
      </div>
      <div class="fi-field">
        <label for="brand">Marca <field-help text="Marca del producto (ej. Optimum Nutrition)."/></label>
        <pv-input-text id="brand" v-model="form.brand"/>
      </div>
      <div class="fi-field">
        <label for="supplier">Proveedor (opcional) <field-help text="Empresa que abastece el producto."/></label>
        <pv-input-text id="supplier" v-model="form.supplier"/>
      </div>
      <div class="fi-field">
        <label for="unit">Unidad de medida <field-help text="Presentación en la que se vende: botella, lata, frasco, bolsa, servicio, etc."/></label>
        <pv-select input-id="unit" v-model="form.unit" :options="productUnits" editable/>
      </div>
      <div class="fi-grid fi-grid--2">
        <div class="fi-field">
          <label for="cashPrice">Precio contado <field-help text="Precio de venta cuando se paga en el momento. Debe ser mayor que cero."/></label>
          <pv-input-group>
            <pv-input-group-addon>S/</pv-input-group-addon>
            <pv-input-number input-id="cashPrice" v-model="form.cashPrice" :min-fraction-digits="2" :max-fraction-digits="2" locale="en-US" :min="0"/>
          </pv-input-group>
        </div>
        <div class="fi-field">
          <label for="listPrice">Precio de lista (crédito) <field-help text="Precio que se usa en las ventas al fiado. Debe ser mayor o igual al precio contado."/></label>
          <pv-input-group>
            <pv-input-group-addon>S/</pv-input-group-addon>
            <pv-input-number input-id="listPrice" v-model="form.listPrice" :min-fraction-digits="2" :max-fraction-digits="2" locale="en-US" :min="0"/>
          </pv-input-group>
          <small class="fi-hint">Debe ser mayor o igual al precio contado</small>
        </div>
      </div>
      <div class="fi-field">
        <label for="saleMode">Modalidad de venta <field-help text="Formas de pago permitidas para el producto: pago único, cuotas quincenales o ambas."/></label>
        <pv-select input-id="saleMode" v-model="form.saleMode" :options="productSaleModes()" option-label="label" option-value="code"/>
      </div>
      <div class="fi-field">
        <span class="fi-label">Imagen del producto <field-help text="Foto del producto en JPG o PNG, de máximo 2 MB (opcional)."/></span>
        <div class="image">
          <div class="image__preview">
            <img v-if="form.imageUrl" :src="form.imageUrl" alt="Vista previa del producto">
            <i v-else class="pi pi-image" aria-hidden="true"></i>
          </div>
          <div>
            <pv-button type="button" :label="form.imageUrl ? 'Cambiar imagen' : 'Elegir imagen'" icon="pi pi-image" outlined @click="fileInput.click()"/>
            <p class="fi-hint">JPG o PNG, máximo 2 MB</p>
            <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" hidden @change="onImageChosen">
          </div>
        </div>
      </div>
    </form>
    <template #footer>
      <pv-button label="Cancelar" text severity="secondary" @click="close"/>
      <pv-button type="submit" form="product-form" :label="isNew ? 'Guardar producto' : 'Guardar cambios'" icon="pi pi-check" :loading="saving"/>
    </template>
  </pv-dialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.image {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.image__preview {
  width: 180px;
  height: 120px;
  border: 1px solid var(--fi-line);
  border-radius: 10px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--fi-surface);
  color: var(--fi-soft);
  font-size: 2rem;
}

.image__preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>

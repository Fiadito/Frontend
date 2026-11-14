<script setup>
import {computed, reactive, ref, watch} from 'vue';
import {Product, ProductType, productUnits} from '@/catalog/domain/model/product.entity.js';
import {productSaleModes} from '@/catalog/domain/model/sale-mode.js';
import {CreditPolicy} from '@/credit/domain/model/credit-policy.js';
import {catalogStore} from '@/catalog/application/catalog.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {readImageAsDataUrl} from '@/shared/infrastructure/image-file-reader.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import FieldHelp from '@/shared/presentation/components/field-help.vue';

/**
 * Agregar / Editar producto (Figura 7): description, brand, supplier, unit, prices, sale mode and image (JPG or PNG up to 2 MB).
 * It also creates combos: a fixed price of S/ 100, 200 or 400 and the products inside, with their value at list price.
 */
const props = defineProps({visible: {type: Boolean, default: false}, product: {type: Object, default: null}});
const emit = defineEmits(['update:visible', 'saved']);
const {formatMoney} = useFormatting();

const blank = () => ({
  type: ProductType.PRODUCT, description: '', brand: '', supplier: '', unit: 'Unidad', cashPrice: null, listPrice: null, saleMode: 'AMBAS',
  imageUrl: '', items: []
});
const form = reactive(blank());
const error = ref('');
const saving = ref(false);
const fileInput = ref(null);
const isNew = computed(() => !props.product);
const isCombo = computed(() => form.type === ProductType.COMBO);
const typeOptions = [{label: 'Producto', value: ProductType.PRODUCT}, {label: 'Combo (S/ 100, 200 o 400)', value: ProductType.COMBO}];
const comboPrices = CreditPolicy.COMBO_PRICES.map(price => ({label: `S/ ${price}.00`, value: price}));

/** Products that can go inside a combo: active single products (not combos, not itself). */
const comboCandidates = computed(() => catalogStore.products
    .filter(p => !p.isCombo && p.isActive && p.id !== props.product?.id)
    .map(p => ({id: p.id, label: `${p.displayName} · ${formatMoney(p.listPrice)}`, listPrice: p.listPrice})));
const priceOf = id => catalogStore.findById(id)?.listPrice ?? 0;
const contentValue = computed(() => form.items.reduce((sum, item) => sum + priceOf(item.productId) * (item.quantity || 0), 0));
const remaining = computed(() => Number(form.listPrice || 0) - contentValue.value);

watch(() => props.visible, visible => {
  if (!visible) return;
  error.value = '';
  Object.assign(form, blank());
  if (props.product) {
    const p = props.product;
    Object.assign(form, {type: p.type, description: p.description, brand: p.brand, supplier: p.supplier, unit: p.unit, cashPrice: p.cashPrice,
      listPrice: p.listPrice, saleMode: p.saleMode, imageUrl: p.imageUrl, items: p.items.map(i => ({productId: i.productId, quantity: i.quantity}))});
  }
});

watch(() => form.type, type => {
  if (type === ProductType.COMBO) {
    if (!CreditPolicy.COMBO_PRICES.includes(Number(form.listPrice))) form.listPrice = 100;
    if (!form.unit || form.unit === 'Unidad') form.unit = 'Combo';
    if (!form.items.length) form.items.push({productId: null, quantity: 1});
  }
});

const addItem = () => form.items.push({productId: null, quantity: 1});
const removeItem = index => form.items.splice(index, 1);
/** Sets the quantity of a line so the contents get as close as possible to the combo price without going over. */
const fillItem = index => {
  const item = form.items[index];
  const price = priceOf(item.productId);
  if (!price) return;
  const others = contentValue.value - price * (item.quantity || 0);
  item.quantity = Math.max(1, Math.floor((Number(form.listPrice) - others) / price));
};

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
  if (saving.value) return;
  error.value = '';
  saving.value = true;
  try {
    await catalogStore.save(new Product({
      id: props.product?.id ?? null, businessId: iamStore.currentUser.businessId, type: form.type, description: form.description, brand: form.brand,
      supplier: form.supplier, unit: form.unit, imageUrl: form.imageUrl, cashPrice: isCombo.value ? form.listPrice ?? 0 : form.cashPrice ?? 0,
      listPrice: form.listPrice ?? 0, saleMode: form.saleMode, status: props.product?.status ?? 'ACTIVO',
      items: isCombo.value ? form.items.map(i => ({productId: i.productId, quantity: i.quantity})) : []
    }));
    emit('saved', isNew.value ? (isCombo.value ? 'Combo agregado.' : 'Producto agregado.') : 'Cambios guardados.');
    close();
  } catch (message) {
    error.value = String(message);
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <pv-dialog :visible="visible" modal :header="isNew ? (isCombo ? 'Agregar combo' : 'Agregar producto') : (isCombo ? 'Editar combo' : 'Editar producto')"
             :style="{ width: isCombo ? 'min(760px, 96vw)' : 'min(560px, 96vw)' }" :draggable="false" @update:visible="emit('update:visible', $event)">
    <form id="product-form" class="form" novalidate @submit.prevent="save">
      <pv-message v-if="error" severity="error" :closable="false" role="alert">{{ error }}</pv-message>
      <div class="fi-field">
        <span class="fi-label">Tipo <field-help text="Un combo agrupa productos a un precio fijo de S/ 100, 200 o 400, para llegar al mínimo de compra sin vender cientos de unidades sueltas."/></span>
        <pv-select-button v-model="form.type" :options="typeOptions" option-label="label" option-value="value" :allow-empty="false" :disabled="!isNew"/>
      </div>
      <div class="fi-field">
        <label for="description">{{ isCombo ? 'Nombre del combo' : 'Descripción' }} <field-help text="Nombre del producto o combo, con su detalle (ej. Combo Hidratación: 20 aguas + 24 Gatorade)."/></label>
        <pv-input-text id="description" v-model="form.description"/>
      </div>
      <div class="fi-grid fi-grid--2">
        <div class="fi-field">
          <label for="brand">Marca <field-help text="Marca del producto (ej. Optimum Nutrition). En un combo, el nombre del negocio."/></label>
          <pv-input-text id="brand" v-model="form.brand"/>
        </div>
        <div class="fi-field">
          <label for="supplier">Proveedor (opcional) <field-help text="Empresa que abastece el producto."/></label>
          <pv-input-text id="supplier" v-model="form.supplier"/>
        </div>
      </div>

      <template v-if="!isCombo">
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
      </template>

      <template v-else>
        <div class="fi-field">
          <span class="fi-label">Precio del combo <field-help text="Precio fijo de crédito. Los de S/ 100 y 200 se venden en cantidad hasta llegar al mínimo de S/ 400."/></span>
          <pv-select-button v-model="form.listPrice" :options="comboPrices" option-label="label" option-value="value" :allow-empty="false"/>
        </div>
        <section class="fi-section">
          <h3 class="fi-section__title">Productos del combo</h3>
          <div class="fi-section__body items">
            <div v-for="(item, index) in form.items" :key="index" class="item">
              <pv-select v-model="item.productId" :options="comboCandidates" option-label="label" option-value="id" filter
                         placeholder="Producto" class="item__product" :aria-label="`Producto ${index + 1}`"/>
              <pv-input-number v-model="item.quantity" show-buttons :min="1" :max="999" class="item__qty" :aria-label="`Cantidad ${index + 1}`"/>
              <span class="item__subtotal fi-money">{{ formatMoney(priceOf(item.productId) * (item.quantity || 0)) }}</span>
              <pv-button icon="pi pi-arrows-h" text size="small" v-tooltip.top="'Completar hasta el precio del combo'" aria-label="Completar cantidad"
                         :disabled="!item.productId" @click="fillItem(index)"/>
              <pv-button icon="pi pi-times" text severity="danger" size="small" aria-label="Quitar producto" @click="removeItem(index)"/>
            </div>
            <pv-button type="button" label="Agregar producto" icon="pi pi-plus" text size="small" @click="addItem"/>
            <div class="content-total" :class="{ 'content-total--over': remaining < 0 }">
              Valor de los productos (precio de lista): <strong class="fi-money">{{ formatMoney(contentValue) }}</strong>
              · Precio del combo: <strong class="fi-money">{{ formatMoney(form.listPrice || 0) }}</strong>
              <span v-if="remaining > 0"> · faltan {{ formatMoney(remaining) }} para igualarlo</span>
              <span v-else-if="remaining < 0"> · el contenido supera el precio en {{ formatMoney(-remaining) }}</span>
            </div>
          </div>
        </section>
      </template>

      <div class="fi-field">
        <label for="saleMode">Modalidad de venta <field-help text="Formas de pago permitidas: pago único, cuotas quincenales o ambas."/></label>
        <pv-select input-id="saleMode" v-model="form.saleMode" :options="productSaleModes()" option-label="label" option-value="code"/>
      </div>
      <div class="fi-field">
        <span class="fi-label">Imagen <field-help text="Foto en JPG o PNG, de máximo 2 MB (opcional)."/></span>
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
      <pv-button type="submit" form="product-form" :label="isNew ? (isCombo ? 'Guardar combo' : 'Guardar producto') : 'Guardar cambios'" icon="pi pi-check" :loading="saving"/>
    </template>
  </pv-dialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.items {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 8rem 6rem auto auto;
  gap: .5rem;
  align-items: center;
}

.item__subtotal {
  text-align: right;
}

.content-total {
  margin-top: .25rem;
  color: var(--fi-muted);
}

.content-total--over {
  color: var(--fi-bad);
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

@media (max-width: 640px) {
  .item {
    grid-template-columns: minmax(0, 1fr) 7rem;
  }
}
</style>

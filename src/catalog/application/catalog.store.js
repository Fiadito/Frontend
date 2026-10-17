import {reactive} from 'vue';
import {ProductApi} from '@/catalog/infrastructure/product-api.js';
import {ProductAssembler} from '@/catalog/infrastructure/product.assembler.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {domainEventBus, DomainEvents} from '@/shared/application/domain-event-bus.js';

const productApi = new ProductApi();

/**
 * Application service of the Catalog context: products and services of the business (module 7.5).
 */
export const catalogStore = reactive({
    /** @type {import('@/catalog/domain/model/product.entity.js').Product[]} */
    products: [],
    loading: false,

    /**
     * @param {number} businessId
     * @returns {Promise<void>}
     */
    async load(businessId) {
        this.loading = true;
        try {
            this.products = ProductAssembler.toEntities(await productApi.getByBusiness(businessId));
        } finally {
            this.loading = false;
        }
    },

    /**
     * @param {number} id
     * @returns {import('@/catalog/domain/model/product.entity.js').Product|undefined}
     */
    findById(id) {
        return this.products.find(product => product.id === Number(id));
    },

    /**
     * GuardarProducto: registers or edits a product.
     *
     * @param {import('@/catalog/domain/model/product.entity.js').Product} product
     * @returns {Promise<void>}
     */
    async save(product) {
        const errors = product.validate();
        if (errors.length) throw errors[0];
        const resource = ProductAssembler.toResource(product);
        if (product.id === null) {
            const saved = ProductAssembler.toEntity((await productApi.create(resource)).data);
            this.products.push(saved);
            domainEventBus.publish(DomainEvents.PRODUCT_REGISTERED, iamStore.auditContext({recordId: saved.id, detail: `Registro del producto ${saved.description}`}));
        } else {
            const saved = ProductAssembler.toEntity((await productApi.update(product.id, resource)).data);
            this.products.splice(this.products.findIndex(item => item.id === saved.id), 1, saved);
            domainEventBus.publish(DomainEvents.PRODUCT_EDITED, iamStore.auditContext({recordId: saved.id, detail: `Edición del producto ${saved.description}`}));
        }
    },

    /**
     * Gives a product low (INACTIVO) or reactivates it.
     *
     * @param {import('@/catalog/domain/model/product.entity.js').Product} product
     * @returns {Promise<void>}
     */
    async toggleStatus(product) {
        const status = product.isActive ? 'INACTIVO' : 'ACTIVO';
        await productApi.patch(product.id, {estado: status});
        product.status = status;
        domainEventBus.publish(DomainEvents.PRODUCT_STATUS_CHANGED, iamStore.auditContext({
            recordId: product.id, detail: `${status === 'INACTIVO' ? 'Baja' : 'Reactivación'} del producto ${product.description}`
        }));
    }
});

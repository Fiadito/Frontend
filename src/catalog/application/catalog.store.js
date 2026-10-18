import {reactive} from 'vue';
import {ProductApi} from '@/catalog/infrastructure/product-api.js';
import {ProductAssembler} from '@/catalog/infrastructure/product.assembler.js';

const productApi = new ProductApi();

/**
 * Application service of the Catalog context: products and services of the business (module 7.5).
 */
export const catalogStore = reactive({
    /** @type {import('@/catalog/domain/model/product.entity.js').Product[]} */
    products: [],
    loading: false,

    /** @returns {Promise<void>} */
    async load() {
        this.loading = true;
        try {
            this.products = ProductAssembler.toEntities(await productApi.getAll());
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
            this.products.push(ProductAssembler.toEntity((await productApi.create(resource)).data));
        } else {
            const saved = ProductAssembler.toEntity((await productApi.update(product.id, resource)).data);
            this.products.splice(this.products.findIndex(item => item.id === saved.id), 1, saved);
        }
    },

    /**
     * Gives a product low (INACTIVO) or reactivates it.
     *
     * @param {import('@/catalog/domain/model/product.entity.js').Product} product
     * @returns {Promise<void>}
     */
    async toggleStatus(product) {
        const saved = ProductAssembler.toEntity((await productApi.changeStatus(product.id, product.isActive ? 'INACTIVO' : 'ACTIVO')).data);
        this.products.splice(this.products.findIndex(item => item.id === saved.id), 1, saved);
    }
});

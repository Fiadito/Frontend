import {BaseApi} from '@/shared/infrastructure/base-api.js';
import {BaseEndpoint} from '@/shared/infrastructure/base-endpoint.js';

const productsPath = import.meta.env.VITE_PRODUCTS_ENDPOINT_PATH;

/**
 * RESTful client of the Catalog context (/productos).
 */
export class ProductApi extends BaseApi {
    #products;

    constructor() {
        super();
        this.#products = new BaseEndpoint(this, productsPath);
    }

    /** @param {number} businessId */
    getByBusiness(businessId) {
        return this.#products.getAll({idNegocio: businessId});
    }

    /** @param {Object} resource */
    create(resource) {
        return this.#products.create(resource);
    }

    /** @param {number} id @param {Object} resource */
    update(id, resource) {
        return this.#products.update(id, resource);
    }

    /** @param {number} id @param {Object} changes */
    patch(id, changes) {
        return this.#products.patch(id, changes);
    }
}

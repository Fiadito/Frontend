import {BaseApi} from '@/shared/infrastructure/base-api.js';
import {BaseEndpoint} from '@/shared/infrastructure/base-endpoint.js';

/**
 * RESTful client of the Catalog context (/productos).
 */
export class ProductApi extends BaseApi {
    #products;

    constructor() {
        super();
        this.#products = new BaseEndpoint(this, '/productos');
    }

    /** @returns {Promise<import('axios').AxiosResponse>} Products of the business of the signed-in user. */
    getAll() {
        return this.#products.getAll();
    }

    /** @param {Object} resource */
    create(resource) {
        return this.#products.create(resource);
    }

    /** @param {number} id @param {Object} resource */
    update(id, resource) {
        return this.#products.update(id, resource);
    }

    /** @param {number} id @param {string} status - ACTIVO or INACTIVO. */
    changeStatus(id, status) {
        return this.http.patch(`/productos/${id}/estado`, {estado: status});
    }
}

import {BaseApi} from '@/shared/infrastructure/base-api.js';
import {BaseEndpoint} from '@/shared/infrastructure/base-endpoint.js';

const salesPath = import.meta.env.VITE_SALES_ENDPOINT_PATH;
const installmentsPath = import.meta.env.VITE_INSTALLMENTS_ENDPOINT_PATH;

/**
 * RESTful client of the Credit context (/ventas and /cuotas).
 *
 * @remarks
 * json-server has no transactions, so the sale and its installments are posted one after the
 * other. The Spring Boot backend will do it in one transaction with POST /ventas.
 */
export class CreditApi extends BaseApi {
    #sales;
    #installments;

    constructor() {
        super();
        this.#sales = new BaseEndpoint(this, salesPath);
        this.#installments = new BaseEndpoint(this, installmentsPath);
    }

    /** @param {Object} params - e.g. {idNegocio: 1} or {idSocio: 3}. */
    getSales(params) {
        return this.#sales.getAll(params);
    }

    /** @param {Object} params */
    getInstallments(params) {
        return this.#installments.getAll(params);
    }

    /** @param {Object} resource */
    createSale(resource) {
        return this.#sales.create(resource);
    }

    /** @param {Object} resource */
    createInstallment(resource) {
        return this.#installments.create(resource);
    }

    /** @param {number} id @param {Object} changes */
    patchSale(id, changes) {
        return this.#sales.patch(id, changes);
    }

    /** @param {number} id @param {Object} changes */
    patchInstallment(id, changes) {
        return this.#installments.patch(id, changes);
    }
}

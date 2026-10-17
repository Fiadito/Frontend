import {BaseApi} from '@/shared/infrastructure/base-api.js';
import {BaseEndpoint} from '@/shared/infrastructure/base-endpoint.js';

const paymentsPath = import.meta.env.VITE_PAYMENTS_ENDPOINT_PATH;

/**
 * RESTful client of the Billing context (/pagos).
 */
export class PaymentApi extends BaseApi {
    #payments;

    constructor() {
        super();
        this.#payments = new BaseEndpoint(this, paymentsPath);
    }

    /** @param {Object} params - e.g. {idNegocio: 1} or {idSocio: 3}. */
    getPayments(params) {
        return this.#payments.getAll(params);
    }

    /** @param {Object} resource */
    create(resource) {
        return this.#payments.create(resource);
    }
}

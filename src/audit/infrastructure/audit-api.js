import {BaseApi} from '@/shared/infrastructure/base-api.js';
import {BaseEndpoint} from '@/shared/infrastructure/base-endpoint.js';

const operationsPath = import.meta.env.VITE_OPERATIONS_ENDPOINT_PATH;

/**
 * RESTful client of the Audit context (/bitacora).
 */
export class AuditApi extends BaseApi {
    #operations;

    constructor() {
        super();
        this.#operations = new BaseEndpoint(this, operationsPath);
    }

    /** @param {number} businessId */
    getByBusiness(businessId) {
        return this.#operations.getAll({idNegocio: businessId, _sort: 'id', _order: 'desc'});
    }

    /** @param {Object} resource */
    create(resource) {
        return this.#operations.create(resource);
    }
}

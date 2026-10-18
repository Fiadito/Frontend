import {BaseApi} from '@/shared/infrastructure/base-api.js';

/**
 * RESTful client of the Audit context (GET /bitacora). The backend writes BITACORA itself.
 */
export class AuditApi extends BaseApi {

    /**
     * @param {string} [action] - Optional action filter (LOGIN, VENDER, PAGAR...).
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getOperations(action) {
        return this.http.get('/bitacora', {params: action ? {accion: action} : {}});
    }
}

import {BaseApi} from '@/shared/infrastructure/base-api.js';

/**
 * RESTful client of the Credit context: /ventas, /ventas/simulacion and /cuotas (Tabla 7 of the report).
 */
export class CreditApi extends BaseApi {

    /** @param {number} [memberId] @returns {Promise<import('axios').AxiosResponse>} */
    getSales(memberId) {
        return this.http.get('/ventas', {params: memberId ? {idSocio: memberId} : {}});
    }

    /** @param {Object} request - idSocio, idProducto, cantidad, fechaHoraCompra, modalidad, nCuotas. */
    simulate(request) {
        return this.http.post('/ventas/simulacion', request);
    }

    /** @param {Object} request */
    register(request) {
        return this.http.post('/ventas', request);
    }
}

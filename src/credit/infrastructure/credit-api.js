import {BaseApi} from '@/shared/infrastructure/base-api.js';

/**
 * RESTful client of the Credit context: /ventas, /ventas/simulacion, /ventas/{id}/tasa and /cuotas.
 */
export class CreditApi extends BaseApi {

    /** @param {number} [memberId] @returns {Promise<import('axios').AxiosResponse>} */
    getSales(memberId) {
        return this.http.get('/ventas', {params: memberId ? {idSocio: memberId} : {}});
    }

    /** @param {number} id @returns {Promise<import('axios').AxiosResponse>} Sale with its plan. */
    getSale(id) {
        return this.http.get(`/ventas/${id}`);
    }

    /** @param {Object} request - idSocio, idProducto, cantidad, fechaHoraCompra, modalidad, nCuotas, periodoTasa, valorTasa. */
    simulate(request) {
        return this.http.post('/ventas/simulacion', request);
    }

    /** @param {Object} request */
    register(request) {
        return this.http.post('/ventas', request);
    }

    /**
     * @param {number} id
     * @param {{periodoTasa: string, valorTasa: number}} rate
     * @returns {Promise<import('axios').AxiosResponse>} The sale with its pending installments recalculated.
     */
    changeRate(id, rate) {
        return this.http.patch(`/ventas/${id}/tasa`, rate);
    }
}

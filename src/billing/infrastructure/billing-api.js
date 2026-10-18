import {BaseApi} from '@/shared/infrastructure/base-api.js';

/**
 * RESTful client of the Billing context (Tabla 7 of the report): obligations, payments with late
 * interest, panel, cut-off report and account statements.
 */
export class BillingApi extends BaseApi {

    /** @param {string} [status] - PENDIENTE to list only what is still unpaid. */
    getObligations(status) {
        return this.http.get('/obligaciones', {params: status ? {estado: status} : {}});
    }

    /** @param {{idVenta: number, idCuota: number|null, fechaPagoReal: string}} request */
    quote(request) {
        return this.http.post('/pagos/cotizacion', request);
    }

    /** @param {{idVenta: number, idCuota: number|null, fechaPagoReal: string, medioPago: string, montoPagado: number}} request */
    registerPayment(request) {
        return this.http.post('/pagos', request);
    }

    getPayments() {
        return this.http.get('/pagos');
    }

    getPanel() {
        return this.http.get('/panel');
    }

    getCutoffOptions() {
        return this.http.get('/reportes/cortes');
    }

    /** @param {string} cutoffDate - "YYYY-MM-DD", day 10 or 25. */
    getCutoffReport(cutoffDate) {
        return this.http.get('/reportes/corte', {params: {fecha: cutoffDate}});
    }

    /** Account statement of the signed-in member (rol SOCIO). */
    getMyStatement() {
        return this.http.get('/socios/me/estado-cuenta');
    }

    /** @param {number} memberId - Account statement of a member (rol NEGOCIO). */
    getMemberStatement(memberId) {
        return this.http.get(`/socios/${memberId}/estado-cuenta`);
    }
}

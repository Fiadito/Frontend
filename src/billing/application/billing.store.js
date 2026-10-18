import {reactive} from 'vue';
import {BillingApi} from '@/billing/infrastructure/billing-api.js';

const billingApi = new BillingApi();

/**
 * Application service of the Billing context (modules 7.8, 7.9 and 7.10).
 *
 * @remarks
 * All the amounts (late interest, totals, imputation, report of the cut-off and account statement)
 * are computed by the backend; the views only show them. Resources keep the Spanish names of the API.
 */
export const billingStore = reactive({
    /** @type {Object[]} Pending obligations (cuotas and single payments). */
    pending: [],
    /** @type {Object[]} Registered payments. */
    payments: [],
    loading: false,

    /** Loads the pending obligations and the registered payments. */
    async loadPayments() {
        this.loading = true;
        try {
            const [pending, payments] = await Promise.all([billingApi.getObligations('PENDIENTE'), billingApi.getPayments()]);
            this.pending = pending.data;
            this.payments = payments.data;
        } finally {
            this.loading = false;
        }
    },

    /**
     * POST /pagos/cotizacion: days of delay, late interest, total due and imputation.
     *
     * @param {Object} obligation - Item of /obligaciones.
     * @param {string} paymentDate - "YYYY-MM-DD".
     * @returns {Promise<Object>}
     */
    async quote(obligation, paymentDate) {
        return (await billingApi.quote({idVenta: obligation.idVenta, idCuota: obligation.idCuota, fechaPagoReal: paymentDate})).data;
    },

    /**
     * RegistrarPago (POST /pagos): the backend rejects partial payments (CP10).
     *
     * @param {{obligation: Object, paymentDate: string, method: string, paid: number}} request
     * @returns {Promise<Object>} The saved payment.
     */
    async registerPayment({obligation, paymentDate, method, paid}) {
        if (!paymentDate) throw 'Ingresa la fecha real de pago.';
        const saved = (await billingApi.registerPayment({
            idVenta: obligation.idVenta, idCuota: obligation.idCuota, fechaPagoReal: paymentDate, medioPago: method, montoPagado: paid
        })).data;
        await this.loadPayments();
        return saved;
    },

    /** @returns {Promise<Object>} GET /panel. */
    async panel() {
        return (await billingApi.getPanel()).data;
    },

    /** @returns {Promise<Object[]>} Cut-off dates with their payment date. */
    async cutoffOptions() {
        return (await billingApi.getCutoffOptions()).data;
    },

    /** @param {string} cutoffDate @returns {Promise<Object>} GET /reportes/corte. */
    async cutoffReport(cutoffDate) {
        return (await billingApi.getCutoffReport(cutoffDate)).data;
    },

    /**
     * @param {number|null} memberId - Null for the signed-in member.
     * @returns {Promise<Object>} Account statement.
     */
    async statement(memberId = null) {
        return (await (memberId ? billingApi.getMemberStatement(memberId) : billingApi.getMyStatement())).data;
    }
});

import {reactive} from 'vue';
import {BillingApi} from '@/billing/infrastructure/billing-api.js';

const billingApi = new BillingApi();

/** @param {{period: string, percent: number}|null} lateRate @returns {Object} Late-rate fields of the request (empty if none). */
const lateRateBody = lateRate => (lateRate && lateRate.period && lateRate.percent !== null && lateRate.percent !== undefined
    ? {periodoTasaMora: lateRate.period, valorTasaMora: lateRate.percent / 100}
    : {});

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
     * POST /pagos/cotizacion: total due and imputation; if overdue, days of delay and late interest with the late rate given.
     *
     * @param {Object} obligation - Item of /obligaciones.
     * @param {string} paymentDate - "YYYY-MM-DD".
     * @param {{period: string, percent: number}|null} [lateRate] - Only used when overdue (TEA 60 % if omitted).
     * @returns {Promise<Object>}
     */
    async quote(obligation, paymentDate, lateRate = null) {
        return (await billingApi.quote({
            idVenta: obligation.idVenta, idCuota: obligation.idCuota, fechaPagoReal: paymentDate, ...lateRateBody(lateRate)
        })).data;
    },

    /**
     * RegistrarPago (POST /pagos): the backend rejects partial payments (CP10) and future dates.
     *
     * @param {{obligation: Object, paymentDate: string, method: string, paid: number, lateRate: {period: string, percent: number}|null}} request
     * @returns {Promise<Object>} The saved payment.
     */
    async registerPayment({obligation, paymentDate, method, paid, lateRate = null}) {
        if (!paymentDate) throw 'Ingresa la fecha real de pago.';
        const saved = (await billingApi.registerPayment({
            idVenta: obligation.idVenta, idCuota: obligation.idCuota, fechaPagoReal: paymentDate, medioPago: method, montoPagado: paid,
            ...lateRateBody(lateRate)
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

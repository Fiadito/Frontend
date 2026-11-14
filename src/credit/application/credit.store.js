import {reactive} from 'vue';
import {CreditApi} from '@/credit/infrastructure/credit-api.js';
import {CreditAssembler} from '@/credit/infrastructure/credit.assembler.js';
import {saleRateError} from '@/credit/domain/model/credit-policy.js';

const creditApi = new CreditApi();
const number = value => (value === null || value === undefined ? null : Number(value));

/**
 * Application service of the Credit context: sales on credit, their effective rate and their payment plans (modules 7.6, 7.7).
 *
 * @remarks
 * The backend validates the sale, assigns the payment date by cut-off, builds the French plan with the TEQ of the sale
 * and saves VENTA, CUOTA and BITACORA in one transaction.
 */
export const creditStore = reactive({
    /** @type {import('@/credit/domain/model/credit-sale.entity.js').CreditSale[]} */
    sales: [],
    loading: false,

    /**
     * @param {number} [memberId] - Only the sales of a member.
     * @returns {Promise<void>}
     */
    async load(memberId) {
        this.loading = true;
        try {
            this.sales = (await creditApi.getSales(memberId)).data.map(resource => CreditAssembler.toSale(resource));
        } finally {
            this.loading = false;
        }
    },

    /**
     * @param {number} id
     * @returns {Promise<import('@/credit/domain/model/credit-sale.entity.js').CreditSale>} The sale with its plan.
     */
    async find(id) {
        return CreditAssembler.toSale((await creditApi.getSale(id)).data);
    },

    /**
     * Simulation (POST /ventas/simulacion): errors, amounts, rate and plan, without saving.
     *
     * @param {Object} form - See CreditAssembler.toRequest.
     * @returns {Promise<Object>}
     */
    async simulate(form) {
        const r = (await creditApi.simulate(CreditAssembler.toRequest(form))).data;
        return {
            errors: r.errores ?? [], listPrice: number(r.precioLista), amount: number(r.monto), cutoffDate: r.fechaCorte, paymentDate: r.fechaPago,
            periodRate: number(r.tasaQuincenal), annualRate: number(r.teaEquivalente), installmentAmount: number(r.cuota),
            interestTotal: number(r.interesTotal), totalToPay: number(r.totalAPagar), memberDebt: number(r.deudaSocio) ?? 0,
            availableCredit: number(r.creditoDisponible), schedule: (r.cronograma ?? []).map(row => CreditAssembler.toScheduleRow(row))
        };
    },

    /**
     * RegistrarVenta (POST /ventas).
     *
     * @param {Object} form - See CreditAssembler.toRequest.
     * @returns {Promise<import('@/credit/domain/model/credit-sale.entity.js').CreditSale>}
     */
    async register(form) {
        const sale = CreditAssembler.toSale((await creditApi.register(CreditAssembler.toRequest(form))).data);
        this.sales.push(sale);
        return sale;
    },

    /**
     * CambiarTasa (PATCH /ventas/{id}/tasa): paid installments stay; pending ones are recalculated from their balance.
     *
     * @param {number} saleId
     * @param {string} period
     * @param {number} percent - e.g. 27 for 27 %.
     * @returns {Promise<import('@/credit/domain/model/credit-sale.entity.js').CreditSale>}
     */
    async changeRate(saleId, period, percent) {
        const value = percent === null || percent === undefined ? null : percent / 100;
        const error = saleRateError(period, value);
        if (error) throw error;
        const sale = CreditAssembler.toSale((await creditApi.changeRate(saleId, {periodoTasa: period, valorTasa: value})).data);
        const index = this.sales.findIndex(item => item.id === sale.id);
        if (index >= 0) this.sales.splice(index, 1, sale);
        return sale;
    }
});

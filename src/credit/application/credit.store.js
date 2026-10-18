import {reactive} from 'vue';
import {CreditApi} from '@/credit/infrastructure/credit-api.js';
import {CreditAssembler} from '@/credit/infrastructure/credit.assembler.js';

const creditApi = new CreditApi();

/**
 * Application service of the Credit context: sales on credit and their payment plans (modules 7.6, 7.7).
 *
 * @remarks
 * The backend validates the sale, assigns the payment date by cut-off, computes C = P / n and saves
 * VENTA, CUOTA and BITACORA in one transaction.
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
     * Simulation (POST /ventas/simulacion): errors, amounts and plan, without saving.
     *
     * @param {Object} form - See CreditAssembler.toRequest.
     * @returns {Promise<{errors: string[], listPrice: number|null, amount: number|null, cutoffDate: string|null, paymentDate: string|null,
     *   installmentAmount: number|null, totalToPay: number|null, memberDebt: number, availableCredit: number|null, schedule: Array}>}
     */
    async simulate(form) {
        const r = (await creditApi.simulate(CreditAssembler.toRequest(form))).data;
        const number = value => (value === null || value === undefined ? null : Number(value));
        return {
            errors: r.errores ?? [], listPrice: number(r.precioLista), amount: number(r.monto), cutoffDate: r.fechaCorte, paymentDate: r.fechaPago,
            installmentAmount: number(r.cuota), totalToPay: number(r.totalAPagar), memberDebt: number(r.deudaSocio) ?? 0,
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
    }
});

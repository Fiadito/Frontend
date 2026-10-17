import {reactive} from 'vue';
import {CreditApi} from '@/credit/infrastructure/credit-api.js';
import {CreditAssembler} from '@/credit/infrastructure/credit.assembler.js';
import {CreditSale} from '@/credit/domain/model/credit-sale.entity.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {systemClock} from '@/shared/domain/model/system-clock.js';
import {domainEventBus, DomainEvents} from '@/shared/application/domain-event-bus.js';

const creditApi = new CreditApi();

/**
 * Application service of the Credit context: sales on credit and their payment plans (modules 7.6, 7.7).
 */
export const creditStore = reactive({
    /** @type {CreditSale[]} */
    sales: [],
    /** @type {import('@/credit/domain/model/installment.entity.js').Installment[]} */
    installments: [],
    loading: false,

    /**
     * Loads sales and installments.
     *
     * @param {Object} params - {idNegocio} for the business or {idSocio} for a member.
     * @returns {Promise<void>}
     */
    async load(params) {
        this.loading = true;
        try {
            const [sales, installments] = await Promise.all([creditApi.getSales(params), creditApi.getInstallments(params)]);
            this.sales = sales.data.map(resource => CreditAssembler.toSale(resource));
            this.installments = installments.data.map(resource => CreditAssembler.toInstallment(resource)).sort((a, b) => a.saleId - b.saleId || a.number - b.number);
        } finally {
            this.loading = false;
        }
    },

    /**
     * @param {number} saleId
     * @returns {import('@/credit/domain/model/installment.entity.js').Installment[]}
     */
    installmentsOf(saleId) {
        return this.installments.filter(item => item.saleId === saleId);
    },

    /**
     * Simulation (POST /ventas/simulacion): validates and computes without saving.
     *
     * @param {Object} request - See CreditSale.simulate (without today).
     * @returns {ReturnType<typeof CreditSale.simulate>}
     */
    simulate(request) {
        return CreditSale.simulate({...request, today: systemClock.today()});
    },

    /**
     * RegistrarVenta: saves the sale and its installments (POST /ventas).
     *
     * @param {ReturnType<typeof CreditSale.simulate>} simulation - A valid simulation.
     * @param {string} productName - For the operations log.
     * @param {string} memberName - For the operations log.
     * @returns {Promise<CreditSale>}
     */
    async register(simulation, productName, memberName) {
        if (simulation.errors.length) throw simulation.errors[0];
        const sale = CreditAssembler.toSale((await creditApi.createSale(CreditAssembler.toSaleResource(simulation.sale))).data);
        for (const row of simulation.schedule) {
            this.installments.push(CreditAssembler.toInstallment((await creditApi.createInstallment(CreditAssembler.toInstallmentResource(row, sale))).data));
        }
        this.sales.push(sale);
        domainEventBus.publish(DomainEvents.SALE_REGISTERED, iamStore.auditContext({
            recordId: sale.id,
            detail: `Venta a ${memberName}: ${sale.quantity} × ${productName} = S/ ${sale.amount.toFixed(2)} (${sale.isInInstallments ? `${sale.installmentCount} cuotas` : 'pago único'})`
        }));
        return sale;
    },

    /**
     * Marks an installment (and the sale when everything is paid) as paid.
     *
     * @param {CreditSale} sale
     * @param {import('@/credit/domain/model/installment.entity.js').Installment|null} installment
     * @returns {Promise<void>}
     */
    async markPaid(sale, installment) {
        if (installment) {
            await creditApi.patchInstallment(installment.id, {estado: 'PAGADA'});
            installment.status = 'PAGADA';
        }
        const allPaid = !installment || this.installmentsOf(sale.id).every(item => item.isPaid);
        if (allPaid) {
            await creditApi.patchSale(sale.id, {estado: 'PAGADA'});
            sale.status = 'PAGADA';
        }
    }
});

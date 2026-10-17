import {systemClock} from '@/shared/domain/model/system-clock.js';
import {SaleMode} from '@/catalog/domain/model/sale-mode.js';

/**
 * Status of an obligation.
 *
 * @readonly
 */
export const ObligationStatus = Object.freeze({PENDING: 'PENDIENTE', PAID: 'PAGADA', OVERDUE: 'EN_MORA'});

export const obligationStatusLabels = Object.freeze({PENDIENTE: 'Pendiente', PAGADA: 'Pagado', EN_MORA: 'En mora'});

/**
 * Read model: something the member must pay on a payment date.
 *
 * @remarks
 * It is either one installment of a sale in installments or the whole single-payment sale
 * (the report calls both "obligación"). It is built from VENTA, CUOTA and PAGO; it is not a table.
 */
export class Obligation {
    /**
     * @param {Object} props
     * @param {import('@/credit/domain/model/credit-sale.entity.js').CreditSale} props.sale
     * @param {import('@/credit/domain/model/installment.entity.js').Installment|null} props.installment
     * @param {import('@/billing/domain/model/payment.entity.js').Payment|null} props.payment
     */
    constructor({sale, installment = null, payment = null}) {
        this.sale = sale;
        this.installment = installment;
        this.payment = payment;
        Object.freeze(this);
    }

    /** @returns {string} Unique key, e.g. "C-12" (installment) or "V-5" (single payment). */
    get key() {
        return this.installment ? `C-${this.installment.id}` : `V-${this.sale.id}`;
    }

    /** @returns {string} Code shown to the user, e.g. "#OB-000012". */
    get code() {
        return `#OB-${String(this.installment ? this.installment.id : this.sale.id).padStart(6, '0')}${this.installment ? '' : 'U'}`;
    }

    /** @returns {number} */
    get memberId() {
        return this.sale.memberId;
    }

    /** @returns {import('@/shared/domain/model/calendar-date.js').CalendarDate} */
    get dueDate() {
        return this.installment ? this.installment.dueDate : this.sale.paymentDate;
    }

    /** @returns {number} D: amount due on the payment date. */
    get amount() {
        return this.installment ? this.installment.amount : this.sale.totalToPay;
    }

    /** @returns {string} "Cuota 2 de 8" or "Pago único". */
    get label() {
        return this.installment ? `Cuota ${this.installment.number} de ${this.sale.installmentCount}` : 'Pago único';
    }

    /** @returns {boolean} */
    get isPaid() {
        return this.payment !== null || (this.installment ? this.installment.isPaid : this.sale.isPaid);
    }

    /**
     * @param {import('@/shared/domain/model/calendar-date.js').CalendarDate} [today]
     * @returns {string} PENDIENTE, PAGADA or EN_MORA.
     */
    statusOn(today = systemClock.today()) {
        if (this.isPaid) return ObligationStatus.PAID;
        return this.dueDate.compareTo(today) < 0 ? ObligationStatus.OVERDUE : ObligationStatus.PENDING;
    }

    /**
     * Builds every obligation of the given sales.
     *
     * @param {Array} sales - Credit sales.
     * @param {Array} installments - Installments of those sales.
     * @param {Array} payments - Payments of those sales.
     * @returns {Obligation[]} Ordered by due date.
     */
    static fromSales(sales, installments, payments) {
        const result = [];
        sales.forEach(sale => {
            if (sale.paymentMode === SaleMode.SINGLE_PAYMENT) {
                const payment = payments.find(item => item.saleId === sale.id && !item.installmentId) ?? null;
                result.push(new Obligation({sale, payment}));
            } else {
                installments.filter(item => item.saleId === sale.id).forEach(installment => {
                    const payment = payments.find(item => item.installmentId === installment.id) ?? null;
                    result.push(new Obligation({sale, installment, payment}));
                });
            }
        });
        return result.sort((a, b) => a.dueDate.compareTo(b.dueDate) || a.sale.id - b.sale.id);
    }
}

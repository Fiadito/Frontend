import {roundMoney} from '@/shared/domain/model/rounding.js';
import {PaymentCalendar} from '@/credit/domain/model/payment-calendar.js';

/**
 * Read model: payment report of a cut-off (module 7.8, GenerarReporteCorte).
 *
 * @remarks
 * For each active member it lists, ordered by purchase date, the single-payment purchases of
 * the cycle and the installments due on the payment date that follows the cut-off.
 * D = Σ S_j + Σ C_k. It is not a table: it is computed from VENTA and CUOTA.
 */
export class CutoffReport {
    /**
     * @param {import('@/shared/domain/model/calendar-date.js').CalendarDate} cutoffDate - Day 10 or 25.
     * @param {import('@/billing/domain/model/obligation.js').Obligation[]} obligations - Obligations of the business.
     * @param {Array} members - Members of the business.
     */
    constructor(cutoffDate, obligations, members) {
        this.cutoffDate = cutoffDate;
        this.paymentDate = PaymentCalendar.paymentDateOfCutoff(cutoffDate);
        const due = obligations.filter(item => item.dueDate.compareTo(this.paymentDate) === 0);
        this.groups = members
            .map(member => {
                const items = due.filter(item => item.memberId === member.id)
                    .sort((a, b) => a.sale.purchaseDateTime.localeCompare(b.sale.purchaseDateTime));
                return {member, items, total: roundMoney(items.reduce((sum, item) => sum + item.amount, 0))};
            })
            .filter(group => group.items.length > 0);
    }

    /** @returns {number} Total of the cut-off. */
    get total() {
        return roundMoney(this.groups.reduce((sum, group) => sum + group.total, 0));
    }

    /** @returns {number} Number of items (purchases and installments). */
    get itemCount() {
        return this.groups.reduce((sum, group) => sum + group.items.length, 0);
    }

    /**
     * @param {import('@/shared/domain/model/calendar-date.js').CalendarDate} today
     * @returns {boolean} True while the cut-off has not closed yet (preliminary report).
     */
    isPreliminary(today) {
        return today.compareTo(this.cutoffDate) <= 0;
    }
}

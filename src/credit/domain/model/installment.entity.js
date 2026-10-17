import {CalendarDate} from '@/shared/domain/model/calendar-date.js';

/**
 * Entity: one fortnightly installment of a sale (CUOTA).
 */
export class Installment {
    /**
     * @param {Object} props
     * @param {number|null} props.id
     * @param {number} props.saleId
     * @param {number} props.number - 1 to 8.
     * @param {string|CalendarDate} props.dueDate - Day 15 or 30 (last day).
     * @param {number} props.openingBalance
     * @param {number} props.amortization
     * @param {number} props.amount
     * @param {number} props.closingBalance
     * @param {string} [props.status='PENDIENTE'] - PENDIENTE or PAGADA.
     */
    constructor({id = null, saleId, number, dueDate, openingBalance, amortization, amount, closingBalance, status = 'PENDIENTE'}) {
        this.id = id;
        this.saleId = saleId;
        this.number = number;
        this.dueDate = CalendarDate.from(dueDate);
        this.openingBalance = openingBalance;
        this.amortization = amortization;
        this.amount = amount;
        this.closingBalance = closingBalance;
        this.status = status;
    }

    /** @returns {boolean} */
    get isPaid() {
        return this.status === 'PAGADA';
    }
}

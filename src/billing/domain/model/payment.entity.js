import {CalendarDate} from '@/shared/domain/model/calendar-date.js';

/**
 * Entity: a full payment of an obligation (PAGO).
 */
export class Payment {
    /**
     * @param {Object} props
     * @param {number|null} props.id
     * @param {number} props.businessId
     * @param {number} props.saleId
     * @param {number|null} props.installmentId - Null for a single-payment sale.
     * @param {number} props.memberId
     * @param {string|CalendarDate} props.paymentDate - Real payment date.
     * @param {number} props.lateDays
     * @param {number} props.lateDailyRate
     * @param {number} props.lateInterest
     * @param {number} props.totalPaid
     * @param {number} props.lateImputation
     * @param {number} props.capitalImputation
     * @param {string} props.method
     * @param {string} [props.registeredAt]
     */
    constructor({id = null, businessId, saleId, installmentId = null, memberId, paymentDate, lateDays = 0, lateDailyRate = 0,
                    lateInterest = 0, totalPaid, lateImputation = 0, capitalImputation, method, registeredAt = ''}) {
        this.id = id;
        this.businessId = businessId;
        this.saleId = saleId;
        this.installmentId = installmentId;
        this.memberId = memberId;
        this.paymentDate = CalendarDate.from(paymentDate);
        this.lateDays = lateDays;
        this.lateDailyRate = lateDailyRate;
        this.lateInterest = lateInterest;
        this.totalPaid = totalPaid;
        this.lateImputation = lateImputation;
        this.capitalImputation = capitalImputation;
        this.method = method;
        this.registeredAt = registeredAt;
    }
}

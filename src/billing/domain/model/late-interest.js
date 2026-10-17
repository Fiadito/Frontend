import {CalendarDate} from '@/shared/domain/model/calendar-date.js';
import {roundMoney} from '@/shared/domain/model/rounding.js';

/**
 * Domain service: late-payment interest and payment imputation (formulas 6 and 7, module 7.9).
 *
 * @remarks
 * dm = Freal − Fpago; Imor = D × ((1 + TED_mor)^dm − 1); Total = D + Imor.
 * The payment must equal the total (no partial payments) and is imputed first to the
 * late-payment interest and then to capital.
 */
export const LateInterest = {

    /**
     * Days of delay (0 when paid on time or early).
     *
     * @param {CalendarDate|string} dueDate - Payment date of the obligation.
     * @param {CalendarDate|string} paymentDate - Real payment date.
     * @returns {number}
     */
    lateDays(dueDate, paymentDate) {
        return Math.max(0, CalendarDate.from(dueDate).daysUntil(CalendarDate.from(paymentDate)));
    },

    /**
     * Quotes the payment of an obligation on a given date.
     *
     * @param {Object} params
     * @param {number} params.amount - D: amount due on the payment date.
     * @param {CalendarDate|string} params.dueDate - Payment date of the obligation.
     * @param {CalendarDate|string} params.paymentDate - Real payment date.
     * @param {import('@/shared/domain/model/effective-rate.js').EffectiveRate} params.lateRate - Agreed late rate.
     * @returns {{amount: number, lateDays: number, dailyRate: number, lateInterest: number, total: number, lateImputation: number, capitalImputation: number}}
     */
    quote({amount, dueDate, paymentDate, lateRate}) {
        const lateDays = this.lateDays(dueDate, paymentDate);
        const dailyRate = lateRate.toDaily();
        const lateInterest = lateDays > 0 ? roundMoney(amount * (Math.pow(1 + dailyRate, lateDays) - 1)) : 0;
        const total = roundMoney(amount + lateInterest);
        return {
            amount: roundMoney(amount), lateDays, dailyRate, lateInterest, total,
            lateImputation: lateInterest, capitalImputation: roundMoney(total - lateInterest)
        };
    },

    /**
     * Checks the amount paid (no partial payments are accepted).
     *
     * @param {number} paid - Amount entered by the business.
     * @param {number} total - Total due.
     * @returns {boolean}
     */
    isFullPayment(paid, total) {
        return roundMoney(paid) === roundMoney(total);
    }
};

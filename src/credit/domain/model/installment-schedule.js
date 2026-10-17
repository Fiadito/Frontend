import {roundMoney} from '@/shared/domain/model/rounding.js';
import {PaymentCalendar} from '@/credit/domain/model/payment-calendar.js';

/**
 * Domain service: payment plan in equal fortnightly installments (module 7.7 of the report).
 *
 * @remarks
 * There is no compensatory interest: C = P / n (rounded to 2 decimals). For each k:
 * A_k = C_k, SF_k = SI_k − A_k, SI_{k+1} = SF_k. The last installment amortizes the pending
 * balance (A_n = SI_n) so the final balance is zero and rounding differences are absorbed.
 */
export const InstallmentSchedule = {

    /**
     * Fixed installment C = P / n.
     *
     * @param {number} principal - P: purchase amount at list price.
     * @param {number} count - n: number of installments (1 to 8).
     * @returns {number}
     */
    fixedInstallment(principal, count) {
        return roundMoney(principal / count);
    },

    /**
     * GenerarCronograma(P, fechaInicio, n).
     *
     * @param {number} principal - P.
     * @param {import('@/shared/domain/model/calendar-date.js').CalendarDate} firstPaymentDate - Due date of installment 1.
     * @param {number} count - n.
     * @returns {Array<{number: number, dueDate: import('@/shared/domain/model/calendar-date.js').CalendarDate, openingBalance: number, amortization: number, amount: number, closingBalance: number}>}
     */
    build(principal, firstPaymentDate, count) {
        const fixed = this.fixedInstallment(principal, count);
        const rows = [];
        let balance = roundMoney(principal);
        let dueDate = firstPaymentDate;
        for (let k = 1; k <= count; k++) {
            if (k > 1) dueDate = PaymentCalendar.nextPaymentDate(dueDate);
            const amortization = k === count ? balance : fixed;
            const closingBalance = roundMoney(balance - amortization);
            rows.push({number: k, dueDate, openingBalance: balance, amortization, amount: amortization, closingBalance});
            balance = closingBalance;
        }
        return rows;
    }
};

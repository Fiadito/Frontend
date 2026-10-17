import {roundMoney} from '@/shared/domain/model/rounding.js';
import {LateInterest} from '@/billing/domain/model/late-interest.js';
import {ObligationStatus} from '@/billing/domain/model/obligation.js';

/**
 * Read model: account statement of a member (module 7.10, MostrarEstadoCuenta).
 *
 * @remarks
 * Capital debt = pending obligations (without late interest); it is what consumes the credit
 * limit. Debt today = pending obligations + late interest accrued until today.
 * Available credit = credit limit − capital debt.
 */
export class AccountStatement {
    /**
     * @param {import('@/membership/domain/model/member.entity.js').Member} member - The member.
     * @param {import('@/billing/domain/model/obligation.js').Obligation[]} obligations - Obligations of the member.
     * @param {import('@/shared/domain/model/calendar-date.js').CalendarDate} today - Today.
     */
    constructor(member, obligations, today) {
        this.member = member;
        this.today = today;
        this.obligations = obligations;
        this.pending = obligations.filter(item => !item.isPaid).map(obligation => {
            const quote = LateInterest.quote({amount: obligation.amount, dueDate: obligation.dueDate, paymentDate: today, lateRate: member.lateRate});
            return {obligation, lateDays: quote.lateDays, lateInterestToday: quote.lateInterest, totalToday: quote.total, status: obligation.statusOn(today)};
        });
    }

    /** @returns {number} Pending capital (no late interest). */
    get capitalDebt() {
        return roundMoney(this.pending.reduce((sum, item) => sum + item.obligation.amount, 0));
    }

    /** @returns {number} Pending capital plus late interest until today. */
    get debtToday() {
        return roundMoney(this.pending.reduce((sum, item) => sum + item.totalToday, 0));
    }

    /** @returns {number} Late interest accrued until today. */
    get lateInterestToday() {
        return roundMoney(this.pending.reduce((sum, item) => sum + item.lateInterestToday, 0));
    }

    /** @returns {number} Credit limit − capital debt. */
    get availableCredit() {
        return roundMoney(this.member.creditLimit - this.capitalDebt);
    }

    /** @returns {boolean} True when an obligation is overdue. */
    get isOverdue() {
        return this.pending.some(item => item.status === ObligationStatus.OVERDUE);
    }

    /**
     * Next payment: the earliest pending payment date and everything due that day (plus overdue items).
     *
     * @returns {{date: import('@/shared/domain/model/calendar-date.js').CalendarDate, amount: number, count: number}|null}
     */
    get nextPayment() {
        if (this.pending.length === 0) return null;
        const date = this.pending[0].obligation.dueDate;
        const items = this.pending.filter(item => item.obligation.dueDate.compareTo(date) === 0);
        return {date, amount: roundMoney(items.reduce((sum, item) => sum + item.totalToday, 0)), count: items.length};
    }
}

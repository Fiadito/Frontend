import {CalendarDate} from '@/shared/domain/model/calendar-date.js';

/**
 * Domain service: cut-off and payment dates of Fiadito (fixed rules of the system).
 *
 * @remarks
 * Cut-offs: days 10 and 25 until 23:59. Payments: days 15 and 30 (or the last day of the month).
 * A purchase made up to the cut-off is paid on the payment date of that cycle; after the
 * cut-off it moves to the next payment date (point 5 of the assignment, module 7.6).
 */
export const PaymentCalendar = {
    CUTOFF_DAYS: [10, 25],
    CUTOFF_TIME: '23:59',
    PAYMENT_DAYS: [15, 30],

    /**
     * Second payment date of a month: day 30 or the last day of the month (28/29 in February).
     *
     * @param {number} year - The year.
     * @param {number} month - Month from 1 to 12.
     * @returns {CalendarDate}
     */
    endOfMonthPayment(year, month) {
        return new CalendarDate(year, month, Math.min(30, CalendarDate.daysInMonth(year, month)));
    },

    /**
     * Day 15 of the month after the given one.
     *
     * @param {CalendarDate} date - Any day of the month.
     * @returns {CalendarDate}
     */
    fifteenthOfNextMonth(date) {
        const next = new CalendarDate(date.year, date.month, 1).plusMonths(1);
        return new CalendarDate(next.year, next.month, 15);
    },

    /**
     * PrimeraFechaPago: first payment date of a purchase according to the cut-off.
     *
     * @param {string|CalendarDate} purchaseDateTime - "YYYY-MM-DDTHH:mm" or a date.
     * @returns {CalendarDate}
     */
    firstPaymentDate(purchaseDateTime) {
        const date = CalendarDate.from(purchaseDateTime);
        if (date.day <= 10) return new CalendarDate(date.year, date.month, 15);
        if (date.day <= 25) return this.endOfMonthPayment(date.year, date.month);
        return this.fifteenthOfNextMonth(date);
    },

    /**
     * SiguienteFechaPago: next fortnightly payment date.
     *
     * @param {CalendarDate} paymentDate - A payment date (15 or 30/last day).
     * @returns {CalendarDate}
     */
    nextPaymentDate(paymentDate) {
        const date = CalendarDate.from(paymentDate);
        if (date.day === 15) return this.endOfMonthPayment(date.year, date.month);
        return this.fifteenthOfNextMonth(date);
    },

    /**
     * Cut-off date that closes the cycle of a purchase.
     *
     * @param {string|CalendarDate} purchaseDateTime - The purchase moment.
     * @returns {CalendarDate} Day 10 or 25.
     */
    cutoffOf(purchaseDateTime) {
        const date = CalendarDate.from(purchaseDateTime);
        if (date.day <= 10) return new CalendarDate(date.year, date.month, 10);
        if (date.day <= 25) return new CalendarDate(date.year, date.month, 25);
        const next = new CalendarDate(date.year, date.month, 1).plusMonths(1);
        return new CalendarDate(next.year, next.month, 10);
    },

    /**
     * FechaPagoDelCorte: payment date that follows a cut-off (10 → 15, 25 → 30 or last day).
     *
     * @param {string|CalendarDate} cutoffDate - Day 10 or 25.
     * @returns {CalendarDate}
     * @throws {Error} If the date is not a cut-off day.
     */
    paymentDateOfCutoff(cutoffDate) {
        const date = CalendarDate.from(cutoffDate);
        if (date.day === 10) return new CalendarDate(date.year, date.month, 15);
        if (date.day === 25) return this.endOfMonthPayment(date.year, date.month);
        throw new Error('La fecha de corte debe ser el día 10 o 25.');
    },

    /**
     * Cut-off dates around a reference date, for the cut-off report selector.
     *
     * @param {CalendarDate} reference - Usually today.
     * @param {number} [monthsBack=4] - Months before.
     * @param {number} [monthsAhead=4] - Months after.
     * @returns {CalendarDate[]} Ordered from the most recent to the oldest.
     */
    cutoffsAround(reference, monthsBack = 4, monthsAhead = 4) {
        const first = new CalendarDate(reference.year, reference.month, 1);
        const result = [];
        for (let offset = monthsAhead; offset >= -monthsBack; offset--) {
            const month = first.plusMonths(offset);
            result.push(new CalendarDate(month.year, month.month, 25), new CalendarDate(month.year, month.month, 10));
        }
        return result;
    },

    /**
     * Next cut-off whose payment date has not passed yet (default of the report screen).
     *
     * @param {CalendarDate} today - Today.
     * @returns {CalendarDate}
     */
    currentCutoff(today) {
        if (today.day <= 15) return new CalendarDate(today.year, today.month, 10);
        if (today.day <= this.endOfMonthPayment(today.year, today.month).day) return new CalendarDate(today.year, today.month, 25);
        const next = new CalendarDate(today.year, today.month, 1).plusMonths(1);
        return new CalendarDate(next.year, next.month, 10);
    }
};

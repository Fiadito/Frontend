import {CalendarDate} from '@/shared/domain/model/calendar-date.js';

/**
 * Source of "today" for the application.
 *
 * @remarks
 * By default it is the real date of the computer. VITE_SYSTEM_DATE (YYYY-MM-DD) lets the team
 * rehearse the test cases of the report on another date (e.g. 2026-11-04 for CP09) without
 * changing the clock of the computer.
 */
const simulatedDate = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SYSTEM_DATE) || '';

export const systemClock = {
    /** @returns {CalendarDate} Today. */
    today() {
        return simulatedDate ? CalendarDate.from(simulatedDate) : CalendarDate.today();
    },

    /** @returns {string} Current date-time as "YYYY-MM-DDTHH:mm" (local time). */
    nowLocal() {
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return `${this.today().toIsoString()}T${time}`;
    },

    /** @returns {boolean} True when a simulated date is configured. */
    isSimulated() {
        return Boolean(simulatedDate);
    }
};

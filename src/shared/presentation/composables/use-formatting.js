import {CalendarDate} from '@/shared/domain/model/calendar-date.js';

/**
 * Formatting helpers for the views (Peruvian formats of Tablas 1–3 of the report).
 */
export const useFormatting = () => {
    /**
     * "S/ 1,000.00" (or "US$" for dollars).
     *
     * @param {number} value
     * @param {string} [currency='PEN']
     * @returns {string}
     */
    const formatMoney = (value, currency = 'PEN') => {
        const number = Number(value ?? 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        return currency === 'USD' ? `US$ ${number}` : `S/ ${number}`;
    };

    /**
     * Rate given as a fraction: 0.0013064 → "0.1306400%".
     *
     * @param {number} value
     * @param {number} [decimals=7]
     * @returns {string}
     */
    const formatRate = (value, decimals = 7) => `${(Number(value ?? 0) * 100).toFixed(decimals)}%`;

    /** @param {CalendarDate|string} value @returns {string} "DD/MM/YYYY". */
    const formatDate = value => (value ? CalendarDate.from(value).format() : '—');

    /** @param {CalendarDate|string} value @returns {string} "DD/MM". */
    const formatShortDate = value => (value ? CalendarDate.from(value).format().slice(0, 5) : '—');

    /**
     * "YYYY-MM-DDTHH:mm" or ISO → "DD/MM/YYYY HH:mm".
     *
     * @param {string} value
     * @returns {string}
     */
    const formatDateTime = value => {
        if (!value) return '—';
        const text = String(value);
        if (text.endsWith('Z')) {
            const date = new Date(text);
            return `${CalendarDate.from(date).format()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        }
        return `${CalendarDate.from(text).format()} ${text.slice(11, 16)}`;
    };

    return {formatMoney, formatRate, formatDate, formatShortDate, formatDateTime};
};

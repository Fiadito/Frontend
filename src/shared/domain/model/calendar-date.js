/**
 * Value object representing a calendar day (no time zone, no hours).
 *
 * @remarks
 * Financial calculations count calendar days between dates (e.g. 15/09 to 26/09 = 11 days).
 * Using a date-only value avoids time zone shifts that a plain Date would introduce.
 * It is immutable.
 */
export class CalendarDate {
    /**
     * Creates a new CalendarDate.
     *
     * @param {number} year - Four-digit year.
     * @param {number} month - Month from 1 to 12.
     * @param {number} day - Day of the month.
     * @throws {Error} If the date does not exist.
     */
    constructor(year, month, day) {
        const probe = new Date(Date.UTC(year, month - 1, day));
        if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
            throw new Error(`Invalid calendar date: ${year}-${month}-${day}`);
        }
        this.year = year;
        this.month = month;
        this.day = day;
        Object.freeze(this);
    }

    /**
     * Parses "YYYY-MM-DD" (also accepts "YYYY-MM-DDTHH:mm..." and "DD/MM/YYYY").
     *
     * @param {string|CalendarDate|Date} value - The value to parse.
     * @returns {CalendarDate}
     * @throws {Error} If the value cannot be parsed.
     */
    static from(value) {
        if (value instanceof CalendarDate) return value;
        if (value instanceof Date) return new CalendarDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
        const text = String(value ?? '').trim();
        let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return new CalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
        match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (match) return new CalendarDate(Number(match[3]), Number(match[2]), Number(match[1]));
        throw new Error(`Unsupported date format: ${text}`);
    }

    /** @returns {CalendarDate} Today in the local time zone. */
    static today() {
        return CalendarDate.from(new Date());
    }

    /**
     * Number of days in a month.
     *
     * @param {number} year - The year.
     * @param {number} month - Month from 1 to 12.
     * @returns {number}
     */
    static daysInMonth(year, month) {
        return new Date(Date.UTC(year, month, 0)).getUTCDate();
    }

    /** @returns {number} Days since the Unix epoch (used to subtract dates). */
    get epochDay() {
        return Math.round(Date.UTC(this.year, this.month - 1, this.day) / 86400000);
    }

    /**
     * Calendar days from this date to another one (negative if the other is earlier).
     *
     * @param {CalendarDate} other - The later date.
     * @returns {number}
     */
    daysUntil(other) {
        return CalendarDate.from(other).epochDay - this.epochDay;
    }

    /**
     * Moves the date by whole months, keeping the day (or the last day of the target month).
     *
     * @param {number} months - Months to add (may be negative).
     * @returns {CalendarDate}
     */
    plusMonths(months) {
        const index = this.year * 12 + (this.month - 1) + months;
        const year = Math.floor(index / 12);
        const month = index % 12 + 1;
        return new CalendarDate(year, month, Math.min(this.day, CalendarDate.daysInMonth(year, month)));
    }

    /**
     * Moves the date by calendar days.
     *
     * @param {number} days - Days to add (may be negative).
     * @returns {CalendarDate}
     */
    plusDays(days) {
        const date = new Date((this.epochDay + days) * 86400000);
        return new CalendarDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    }

    /** @returns {number} Last day of this month. */
    get lastDayOfMonth() {
        return CalendarDate.daysInMonth(this.year, this.month);
    }

    /**
     * Compares two dates.
     *
     * @param {CalendarDate} other - The other date.
     * @returns {number} Negative, zero or positive.
     */
    compareTo(other) {
        return this.epochDay - CalendarDate.from(other).epochDay;
    }

    /**
     * @param {CalendarDate} other - The other date.
     * @returns {boolean} True when both represent the same day.
     */
    equals(other) {
        return other !== null && other !== undefined && this.compareTo(other) === 0;
    }

    /** @returns {string} ISO format "YYYY-MM-DD". */
    toIsoString() {
        return `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`;
    }

    /** @returns {string} Peruvian format "DD/MM/YYYY". */
    format() {
        return `${String(this.day).padStart(2, '0')}/${String(this.month).padStart(2, '0')}/${this.year}`;
    }

    /** @returns {string} ISO format, used by JSON serialization. */
    toJSON() {
        return this.toIsoString();
    }
}

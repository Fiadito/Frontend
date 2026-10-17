import {roundRate} from '@/shared/domain/model/rounding.js';

/**
 * Periods in which an effective rate can be agreed, with their days (commercial year of 360 days).
 *
 * @readonly
 * @enum {{code: string, label: string, days: number}}
 */
export const RatePeriod = Object.freeze({
    TEA: {code: 'TEA', label: 'Anual (TEA)', days: 360},
    TES: {code: 'TES', label: 'Semestral (TES)', days: 180},
    TET: {code: 'TET', label: 'Trimestral (TET)', days: 90},
    TEM: {code: 'TEM', label: 'Mensual (TEM)', days: 30},
    TEQ: {code: 'TEQ', label: 'Quincenal (TEQ)', days: 15}
});

/** @returns {Array<{code: string, label: string, days: number}>} Periods for selects. */
export const ratePeriods = () => Object.values(RatePeriod);

/**
 * Value object: an effective interest rate agreed for a period (only effective rates are used,
 * as indicated by the professor).
 *
 * @remarks
 * Formula 1 of the report: TED = (1 + TEP)^(1/N) − 1, rounded to 7 decimals.
 * Effective to effective: TEP2 = (1 + TEP1)^(n2/n1) − 1.
 */
export class EffectiveRate {
    /**
     * @param {string} periodCode - TEA, TES, TET, TEM or TEQ.
     * @param {number} value - Rate as a fraction (0.60 = 60 %).
     * @throws {Error} If the period is unknown or the value is negative.
     */
    constructor(periodCode, value) {
        const period = RatePeriod[periodCode];
        if (!period) throw new Error(`Periodo de tasa no válido: ${periodCode}`);
        if (!(Number(value) >= 0)) throw new Error('La tasa debe ser un número positivo.');
        this.period = period;
        this.value = Number(value);
        Object.freeze(this);
    }

    /** @returns {number} N: days of the period of the rate. */
    get days() {
        return this.period.days;
    }

    /**
     * Converts the rate to an effective rate of another number of days.
     *
     * @param {number} targetDays - Days of the target period.
     * @returns {number} The equivalent rate, rounded to 7 decimals.
     */
    toDays(targetDays) {
        return roundRate(Math.pow(1 + this.value, targetDays / this.days) - 1);
    }

    /** @returns {number} TED: effective daily rate, rounded to 7 decimals. */
    toDaily() {
        return this.toDays(1);
    }

    /**
     * Equivalent rate in another period.
     *
     * @param {string} periodCode - Target period code.
     * @returns {number}
     */
    toPeriod(periodCode) {
        return this.toDays(RatePeriod[periodCode].days);
    }
}

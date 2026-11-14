import {EffectiveRate} from '@/shared/domain/model/effective-rate.js';

/**
 * Credit rules of Fiadito (the backend validates them again).
 *
 * @readonly
 */
export const CreditPolicy = Object.freeze({
    /** Minimum and maximum credit limit and purchase amount (S/). Combos of S/ 100 and 200 are bought in quantity. */
    MIN_AMOUNT: 400,
    MAX_AMOUNT: 1000,
    /** Maximum fortnightly installments (4 months). */
    MAX_INSTALLMENTS: 8,
    /** Effective rate of a sale (compensatory interest of the plan): equivalent TEA between 15 % and 27 %. */
    MIN_SALE_RATE: 0.15,
    MAX_SALE_RATE: 0.27,
    DEFAULT_SALE_RATE: 0.20,
    DEFAULT_SALE_RATE_PERIOD: 'TEA',
    /** Late-payment rate: entered when paying something overdue; equivalent TEA ≥ 40 %, TEA 60 % by default. */
    MIN_LATE_RATE: 0.40,
    DEFAULT_LATE_RATE: 0.60,
    DEFAULT_LATE_RATE_PERIOD: 'TEA',
    DEFAULT_CREDIT_LIMIT: 1000,
    /** Prices of a combo. */
    COMBO_PRICES: [100, 200, 400],
    CURRENCIES: [{code: 'PEN', label: 'Soles (PEN)'}, {code: 'USD', label: 'Dólares (USD)'}]
});

/**
 * @param {string} period
 * @param {number|null} value - Fraction.
 * @returns {string|null} Error message, or null when the rate of the sale is valid.
 */
export const saleRateError = (period, value) => {
    if (!period) return 'Selecciona el periodo de la tasa efectiva de la venta.';
    if (!(value > 0)) return 'Ingresa la tasa efectiva de la venta.';
    if (!new EffectiveRate(period, value).annualBetween(CreditPolicy.MIN_SALE_RATE, CreditPolicy.MAX_SALE_RATE))
        return 'La tasa efectiva de la venta debe equivaler a una TEA entre 15 % y 27 %.';
    return null;
};

/**
 * @param {string} period
 * @param {number|null} value - Fraction.
 * @returns {string|null} Error message, or null when the late rate is valid.
 */
export const lateRateError = (period, value) => {
    if (!period || !(value > 0)) return 'Ingresa la tasa moratoria.';
    if (!new EffectiveRate(period, value).annualBetween(CreditPolicy.MIN_LATE_RATE, null))
        return 'La tasa moratoria debe equivaler a una TEA de al menos 40 %.';
    return null;
};

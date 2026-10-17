/**
 * Rounding rules of the course calculation conventions (Anexo A of the assignment).
 *
 * @remarks
 * Money amounts are rounded to 2 decimals and interest rates to 7 decimals.
 */

/**
 * Rounds a money amount to 2 decimals.
 *
 * @param {number} value - The amount.
 * @returns {number} The rounded amount.
 */
export const roundMoney = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/**
 * Rounds an interest rate (as a fraction, e.g. 0.0007291) to 7 decimals.
 *
 * @param {number} value - The rate.
 * @returns {number} The rounded rate.
 */
export const roundRate = value => Math.round((Number(value) + Number.EPSILON) * 1e7) / 1e7;

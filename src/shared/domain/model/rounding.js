/**
 * Rounding rules of the course calculation conventions.
 *
 * @remarks
 * Money amounts are rounded to 2 decimals. Interest rates keep 7 decimals expressed as a percentage
 * (0.1306418 %), that is 9 decimals as a fraction (0.001306418). The backend uses the same rule.
 */

/**
 * Rounds a money amount to 2 decimals.
 *
 * @param {number} value - The amount.
 * @returns {number} The rounded amount.
 */
export const roundMoney = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/**
 * Rounds an interest rate (as a fraction, e.g. 0.001306418) to 9 decimals = 7 decimals in %.
 *
 * @param {number} value - The rate.
 * @returns {number} The rounded rate.
 */
export const roundRate = value => Math.round((Number(value) + Number.EPSILON) * 1e9) / 1e9;

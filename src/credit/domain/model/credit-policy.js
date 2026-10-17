/**
 * Credit rules of Fiadito (Tabla 1 of the report and Anexo A of the assignment).
 *
 * @readonly
 */
export const CreditPolicy = Object.freeze({
    /** Minimum and maximum credit limit and purchase amount (S/). */
    MIN_AMOUNT: 400,
    MAX_AMOUNT: 1000,
    /** Maximum fortnightly installments (4 months). */
    MAX_INSTALLMENTS: 8,
    /** Minimum agreed effective late-payment rate (40 %). */
    MIN_LATE_RATE: 0.40,
    /** Default agreed late-payment rate: TEA 60 %. */
    DEFAULT_LATE_RATE: 0.60,
    DEFAULT_LATE_RATE_PERIOD: 'TEA',
    DEFAULT_CREDIT_LIMIT: 1000,
    CURRENCIES: [{code: 'PEN', label: 'Soles (PEN)'}, {code: 'USD', label: 'Dólares (USD)'}]
});

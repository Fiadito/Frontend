/**
 * Payment methods accepted by the business (PAGO.medio_pago).
 *
 * @readonly
 */
export const paymentMethods = Object.freeze([
    {code: 'EFECTIVO', label: 'Efectivo'},
    {code: 'YAPE', label: 'Yape'},
    {code: 'PLIN', label: 'Plin'},
    {code: 'TRANSFERENCIA', label: 'Transferencia bancaria'}
]);

/**
 * @param {string} code - Method code.
 * @returns {string} Label to show.
 */
export const paymentMethodLabel = code => paymentMethods.find(method => method.code === code)?.label ?? code;

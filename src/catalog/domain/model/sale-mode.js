/**
 * Sale modes of a product and payment modes of a sale.
 *
 * @readonly
 */
export const SaleMode = Object.freeze({
    SINGLE_PAYMENT: 'PAGO_UNICO',
    INSTALLMENTS: 'CUOTAS',
    BOTH: 'AMBAS'
});

/** Labels shown in the views. */
export const saleModeLabels = Object.freeze({
    PAGO_UNICO: 'Pago único',
    CUOTAS: 'Cuotas',
    AMBAS: 'Pago único o cuotas'
});

/** @returns {Array<{code: string, label: string}>} Options of the product form. */
export const productSaleModes = () => Object.entries(saleModeLabels).map(([code, label]) => ({code, label}));

/**
 * @param {string} productMode - Mode allowed by the product.
 * @param {string} paymentMode - PAGO_UNICO or CUOTAS.
 * @returns {boolean} True when the product can be sold in that mode.
 */
export const allowsMode = (productMode, paymentMode) => productMode === SaleMode.BOTH || productMode === paymentMode;

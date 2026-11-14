import {CreditSale} from '@/credit/domain/model/credit-sale.entity.js';
import {Installment} from '@/credit/domain/model/installment.entity.js';

const number = value => (value === null || value === undefined ? null : Number(value));

/**
 * Converts VENTA and CUOTA resources into entities, and the sale form into the request body.
 */
export const CreditAssembler = {
    /** @param {Object} r @returns {Installment} */
    toInstallment(r) {
        return new Installment({
            id: r.id, saleId: r.idVenta, number: r.numero, dueDate: r.fechaVencimiento, openingBalance: Number(r.saldoInicial),
            interest: Number(r.interes ?? 0), amortization: Number(r.amortizacion), amount: Number(r.montoCuota),
            closingBalance: Number(r.saldoFinal), status: r.estado
        });
    },

    /** @param {Object} r @returns {CreditSale} */
    toSale(r) {
        return new CreditSale({
            id: r.id, memberId: r.idSocio, memberName: r.nombreSocio, productId: r.idProducto, productName: r.producto, quantity: r.cantidad,
            listPrice: Number(r.precioLista), amount: Number(r.monto), purchaseDateTime: r.fechaHoraCompra, paymentMode: r.modalidad,
            installmentCount: r.nCuotas, ratePeriod: r.periodoTasa, rateValue: number(r.valorTasa), periodRate: number(r.tasaQuincenal),
            annualRate: number(r.teaEquivalente), paymentDate: r.fechaPago, installmentAmount: Number(r.cuota),
            interestTotal: Number(r.interesTotal ?? 0), totalToPay: Number(r.totalAPagar), status: r.estado,
            installments: (r.cuotas ?? []).map(item => this.toInstallment(item))
        });
    },

    /**
     * Plan rows (of a simulation or of a saved sale), in the shape of the schedule table.
     *
     * @param {Object} r - Row of "cronograma" or "cuotas".
     * @returns {{number: number, dueDate: string, openingBalance: number, interest: number, amortization: number, amount: number,
     *   closingBalance: number, status?: string}}
     */
    toScheduleRow(r) {
        return {
            number: r.numero, dueDate: r.fechaVencimiento, openingBalance: Number(r.saldoInicial), interest: Number(r.interes ?? 0),
            amortization: Number(r.amortizacion), amount: Number(r.montoCuota), closingBalance: Number(r.saldoFinal), status: r.estado
        };
    },

    /**
     * @param {{memberId: number, productId: number, quantity: number, purchaseDateTime: string, paymentMode: string,
     *   installmentCount: number, ratePeriod: string, ratePercent: number|null}} form
     * @returns {Object} Body of POST /ventas and /ventas/simulacion.
     */
    toRequest(form) {
        return {
            idSocio: form.memberId, idProducto: form.productId, cantidad: form.quantity, fechaHoraCompra: form.purchaseDateTime,
            modalidad: form.paymentMode, nCuotas: form.paymentMode === 'CUOTAS' ? form.installmentCount : 1,
            periodoTasa: form.ratePeriod, valorTasa: form.ratePercent === null || form.ratePercent === undefined ? null : form.ratePercent / 100
        };
    }
};

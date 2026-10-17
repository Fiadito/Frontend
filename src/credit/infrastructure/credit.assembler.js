import {CreditSale} from '@/credit/domain/model/credit-sale.entity.js';
import {Installment} from '@/credit/domain/model/installment.entity.js';

/**
 * Converts VENTA and CUOTA resources into entities and back.
 */
export const CreditAssembler = {
    /** @param {Object} r @returns {CreditSale} */
    toSale(r) {
        return new CreditSale({
            id: r.id, businessId: r.idNegocio, memberId: r.idSocio, productId: r.idProducto, quantity: r.cantidad, listPrice: Number(r.precioLista),
            amount: Number(r.monto), purchaseDateTime: r.fechaHoraCompra, paymentMode: r.modalidad, installmentCount: r.nCuotas, paymentDate: r.fechaPago,
            installmentAmount: Number(r.cuota), totalToPay: Number(r.totalAPagar), status: r.estado
        });
    },

    /** @param {CreditSale} s @returns {Object} */
    toSaleResource(s) {
        return {
            idNegocio: s.businessId, idSocio: s.memberId, idProducto: s.productId, cantidad: s.quantity, precioLista: s.listPrice, monto: s.amount,
            fechaHoraCompra: s.purchaseDateTime, modalidad: s.paymentMode, nCuotas: s.installmentCount, fechaPago: s.paymentDate.toIsoString(),
            cuota: s.installmentAmount, totalAPagar: s.totalToPay, estado: s.status
        };
    },

    /** @param {Object} r @returns {Installment} */
    toInstallment(r) {
        return new Installment({
            id: r.id, saleId: r.idVenta, number: r.numero, dueDate: r.fechaVencimiento, openingBalance: Number(r.saldoInicial),
            amortization: Number(r.amortizacion), amount: Number(r.montoCuota), closingBalance: Number(r.saldoFinal), status: r.estado
        });
    },

    /**
     * @param {Object} row - Row of InstallmentSchedule.build().
     * @param {CreditSale} sale - The saved sale.
     * @returns {Object}
     */
    toInstallmentResource(row, sale) {
        return {
            idVenta: sale.id, idNegocio: sale.businessId, idSocio: sale.memberId, numero: row.number, fechaVencimiento: row.dueDate.toIsoString(),
            saldoInicial: row.openingBalance, amortizacion: row.amortization, montoCuota: row.amount, saldoFinal: row.closingBalance, estado: 'PENDIENTE'
        };
    }
};

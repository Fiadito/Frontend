import {Payment} from '@/billing/domain/model/payment.entity.js';

/**
 * Converts PAGO resources into Payment entities and back.
 */
export const PaymentAssembler = {
    /** @param {Object} r @returns {Payment} */
    toEntity(r) {
        return new Payment({
            id: r.id, businessId: r.idNegocio, saleId: r.idVenta, installmentId: r.idCuota ?? null, memberId: r.idSocio, paymentDate: r.fechaPagoReal,
            lateDays: r.diasMora, lateDailyRate: Number(r.tedMora), lateInterest: Number(r.interesMora), totalPaid: Number(r.totalPagado),
            lateImputation: Number(r.imputacionMora), capitalImputation: Number(r.imputacionCapital), method: r.medioPago, registeredAt: r.fechaRegistro
        });
    },

    /** @param {Payment} p @returns {Object} */
    toResource(p) {
        return {
            idNegocio: p.businessId, idVenta: p.saleId, idCuota: p.installmentId, idSocio: p.memberId, fechaPagoReal: p.paymentDate.toIsoString(),
            diasMora: p.lateDays, tedMora: p.lateDailyRate, interesMora: p.lateInterest, totalPagado: p.totalPaid, imputacionMora: p.lateImputation,
            imputacionCapital: p.capitalImputation, medioPago: p.method, fechaRegistro: p.registeredAt
        };
    }
};

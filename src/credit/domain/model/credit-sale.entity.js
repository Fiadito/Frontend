import {CalendarDate} from '@/shared/domain/model/calendar-date.js';
import {Installment} from '@/credit/domain/model/installment.entity.js';

/**
 * Entity (aggregate root of Credit): a sale on credit to a member (VENTA) with its effective rate and its payment plan (CUOTA).
 *
 * @remarks
 * The amounts and the plan are computed by the backend (POST /ventas/simulacion, POST /ventas and PATCH /ventas/{id}/tasa).
 */
export class CreditSale {
    /**
     * @param {Object} props
     * @param {number} props.id
     * @param {number} props.memberId
     * @param {string} props.memberName
     * @param {number} props.productId
     * @param {string} props.productName
     * @param {number} props.quantity
     * @param {number} props.listPrice
     * @param {number} props.amount - List price × quantity (capital).
     * @param {string} props.purchaseDateTime - "YYYY-MM-DDTHH:mm".
     * @param {string} props.paymentMode - PAGO_UNICO or CUOTAS.
     * @param {number} props.installmentCount
     * @param {string} props.ratePeriod - Period of the effective rate of the sale.
     * @param {number} props.rateValue - Effective rate of the sale (fraction).
     * @param {number} props.periodRate - TEQ applied in each installment.
     * @param {number} props.annualRate - Equivalent TEA.
     * @param {string} props.paymentDate - Single payment date or due date of installment 1.
     * @param {number} props.installmentAmount
     * @param {number} props.interestTotal
     * @param {number} props.totalToPay - Capital + interest.
     * @param {string} props.status - PENDIENTE, PAGADA or EN_MORA.
     * @param {Installment[]} [props.installments]
     */
    constructor({id, memberId, memberName = '', productId, productName = '', quantity, listPrice, amount, purchaseDateTime, paymentMode,
                    installmentCount, ratePeriod, rateValue, periodRate, annualRate, paymentDate, installmentAmount, interestTotal = 0,
                    totalToPay, status, installments = []}) {
        this.id = id;
        this.memberId = memberId;
        this.memberName = memberName;
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.listPrice = listPrice;
        this.amount = amount;
        this.purchaseDateTime = purchaseDateTime;
        this.paymentMode = paymentMode;
        this.installmentCount = installmentCount;
        this.ratePeriod = ratePeriod;
        this.rateValue = rateValue;
        this.periodRate = periodRate;
        this.annualRate = annualRate;
        this.paymentDate = CalendarDate.from(paymentDate);
        this.installmentAmount = installmentAmount;
        this.interestTotal = interestTotal;
        this.totalToPay = totalToPay;
        this.status = status;
        this.installments = installments;
    }

    /** @returns {boolean} */
    get isPaid() {
        return this.status === 'PAGADA';
    }

    /** @returns {boolean} */
    get isInInstallments() {
        return this.paymentMode === 'CUOTAS';
    }

    /** @returns {CalendarDate} */
    get purchaseDate() {
        return CalendarDate.from(this.purchaseDateTime);
    }
}

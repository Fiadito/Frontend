import {CalendarDate} from '@/shared/domain/model/calendar-date.js';
import {roundMoney} from '@/shared/domain/model/rounding.js';
import {CreditPolicy} from '@/credit/domain/model/credit-policy.js';
import {PaymentCalendar} from '@/credit/domain/model/payment-calendar.js';
import {InstallmentSchedule} from '@/credit/domain/model/installment-schedule.js';
import {allowsMode, SaleMode} from '@/catalog/domain/model/sale-mode.js';

/**
 * Entity (aggregate root of Credit): a sale on credit to a member (VENTA).
 *
 * @remarks
 * Stores the results of the calculation (amount, payment date, installment and total) so that
 * they do not change if the member's late rate is edited later (point 8 of the report).
 */
export class CreditSale {
    /**
     * @param {Object} props
     * @param {number|null} props.id
     * @param {number} props.businessId
     * @param {number} props.memberId
     * @param {number} props.productId
     * @param {number} props.quantity
     * @param {number} props.listPrice
     * @param {number} props.amount - List price × quantity.
     * @param {string} props.purchaseDateTime - "YYYY-MM-DDTHH:mm".
     * @param {string} props.paymentMode - PAGO_UNICO or CUOTAS.
     * @param {number} props.installmentCount - 1 for a single payment.
     * @param {string|CalendarDate} props.paymentDate - Single payment date or due date of installment 1.
     * @param {number} props.installmentAmount - Fixed installment (amount ÷ n).
     * @param {number} props.totalToPay
     * @param {string} [props.status='PENDIENTE'] - PENDIENTE or PAGADA.
     */
    constructor({id = null, businessId, memberId, productId, quantity, listPrice, amount, purchaseDateTime, paymentMode,
                    installmentCount, paymentDate, installmentAmount, totalToPay, status = 'PENDIENTE'}) {
        this.id = id;
        this.businessId = businessId;
        this.memberId = memberId;
        this.productId = productId;
        this.quantity = quantity;
        this.listPrice = listPrice;
        this.amount = amount;
        this.purchaseDateTime = purchaseDateTime;
        this.paymentMode = paymentMode;
        this.installmentCount = installmentCount;
        this.paymentDate = CalendarDate.from(paymentDate);
        this.installmentAmount = installmentAmount;
        this.totalToPay = totalToPay;
        this.status = status;
    }

    /** @returns {boolean} */
    get isPaid() {
        return this.status === 'PAGADA';
    }

    /** @returns {boolean} */
    get isInInstallments() {
        return this.paymentMode === SaleMode.INSTALLMENTS;
    }

    /** @returns {CalendarDate} Purchase date (without time). */
    get purchaseDate() {
        return CalendarDate.from(this.purchaseDateTime);
    }

    /**
     * Simulates a sale (POST /ventas/simulacion): validates it and computes the plan.
     *
     * @param {Object} request
     * @param {import('@/membership/domain/model/member.entity.js').Member|null} request.member
     * @param {import('@/catalog/domain/model/product.entity.js').Product|null} request.product
     * @param {number} request.quantity
     * @param {string} request.purchaseDateTime - "YYYY-MM-DDTHH:mm".
     * @param {string} request.paymentMode - PAGO_UNICO or CUOTAS.
     * @param {number} request.installmentCount
     * @param {number} request.memberCapitalDebt - Pending capital of the member.
     * @param {CalendarDate} request.today - Today.
     * @returns {{errors: string[], sale: CreditSale|null, schedule: Array, cutoffDate: CalendarDate|null}}
     */
    static simulate({member, product, quantity, purchaseDateTime, paymentMode, installmentCount, memberCapitalDebt, today}) {
        const errors = [];
        if (!member) errors.push('Selecciona un socio.');
        if (!product) errors.push('Selecciona un producto.');
        if (!Number.isInteger(quantity) || quantity < 1) errors.push('La cantidad debe ser un número entero mayor o igual a 1.');
        if (!purchaseDateTime) errors.push('Ingresa la fecha y hora de la compra.');
        if (errors.length) return {errors, sale: null, schedule: [], cutoffDate: null};

        const amount = roundMoney(product.listPrice * quantity);
        const count = paymentMode === SaleMode.INSTALLMENTS ? installmentCount : 1;
        if (!member.isActive) errors.push('El socio está dado de baja.');
        if (!product.isActive) errors.push('El producto está dado de baja.');
        if (CalendarDate.from(purchaseDateTime).compareTo(today) > 0) errors.push('La fecha de compra no puede ser futura.');
        if (amount < CreditPolicy.MIN_AMOUNT || amount > CreditPolicy.MAX_AMOUNT) errors.push('El monto debe estar entre S/ 400.00 y S/ 1,000.00.');
        if (roundMoney(memberCapitalDebt + amount) > member.creditLimit) errors.push('La compra excede el límite de crédito del socio (crédito insuficiente).');
        if (!allowsMode(product.saleMode, paymentMode)) errors.push('El producto no se vende en esta modalidad.');
        if (paymentMode === SaleMode.INSTALLMENTS && (!Number.isInteger(count) || count < 1 || count > member.maxInstallments)) {
            errors.push(`Número de cuotas no permitido (de 1 a ${member.maxInstallments}).`);
        }

        const paymentDate = PaymentCalendar.firstPaymentDate(purchaseDateTime);
        const schedule = paymentMode === SaleMode.INSTALLMENTS && count >= 1 && count <= CreditPolicy.MAX_INSTALLMENTS
            ? InstallmentSchedule.build(amount, paymentDate, count) : [];
        const sale = new CreditSale({
            businessId: member.businessId, memberId: member.id, productId: product.id, quantity, listPrice: product.listPrice,
            amount, purchaseDateTime, paymentMode, installmentCount: count, paymentDate,
            installmentAmount: paymentMode === SaleMode.INSTALLMENTS && count >= 1 ? InstallmentSchedule.fixedInstallment(amount, count) : amount,
            totalToPay: amount
        });
        return {errors, sale, schedule, cutoffDate: PaymentCalendar.cutoffOf(purchaseDateTime)};
    }
}

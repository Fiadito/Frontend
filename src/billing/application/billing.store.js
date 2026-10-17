import {reactive} from 'vue';
import {PaymentApi} from '@/billing/infrastructure/payment-api.js';
import {PaymentAssembler} from '@/billing/infrastructure/payment.assembler.js';
import {Payment} from '@/billing/domain/model/payment.entity.js';
import {LateInterest} from '@/billing/domain/model/late-interest.js';
import {Obligation} from '@/billing/domain/model/obligation.js';
import {AccountStatement} from '@/billing/domain/model/account-statement.js';
import {CalendarDate} from '@/shared/domain/model/calendar-date.js';
import {systemClock} from '@/shared/domain/model/system-clock.js';
import {creditStore} from '@/credit/application/credit.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {domainEventBus, DomainEvents} from '@/shared/application/domain-event-bus.js';

const paymentApi = new PaymentApi();

/**
 * Application service of the Billing context: obligations, payments with late interest,
 * account statements (modules 7.8, 7.9, 7.10).
 */
export const billingStore = reactive({
    /** @type {Payment[]} */
    payments: [],
    loading: false,

    /**
     * @param {Object} params - {idNegocio} or {idSocio}.
     * @returns {Promise<void>}
     */
    async load(params) {
        this.loading = true;
        try {
            this.payments = (await paymentApi.getPayments(params)).data.map(resource => PaymentAssembler.toEntity(resource));
        } finally {
            this.loading = false;
        }
    },

    /** @returns {Obligation[]} All obligations of the loaded sales, ordered by due date. */
    get obligations() {
        return Obligation.fromSales(creditStore.sales, creditStore.installments, this.payments);
    },

    /**
     * @param {import('@/membership/domain/model/member.entity.js').Member} member
     * @returns {AccountStatement}
     */
    statementOf(member) {
        return new AccountStatement(member, this.obligations.filter(item => item.memberId === member.id), systemClock.today());
    },

    /**
     * Quote of a payment (POST /pagos/cotizacion).
     *
     * @param {Obligation} obligation
     * @param {import('@/membership/domain/model/member.entity.js').Member} member
     * @param {string|CalendarDate} paymentDate
     * @returns {ReturnType<typeof LateInterest.quote>}
     */
    quote(obligation, member, paymentDate) {
        return LateInterest.quote({amount: obligation.amount, dueDate: obligation.dueDate, paymentDate, lateRate: member.lateRate});
    },

    /**
     * RegistrarPago: only full payments are accepted; imputation late interest → capital.
     *
     * @param {Object} request
     * @param {Obligation} request.obligation
     * @param {import('@/membership/domain/model/member.entity.js').Member} request.member
     * @param {string} request.paymentDate - "YYYY-MM-DD".
     * @param {string} request.method
     * @param {number} request.paid - Amount entered.
     * @returns {Promise<Payment>}
     */
    async register({obligation, member, paymentDate, method, paid}) {
        if (obligation.isPaid) throw 'Esta obligación ya fue pagada.';
        if (!paymentDate) throw 'Ingresa la fecha real de pago.';
        if (CalendarDate.from(paymentDate).compareTo(obligation.sale.purchaseDate) < 0) throw 'La fecha de pago no puede ser anterior a la fecha de compra.';
        if (!method) throw 'Selecciona el medio de pago.';
        const quote = this.quote(obligation, member, paymentDate);
        if (!LateInterest.isFullPayment(paid, quote.total)) throw `Debe cancelar el total: S/ ${quote.total.toFixed(2)} (no se aceptan pagos parciales).`;
        const payment = new Payment({
            businessId: obligation.sale.businessId, saleId: obligation.sale.id, installmentId: obligation.installment?.id ?? null, memberId: member.id,
            paymentDate, lateDays: quote.lateDays, lateDailyRate: quote.dailyRate, lateInterest: quote.lateInterest, totalPaid: quote.total,
            lateImputation: quote.lateImputation, capitalImputation: quote.capitalImputation, method, registeredAt: new Date().toISOString()
        });
        const saved = PaymentAssembler.toEntity((await paymentApi.create(PaymentAssembler.toResource(payment))).data);
        await creditStore.markPaid(obligation.sale, obligation.installment);
        this.payments.push(saved);
        domainEventBus.publish(DomainEvents.PAYMENT_REGISTERED, iamStore.auditContext({
            recordId: saved.id,
            detail: `Pago de ${member.fullName} – ${obligation.label}: S/ ${saved.totalPaid.toFixed(2)} (mora S/ ${saved.lateInterest.toFixed(2)}, ${saved.lateDays} días)`
        }));
        return saved;
    }
});

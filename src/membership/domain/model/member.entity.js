import {CreditPolicy} from '@/credit/domain/model/credit-policy.js';

/**
 * Entity: a member (socio) of the business with his credit conditions (SOCIO).
 *
 * @remarks
 * The rates are not part of the member: the effective rate is agreed in each sale and the late rate is entered
 * when an overdue obligation is paid.
 */
export class Member {
    /**
     * @param {Object} props
     * @param {number|null} props.id
     * @param {number} props.businessId
     * @param {string} props.dni - 8 digits.
     * @param {string} props.fullName
     * @param {string} props.phone - 9 digits.
     * @param {string} props.address
     * @param {string} [props.currency='PEN']
     * @param {number} [props.creditLimit=1000]
     * @param {number} [props.maxInstallments=8]
     * @param {string} [props.status='ACTIVO']
     * @param {string} [props.email] - Email of the member account (read only).
     * @param {number} [props.debt] - Pending capital debt (computed by the backend).
     * @param {number} [props.availableCredit] - Credit limit − debt (computed by the backend).
     * @param {boolean} [props.overdue] - True when an obligation is overdue.
     */
    constructor({id = null, businessId, dni = '', fullName = '', phone = '', address = '', currency = 'PEN',
                    creditLimit = CreditPolicy.DEFAULT_CREDIT_LIMIT, maxInstallments = CreditPolicy.MAX_INSTALLMENTS, status = 'ACTIVO',
                    email = '', debt = 0, availableCredit = null, overdue = false}) {
        this.id = id;
        this.businessId = businessId;
        this.dni = dni;
        this.fullName = fullName;
        this.phone = phone;
        this.address = address;
        this.currency = currency;
        this.creditLimit = creditLimit;
        this.maxInstallments = maxInstallments;
        this.status = status;
        this.email = email;
        this.debt = debt;
        this.availableCredit = availableCredit ?? creditLimit;
        this.overdue = overdue;
    }

    /** @returns {boolean} */
    get isActive() {
        return this.status === 'ACTIVO';
    }

    /**
     * Validations of GuardarSocio (module 7.4).
     *
     * @returns {string[]} Error messages (empty when valid).
     */
    validate() {
        const errors = [];
        if (!/^\d{8}$/.test(this.dni)) errors.push('El DNI debe tener 8 dígitos.');
        if (this.fullName.trim().length < 3) errors.push('Ingresa los nombres y apellidos del socio.');
        if (this.phone && !/^9\d{8}$/.test(this.phone.replace(/\s/g, ''))) errors.push('El celular debe tener 9 dígitos y empezar con 9.');
        if (!(this.creditLimit >= CreditPolicy.MIN_AMOUNT && this.creditLimit <= CreditPolicy.MAX_AMOUNT)) errors.push('El límite debe estar entre S/ 400.00 y S/ 1,000.00.');
        if (this.id !== null && this.creditLimit < this.debt) errors.push(`El límite no puede ser menor que la deuda actual del socio (S/ ${this.debt.toFixed(2)}).`);
        if (!(Number.isInteger(this.maxInstallments) && this.maxInstallments >= 1 && this.maxInstallments <= CreditPolicy.MAX_INSTALLMENTS)) errors.push('Las cuotas máximas deben estar entre 1 y 8.');
        return errors;
    }
}

/** Business lines offered when a business signs up. */
export const businessLines = Object.freeze(['Gimnasio', 'Bodega', 'Minimarket', 'Restaurante', 'Ferretería', 'Librería', 'Farmacia', 'Otro']);

/**
 * Entity: the business that grants the credits (NEGOCIO).
 */
export class Business {
    /**
     * @param {Object} props
     * @param {number|null} props.id
     * @param {string} props.ruc - 11 digits.
     * @param {string} props.name - Commercial name.
     * @param {string} props.line - Business line (giro).
     * @param {string} props.address
     * @param {string} [props.registeredAt]
     */
    constructor({id = null, ruc = '', name = '', line = '', address = '', registeredAt = ''}) {
        this.id = id;
        this.ruc = ruc;
        this.name = name;
        this.line = line;
        this.address = address;
        this.registeredAt = registeredAt;
    }

    /**
     * Validations of RegistrarNegocio (module 7.2) for the business and its account.
     *
     * @param {{responsible: string, email: string, password: string, confirmation: string}} account
     * @returns {string[]}
     */
    validateSignUp(account) {
        const errors = [];
        if (!/^\d{11}$/.test(this.ruc)) errors.push('El RUC debe tener 11 dígitos.');
        if (this.name.trim().length < 2) errors.push('Ingresa el nombre comercial.');
        if (!this.line) errors.push('Selecciona el giro del negocio.');
        if (this.address.trim().length < 5) errors.push('Ingresa la dirección del negocio.');
        if (account.responsible.trim().length < 3) errors.push('Ingresa el nombre del responsable.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)) errors.push('Ingresa un correo electrónico válido.');
        if (account.password.length < 8 || account.password !== account.confirmation) errors.push('La contraseña debe tener 8 caracteres y coincidir.');
        return errors;
    }
}

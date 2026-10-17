import {SaleMode} from '@/catalog/domain/model/sale-mode.js';

/** Units of measure offered in the product form. */
export const productUnits = Object.freeze(['Unidad', 'Botella', 'Lata', 'Frasco', 'Bolsa', 'Barra', 'Pote', 'Kit', 'Servicio', 'Mes']);

/**
 * Entity: a product or service of the business (PRODUCTO).
 */
export class Product {
    /**
     * @param {Object} props
     * @param {number|null} props.id
     * @param {number} props.businessId
     * @param {string} props.description
     * @param {string} props.brand
     * @param {string} [props.supplier]
     * @param {string} props.unit
     * @param {string} [props.imageUrl]
     * @param {number} props.cashPrice
     * @param {number} props.listPrice - Credit price (≥ cash price).
     * @param {string} [props.saleMode='AMBAS']
     * @param {string} [props.status='ACTIVO']
     */
    constructor({id = null, businessId, description = '', brand = '', supplier = '', unit = 'Unidad', imageUrl = '',
                    cashPrice = 0, listPrice = 0, saleMode = SaleMode.BOTH, status = 'ACTIVO'}) {
        this.id = id;
        this.businessId = businessId;
        this.description = description;
        this.brand = brand;
        this.supplier = supplier;
        this.unit = unit;
        this.imageUrl = imageUrl;
        this.cashPrice = cashPrice;
        this.listPrice = listPrice;
        this.saleMode = saleMode;
        this.status = status;
    }

    /** @returns {boolean} */
    get isActive() {
        return this.status === 'ACTIVO';
    }

    /** @returns {string} Name shown in selects, e.g. "X-B · Bebida energizante sabor Piña (Botella)". */
    get displayName() {
        return `${this.brand} · ${this.description} (${this.unit})`;
    }

    /**
     * Validations of GuardarProducto (module 7.5).
     *
     * @returns {string[]}
     */
    validate() {
        const errors = [];
        if (this.description.trim().length < 2) errors.push('Ingresa la descripción del producto.');
        if (this.brand.trim().length < 1) errors.push('Ingresa la marca.');
        if (!(this.cashPrice > 0)) errors.push('El precio contado debe ser mayor que cero.');
        if (!(this.listPrice >= this.cashPrice)) errors.push('El precio de lista debe ser mayor o igual al precio contado.');
        return errors;
    }
}

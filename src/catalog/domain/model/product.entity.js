import {SaleMode} from '@/catalog/domain/model/sale-mode.js';
import {CreditPolicy} from '@/credit/domain/model/credit-policy.js';

/** Units of measure offered in the product form. */
/** Las bebidas baratas se venden por paquete (no sueltas); los suplementos por pote o bolsa. El campo también acepta texto libre. */
export const productUnits = Object.freeze(['Unidad', 'Pote', 'Bolsa', 'Paquete x6', 'Paquete x12', 'Paquete x15', 'Pack x4', 'Pack x6',
    'Pack x12', 'Caja x10', 'Caja x12', 'Kit', 'Servicio', 'Mes']);

/** Kind of catalog item: a single product or a combo of products with a fixed price (S/ 100, 200 or 400). */
export const ProductType = Object.freeze({PRODUCT: 'PRODUCTO', COMBO: 'COMBO'});

/**
 * Entity: a product or service of the business (PRODUCTO), or a COMBO of products.
 *
 * @remarks
 * A combo has a fixed list price of S/ 100, 200 or 400 and is sold like a product (price × quantity), so cheap drinks
 * reach the minimum purchase of S/ 400 without typing hundreds of units.
 */
export class Product {
    /**
     * @param {Object} props
     * @param {number|null} props.id
     * @param {number} props.businessId
     * @param {string} [props.type='PRODUCTO']
     * @param {string} props.description
     * @param {string} props.brand
     * @param {string} [props.supplier]
     * @param {string} props.unit
     * @param {string} [props.imageUrl]
     * @param {number} props.cashPrice
     * @param {number} props.listPrice - Credit price (≥ cash price). For a combo: 100, 200 or 400.
     * @param {string} [props.saleMode='AMBAS']
     * @param {string} [props.status='ACTIVO']
     * @param {Array<{productId: number, productName?: string, quantity: number, listPrice?: number, subtotal?: number}>} [props.items]
     * @param {number|null} [props.contentValue] - Value of the combo contents at list price (from the backend).
     */
    constructor({id = null, businessId, type = ProductType.PRODUCT, description = '', brand = '', supplier = '', unit = 'Unidad',
                    imageUrl = '', cashPrice = 0, listPrice = 0, saleMode = SaleMode.BOTH, status = 'ACTIVO', items = [], contentValue = null}) {
        this.id = id;
        this.businessId = businessId;
        this.type = type;
        this.description = description;
        this.brand = brand;
        this.supplier = supplier;
        this.unit = unit;
        this.imageUrl = imageUrl;
        this.cashPrice = cashPrice;
        this.listPrice = listPrice;
        this.saleMode = saleMode;
        this.status = status;
        this.items = items;
        this.contentValue = contentValue;
    }

    /** @returns {boolean} */
    get isActive() {
        return this.status === 'ACTIVO';
    }

    /** @returns {boolean} */
    get isCombo() {
        return this.type === ProductType.COMBO;
    }

    /** @returns {string} Name shown in selects, e.g. "Optimum Nutrition · Creatina monohidratada micronizada 600 g (Pote)" or "Combo Hidratación … (Combo)". */
    get displayName() {
        return this.isCombo ? `${this.description} (Combo)` : `${this.brand} · ${this.description} (${this.unit})`;
    }

    /** @returns {number} Minimum quantity so that list price × quantity reaches the minimum purchase (S/ 400). */
    get minimumQuantity() {
        return this.listPrice > 0 ? Math.ceil(CreditPolicy.MIN_AMOUNT / this.listPrice) : 1;
    }

    /**
     * Validations of GuardarProducto (module 7.5) and of a combo.
     *
     * @returns {string[]}
     */
    validate() {
        const errors = [];
        if (this.description.trim().length < 2) errors.push('Ingresa la descripción del producto.');
        if (this.brand.trim().length < 1) errors.push('Ingresa la marca.');
        if (this.isCombo) {
            if (!CreditPolicy.COMBO_PRICES.includes(Number(this.listPrice))) errors.push('El precio de un combo debe ser S/ 100, S/ 200 o S/ 400.');
            if (!this.items.length) errors.push('Agrega al menos un producto al combo.');
            if (this.items.some(item => !item.productId || !(item.quantity >= 1))) errors.push('Cada producto del combo necesita una cantidad de 1 o más.');
            if (new Set(this.items.map(item => item.productId)).size !== this.items.length) errors.push('Un producto no puede repetirse en el combo; sube su cantidad.');
        } else {
            if (!(this.cashPrice > 0)) errors.push('El precio contado debe ser mayor que cero.');
            if (!(this.listPrice >= this.cashPrice)) errors.push('El precio de lista debe ser mayor o igual al precio contado.');
        }
        return errors;
    }
}

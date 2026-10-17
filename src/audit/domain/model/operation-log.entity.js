/** Actions recorded in BITACORA. */
export const operationActions = Object.freeze(['LOGIN', 'LOGIN_FALLIDO', 'LOGOUT', 'REGISTRAR', 'EDITAR', 'DAR_DE_BAJA', 'VENDER', 'PAGAR', 'CONSULTAR']);

/**
 * Entity: one record of the operations log (BITACORA).
 */
export class OperationLog {
    /**
     * @param {Object} props
     * @param {number|null} props.id
     * @param {number|null} props.businessId
     * @param {number|null} props.userId - Null when the login failed.
     * @param {string} props.userName
     * @param {string} props.occurredAt - ISO date-time.
     * @param {string} props.action
     * @param {string} props.entity - SOCIO, PRODUCTO, VENTA, PAGO, USUARIO...
     * @param {number|null} props.recordId
     * @param {string} props.detail
     * @param {string} [props.ip]
     */
    constructor({id = null, businessId = null, userId = null, userName = '', occurredAt, action, entity, recordId = null, detail = '', ip = 'localhost'}) {
        this.id = id;
        this.businessId = businessId;
        this.userId = userId;
        this.userName = userName;
        this.occurredAt = occurredAt;
        this.action = action;
        this.entity = entity;
        this.recordId = recordId;
        this.detail = detail;
        this.ip = ip;
    }
}

import {OperationLog} from '@/audit/domain/model/operation-log.entity.js';

/**
 * Converts BITACORA resources into OperationLog entities and back.
 */
export const OperationLogAssembler = {
    /** @param {Object} r @returns {OperationLog} */
    toEntity(r) {
        return new OperationLog({
            id: r.id, businessId: r.idNegocio, userId: r.idUsuario, userName: r.usuario, occurredAt: r.fechaHora, action: r.accion,
            entity: r.entidad, recordId: r.idRegistro, detail: r.detalle, ip: r.ip
        });
    },

    /** @param {OperationLog} o @returns {Object} */
    toResource(o) {
        return {
            idNegocio: o.businessId, idUsuario: o.userId, usuario: o.userName, fechaHora: o.occurredAt, accion: o.action, entidad: o.entity,
            idRegistro: o.recordId, detalle: o.detail, ip: o.ip
        };
    }
};

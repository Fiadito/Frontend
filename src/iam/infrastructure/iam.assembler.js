import {User} from '@/iam/domain/model/user.entity.js';
import {Business} from '@/iam/domain/model/business.entity.js';

/**
 * Converts IAM resources (Spanish names of the API/DB) into entities and back.
 */
export const IamAssembler = {
    /** @param {Object} resource @param {string} [businessName] @returns {User} */
    toUser(resource, businessName = '') {
        return new User({
            id: resource.id, businessId: resource.idNegocio, memberId: resource.idSocio ?? null, name: resource.nombre,
            email: resource.correo, role: resource.rol, businessName: resource.nombreNegocio ?? businessName
        });
    },

    /** @param {User} user @returns {Object} Session payload (no password hash). */
    toSession(user) {
        return {id: user.id, idNegocio: user.businessId, idSocio: user.memberId, nombre: user.name, correo: user.email, rol: user.role, nombreNegocio: user.businessName};
    },

    /** @param {Object} resource @returns {Business} */
    toBusiness(resource) {
        return new Business({id: resource.id, ruc: resource.ruc, name: resource.nombreComercial, line: resource.giro, address: resource.direccion, registeredAt: resource.fechaRegistro});
    },

    /** @param {Business} business @returns {Object} */
    toBusinessResource(business) {
        return {ruc: business.ruc, nombreComercial: business.name.trim(), giro: business.line, direccion: business.address.trim(), fechaRegistro: business.registeredAt};
    }
};

import {User} from '@/iam/domain/model/user.entity.js';

/**
 * Converts IAM resources (Spanish names of the API) into entities and back.
 */
export const IamAssembler = {
    /** @param {Object} resource - usuario of POST /auth/login. @returns {User} */
    toUser(resource) {
        return new User({
            id: resource.id, businessId: resource.idNegocio, memberId: resource.idSocio ?? null, name: resource.nombre,
            email: resource.correo, role: resource.rol, businessName: resource.nombreNegocio ?? ''
        });
    },

    /**
     * @param {import('@/iam/domain/model/business.entity.js').Business} business
     * @param {{responsible: string, email: string, password: string, confirmation: string}} account
     * @returns {Object} Body of POST /auth/registro-negocio.
     */
    toSignUpResource(business, account) {
        return {
            ruc: business.ruc, nombreComercial: business.name.trim(), giro: business.line, direccion: business.address.trim(),
            responsable: account.responsible.trim(), correo: account.email.trim().toLowerCase(), clave: account.password,
            confirmacion: account.confirmation
        };
    }
};

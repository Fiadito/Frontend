import {Member} from '@/membership/domain/model/member.entity.js';

/**
 * Converts SOCIO resources into Member entities and back.
 */
export const MemberAssembler = {
    /** @param {Object} r @returns {Member} */
    toEntity(r) {
        return new Member({
            id: r.id, businessId: r.idNegocio, dni: r.dni, fullName: r.nombres, phone: r.celular ?? '', address: r.direccion ?? '',
            currency: r.moneda, lateRatePeriod: r.periodoTasaMora, lateRateValue: Number(r.valorTasaMora), creditLimit: Number(r.limiteCredito),
            maxInstallments: Number(r.maxCuotas), status: r.estado, email: r.correo ?? '', debt: Number(r.deuda ?? 0),
            availableCredit: r.disponible === undefined || r.disponible === null ? null : Number(r.disponible), overdue: Boolean(r.conMora)
        });
    },

    /** @param {import('axios').AxiosResponse} response @returns {Member[]} */
    toEntities(response) {
        return (response.data ?? []).map(resource => this.toEntity(resource));
    },

    /**
     * @param {Member} member
     * @param {{email: string, password: string}|null} [access] - Access of a new member.
     * @returns {Object} Body of POST / PUT /socios.
     */
    toResource(member, access = null) {
        return {
            dni: member.dni, nombres: member.fullName.trim(), celular: member.phone.replace(/\s/g, ''), direccion: member.address.trim(),
            moneda: member.currency, periodoTasaMora: member.lateRatePeriod, valorTasaMora: member.lateRateValue,
            limiteCredito: member.creditLimit, maxCuotas: member.maxInstallments,
            correo: access?.email ? access.email.trim().toLowerCase() : null, clave: access?.email ? access.password : null
        };
    }
};

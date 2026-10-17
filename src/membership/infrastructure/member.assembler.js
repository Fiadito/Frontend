import {Member} from '@/membership/domain/model/member.entity.js';

/**
 * Converts SOCIO resources into Member entities and back.
 */
export const MemberAssembler = {
    /** @param {Object} resource @returns {Member} */
    toEntity(resource) {
        return new Member({
            id: resource.id, businessId: resource.idNegocio, dni: resource.dni, fullName: resource.nombres, phone: resource.celular ?? '',
            address: resource.direccion ?? '', currency: resource.moneda, lateRatePeriod: resource.periodoTasaMora,
            lateRateValue: Number(resource.valorTasaMora), creditLimit: Number(resource.limiteCredito), maxInstallments: Number(resource.maxCuotas),
            status: resource.estado
        });
    },

    /** @param {import('axios').AxiosResponse} response @returns {Member[]} */
    toEntities(response) {
        return (response.data ?? []).map(resource => this.toEntity(resource));
    },

    /** @param {Member} member @returns {Object} */
    toResource(member) {
        return {
            idNegocio: member.businessId, dni: member.dni, nombres: member.fullName.trim(), celular: member.phone.replace(/\s/g, ''),
            direccion: member.address.trim(), moneda: member.currency, periodoTasaMora: member.lateRatePeriod, valorTasaMora: member.lateRateValue,
            limiteCredito: member.creditLimit, maxCuotas: member.maxInstallments, estado: member.status
        };
    }
};

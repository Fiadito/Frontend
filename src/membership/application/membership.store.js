import {reactive} from 'vue';
import {MemberApi} from '@/membership/infrastructure/member-api.js';
import {MemberAssembler} from '@/membership/infrastructure/member.assembler.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {domainEventBus, DomainEvents} from '@/shared/application/domain-event-bus.js';

const memberApi = new MemberApi();

/**
 * Application service of the Membership context: members and their credit conditions (module 7.4).
 */
export const membershipStore = reactive({
    /** @type {import('@/membership/domain/model/member.entity.js').Member[]} */
    members: [],
    loading: false,

    /**
     * @param {number} businessId
     * @returns {Promise<void>}
     */
    async load(businessId) {
        this.loading = true;
        try {
            this.members = MemberAssembler.toEntities(await memberApi.getByBusiness(businessId));
        } finally {
            this.loading = false;
        }
    },

    /**
     * Loads a single member (used by the member's own account statement).
     *
     * @param {number} id
     * @returns {Promise<import('@/membership/domain/model/member.entity.js').Member>}
     */
    async loadOne(id) {
        const member = MemberAssembler.toEntity((await memberApi.getById(id)).data);
        this.members = [member];
        return member;
    },

    /**
     * @param {number} id
     * @returns {import('@/membership/domain/model/member.entity.js').Member|undefined}
     */
    findById(id) {
        return this.members.find(member => member.id === Number(id));
    },

    /**
     * GuardarSocio: registers (with his access account) or edits a member.
     *
     * @param {import('@/membership/domain/model/member.entity.js').Member} member
     * @param {{email: string, password: string}|null} access - Access of a new member (optional).
     * @returns {Promise<void>}
     */
    async save(member, access = null) {
        const errors = member.validate();
        if (errors.length) throw errors[0];
        const duplicated = this.members.some(item => item.dni === member.dni && item.id !== member.id);
        if (duplicated) throw 'Ya existe un socio con ese DNI.';
        const isNew = member.id === null;
        if (isNew && access?.email) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(access.email)) throw 'Ingresa un correo electrónico válido.';
            if ((access.password ?? '').length < 8) throw 'La contraseña inicial debe tener al menos 8 caracteres.';
            if (await iamStore.emailExists(access.email)) throw 'Ya existe una cuenta con ese correo.';
        }
        const resource = MemberAssembler.toResource(member);
        if (isNew) {
            const response = await memberApi.create(resource);
            const saved = MemberAssembler.toEntity(response.data);
            if (access?.email) {
                await iamStore.createMemberAccount({businessId: saved.businessId, memberId: saved.id, name: saved.fullName, email: access.email, password: access.password});
            }
            this.members.push(saved);
            domainEventBus.publish(DomainEvents.MEMBER_REGISTERED, iamStore.auditContext({recordId: saved.id, detail: `Registro del socio ${saved.fullName} (DNI ${saved.dni})`}));
        } else {
            const response = await memberApi.update(member.id, resource);
            const saved = MemberAssembler.toEntity(response.data);
            this.members.splice(this.members.findIndex(item => item.id === saved.id), 1, saved);
            domainEventBus.publish(DomainEvents.MEMBER_EDITED, iamStore.auditContext({recordId: saved.id, detail: `Edición del socio ${saved.fullName}`}));
        }
    },

    /**
     * DarDeBajaSocio / reactivate.
     *
     * @param {import('@/membership/domain/model/member.entity.js').Member} member
     * @param {number} capitalDebt - Pending debt of the member.
     * @returns {Promise<void>}
     */
    async toggleStatus(member, capitalDebt) {
        const status = member.isActive ? 'INACTIVO' : 'ACTIVO';
        if (status === 'INACTIVO' && capitalDebt > 0) throw 'No se puede dar de baja a un socio con deuda.';
        await memberApi.patch(member.id, {estado: status});
        member.status = status;
        domainEventBus.publish(DomainEvents.MEMBER_STATUS_CHANGED, iamStore.auditContext({
            recordId: member.id, detail: `${status === 'INACTIVO' ? 'Baja' : 'Reactivación'} del socio ${member.fullName}`
        }));
    }
});

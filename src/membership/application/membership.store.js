import {reactive} from 'vue';
import {MemberApi} from '@/membership/infrastructure/member-api.js';
import {MemberAssembler} from '@/membership/infrastructure/member.assembler.js';

const memberApi = new MemberApi();

/**
 * Application service of the Membership context: members and their credit conditions (module 7.4).
 *
 * @remarks
 * The backend validates again (DNI, rate ≥ 40 %, limit S/ 400–1,000, 1–8 installments), creates the
 * member account in the same transaction and records the operation in BITACORA.
 */
export const membershipStore = reactive({
    /** @type {import('@/membership/domain/model/member.entity.js').Member[]} */
    members: [],
    loading: false,

    /** @returns {Promise<void>} */
    async load() {
        this.loading = true;
        try {
            this.members = MemberAssembler.toEntities(await memberApi.getAll());
        } finally {
            this.loading = false;
        }
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
        const isNew = member.id === null;
        if (isNew && access?.email && (access.password ?? '').length < 8) throw 'La contraseña inicial debe tener al menos 8 caracteres.';
        const response = isNew
            ? await memberApi.create(MemberAssembler.toResource(member, access))
            : await memberApi.update(member.id, MemberAssembler.toResource(member));
        const saved = MemberAssembler.toEntity(response.data);
        if (isNew) this.members.push(saved);
        else this.members.splice(this.members.findIndex(item => item.id === saved.id), 1, saved);
    },

    /**
     * DarDeBajaSocio / reactivate (the backend rejects it if the member has debt).
     *
     * @param {import('@/membership/domain/model/member.entity.js').Member} member
     * @returns {Promise<void>}
     */
    async toggleStatus(member) {
        const response = await memberApi.changeStatus(member.id, member.isActive ? 'INACTIVO' : 'ACTIVO');
        const saved = MemberAssembler.toEntity(response.data);
        this.members.splice(this.members.findIndex(item => item.id === saved.id), 1, saved);
    }
});

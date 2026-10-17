import {reactive} from 'vue';
import {IamApi} from '@/iam/infrastructure/iam-api.js';
import {IamAssembler} from '@/iam/infrastructure/iam.assembler.js';
import {sessionStorageService} from '@/iam/infrastructure/session-storage.js';
import {hashPassword} from '@/shared/infrastructure/password-hasher.js';
import {UserRole} from '@/iam/domain/model/user-role.js';
import {domainEventBus, DomainEvents} from '@/shared/application/domain-event-bus.js';

const iamApi = new IamApi();

/**
 * Application service of the IAM context: sign-in, sign-out and business sign-up (modules 7.1, 7.2).
 */
export const iamStore = reactive({
    /** @type {import('@/iam/domain/model/user.entity.js').User|null} */
    currentUser: null,

    /** Restores the session saved in the browser, if any. */
    restoreSession() {
        const session = sessionStorageService.load();
        if (!session) return;
        try {
            this.currentUser = IamAssembler.toUser(session);
        } catch (error) {
            sessionStorageService.clear();
        }
    },

    /**
     * Payload that every audited event carries.
     *
     * @param {Object} [extra] - recordId and detail.
     * @returns {Object}
     */
    auditContext(extra = {}) {
        const user = this.currentUser;
        return {businessId: user?.businessId ?? null, userId: user?.id ?? null, userName: user?.name ?? '', ...extra};
    },

    /**
     * IniciarSesion(correo, contraseña).
     *
     * @param {string} email
     * @param {string} password
     * @returns {Promise<import('@/iam/domain/model/user.entity.js').User>}
     */
    async signIn(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const response = await iamApi.getUsersByEmail(normalizedEmail);
        const resource = response.data[0];
        const hash = await hashPassword(password);
        if (!resource || resource.claveHash !== hash) {
            domainEventBus.publish(DomainEvents.SIGN_IN_FAILED, {
                businessId: resource?.idNegocio ?? null, userId: null, userName: normalizedEmail, detail: `Intento fallido con ${normalizedEmail}`
            });
            throw 'Correo o contraseña incorrectos.';
        }
        const businessResponse = await iamApi.getBusinessById(resource.idNegocio);
        const user = IamAssembler.toUser(resource, businessResponse.data.nombreComercial);
        this.currentUser = user;
        sessionStorageService.save(IamAssembler.toSession(user));
        domainEventBus.publish(DomainEvents.SIGNED_IN, this.auditContext({recordId: user.id, detail: `Inicio de sesión (${user.role})`}));
        return user;
    },

    /** CerrarSesion: removes the session and records LOGOUT. */
    signOut() {
        if (this.currentUser) domainEventBus.publish(DomainEvents.SIGNED_OUT, this.auditContext({recordId: this.currentUser.id, detail: 'Cierre de sesión'}));
        this.currentUser = null;
        sessionStorageService.clear();
    },

    /**
     * RegistrarNegocio: creates the business and its NEGOCIO account.
     *
     * @param {import('@/iam/domain/model/business.entity.js').Business} business
     * @param {{responsible: string, email: string, password: string, confirmation: string}} account
     * @returns {Promise<void>}
     */
    async registerBusiness(business, account) {
        const errors = business.validateSignUp(account);
        if (errors.length) throw errors[0];
        const email = account.email.trim().toLowerCase();
        if ((await iamApi.getUsersByEmail(email)).data.length) throw 'Ya existe una cuenta con ese correo.';
        if ((await iamApi.getBusinessesByRuc(business.ruc)).data.length) throw 'Ya existe un negocio registrado con ese RUC.';
        business.registeredAt = new Date().toISOString();
        const businessResponse = await iamApi.createBusiness(IamAssembler.toBusinessResource(business));
        const userResponse = await iamApi.createUser({
            idNegocio: businessResponse.data.id, idSocio: null, nombre: account.responsible.trim(), correo: email,
            claveHash: await hashPassword(account.password), rol: UserRole.BUSINESS
        });
        domainEventBus.publish(DomainEvents.BUSINESS_REGISTERED, {
            businessId: businessResponse.data.id, userId: userResponse.data.id, userName: account.responsible.trim(),
            recordId: businessResponse.data.id, detail: `Registro del negocio ${business.name} (RUC ${business.ruc})`
        });
    },

    /**
     * Creates the SOCIO account of a member (called by the Membership context).
     *
     * @param {{businessId: number, memberId: number, name: string, email: string, password: string}} account
     * @returns {Promise<void>}
     */
    async createMemberAccount({businessId, memberId, name, email, password}) {
        await iamApi.createUser({
            idNegocio: businessId, idSocio: memberId, nombre: name, correo: email.trim().toLowerCase(),
            claveHash: await hashPassword(password), rol: UserRole.MEMBER
        });
    },

    /**
     * @param {string} email
     * @returns {Promise<boolean>} True when the email is already used.
     */
    async emailExists(email) {
        return (await iamApi.getUsersByEmail(email.trim().toLowerCase())).data.length > 0;
    },

    /**
     * @param {number} memberId
     * @returns {Promise<string>} Email of the member account ('' if none).
     */
    async memberEmail(memberId) {
        return (await iamApi.getUsersByMemberId(memberId)).data[0]?.correo ?? '';
    }
});

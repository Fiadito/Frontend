import {reactive} from 'vue';
import {IamApi} from '@/iam/infrastructure/iam-api.js';
import {IamAssembler} from '@/iam/infrastructure/iam.assembler.js';
import {sessionStorageService} from '@/iam/infrastructure/session-storage.js';

const iamApi = new IamApi();

/**
 * Application service of the IAM context: sign-in with JWT, sign-out and business sign-up (modules 7.1, 7.2).
 *
 * @remarks
 * The backend validates the password with BCrypt, returns a JWT (8 hours) and records LOGIN,
 * LOGIN_FALLIDO and LOGOUT in BITACORA.
 */
export const iamStore = reactive({
    /** @type {import('@/iam/domain/model/user.entity.js').User|null} */
    currentUser: null,

    /** Restores the session saved in the browser, if any. */
    restoreSession() {
        const session = sessionStorageService.load();
        if (!session?.token || !session?.usuario) return;
        try {
            this.currentUser = IamAssembler.toUser(session.usuario);
        } catch (error) {
            sessionStorageService.clear();
        }
    },

    /**
     * IniciarSesion(correo, contraseña).
     *
     * @param {string} email
     * @param {string} password
     * @returns {Promise<import('@/iam/domain/model/user.entity.js').User>}
     */
    async signIn(email, password) {
        const response = await iamApi.signIn({correo: email.trim().toLowerCase(), clave: password});
        sessionStorageService.save(response.data);
        this.currentUser = IamAssembler.toUser(response.data.usuario);
        return this.currentUser;
    },

    /** CerrarSesion: records LOGOUT in the backend and removes the token. */
    async signOut() {
        if (this.currentUser) await iamApi.signOut().catch(() => undefined);
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
        await iamApi.registerBusiness(IamAssembler.toSignUpResource(business, account));
    }
});

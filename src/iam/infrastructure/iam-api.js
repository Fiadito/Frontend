import {BaseApi} from '@/shared/infrastructure/base-api.js';
import {BaseEndpoint} from '@/shared/infrastructure/base-endpoint.js';

const businessesPath = import.meta.env.VITE_BUSINESSES_ENDPOINT_PATH;
const usersPath = import.meta.env.VITE_USERS_ENDPOINT_PATH;

/**
 * RESTful client of the IAM context (negocios and usuarios).
 *
 * @remarks
 * With the Fake API, sign-in reads the user by email and the password hash is compared in the
 * browser. With the backend, signIn() becomes POST /auth/login (returns a JWT) and
 * registerBusiness() becomes POST /auth/registro-negocio.
 */
export class IamApi extends BaseApi {
    #businesses;
    #users;

    constructor() {
        super();
        this.#businesses = new BaseEndpoint(this, businessesPath);
        this.#users = new BaseEndpoint(this, usersPath);
    }

    /** @param {string} email @returns {Promise<import('axios').AxiosResponse>} */
    getUsersByEmail(email) {
        return this.#users.getAll({correo: email});
    }

    /** @param {number} memberId @returns {Promise<import('axios').AxiosResponse>} */
    getUsersByMemberId(memberId) {
        return this.#users.getAll({idSocio: memberId});
    }

    /** @param {Object} resource @returns {Promise<import('axios').AxiosResponse>} */
    createUser(resource) {
        return this.#users.create(resource);
    }

    /** @param {number} id @param {Object} changes @returns {Promise<import('axios').AxiosResponse>} */
    patchUser(id, changes) {
        return this.#users.patch(id, changes);
    }

    /** @param {number} id @returns {Promise<import('axios').AxiosResponse>} */
    getBusinessById(id) {
        return this.#businesses.getById(id);
    }

    /** @param {string} ruc @returns {Promise<import('axios').AxiosResponse>} */
    getBusinessesByRuc(ruc) {
        return this.#businesses.getAll({ruc});
    }

    /** @param {Object} resource @returns {Promise<import('axios').AxiosResponse>} */
    createBusiness(resource) {
        return this.#businesses.create(resource);
    }
}

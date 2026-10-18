import {BaseApi} from '@/shared/infrastructure/base-api.js';

/**
 * RESTful client of the IAM context (POST /auth/login, /auth/registro-negocio, /auth/logout).
 */
export class IamApi extends BaseApi {

    /**
     * @param {{correo: string, clave: string}} credentials
     * @returns {Promise<import('axios').AxiosResponse>} {token, usuario}
     */
    signIn(credentials) {
        return this.http.post('/auth/login', credentials);
    }

    /**
     * @param {Object} resource - RUC, nombre comercial, giro, dirección, responsable, correo, clave y confirmación.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    registerBusiness(resource) {
        return this.http.post('/auth/registro-negocio', resource);
    }

    /** @returns {Promise<import('axios').AxiosResponse>} */
    signOut() {
        return this.http.post('/auth/logout');
    }
}

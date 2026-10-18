import {BaseApi} from '@/shared/infrastructure/base-api.js';
import {BaseEndpoint} from '@/shared/infrastructure/base-endpoint.js';

/**
 * RESTful client of the Membership context (/socios).
 */
export class MemberApi extends BaseApi {
    #members;

    constructor() {
        super();
        this.#members = new BaseEndpoint(this, '/socios');
    }

    /** @returns {Promise<import('axios').AxiosResponse>} Members of the business with debt, available credit and late status. */
    getAll() {
        return this.#members.getAll();
    }

    /** @param {number} id */
    getById(id) {
        return this.#members.getById(id);
    }

    /** @param {Object} resource - Includes correo and clave to create the member account. */
    create(resource) {
        return this.#members.create(resource);
    }

    /** @param {number} id @param {Object} resource */
    update(id, resource) {
        return this.#members.update(id, resource);
    }

    /** @param {number} id @param {string} status - ACTIVO or INACTIVO. */
    changeStatus(id, status) {
        return this.http.patch(`/socios/${id}/estado`, {estado: status});
    }
}

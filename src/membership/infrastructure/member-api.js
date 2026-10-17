import {BaseApi} from '@/shared/infrastructure/base-api.js';
import {BaseEndpoint} from '@/shared/infrastructure/base-endpoint.js';

const membersPath = import.meta.env.VITE_MEMBERS_ENDPOINT_PATH;

/**
 * RESTful client of the Membership context (/socios).
 */
export class MemberApi extends BaseApi {
    #members;

    constructor() {
        super();
        this.#members = new BaseEndpoint(this, membersPath);
    }

    /** @param {number} businessId */
    getByBusiness(businessId) {
        return this.#members.getAll({idNegocio: businessId});
    }

    /** @param {number} id */
    getById(id) {
        return this.#members.getById(id);
    }

    /** @param {Object} resource */
    create(resource) {
        return this.#members.create(resource);
    }

    /** @param {number} id @param {Object} resource */
    update(id, resource) {
        return this.#members.update(id, resource);
    }

    /** @param {number} id @param {Object} changes */
    patch(id, changes) {
        return this.#members.patch(id, changes);
    }
}

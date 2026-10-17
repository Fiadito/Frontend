/**
 * Generic RESTful endpoint that exposes CRUD operations over a resource path.
 *
 * @remarks
 * Implements the Template Method idea used by every context API: the base API provides
 * the HTTP client and each endpoint only defines its path (e.g. "/sales").
 */
export class BaseEndpoint {
    /** @type {import('./base-api.js').BaseApi} */
    #api;
    /** @type {string} */
    #path;

    /**
     * Creates a new BaseEndpoint.
     *
     * @param {import('./base-api.js').BaseApi} api - The API that owns the HTTP client.
     * @param {string} path - The resource path, e.g. "/sales".
     */
    constructor(api, path) {
        this.#api = api;
        this.#path = path;
    }

    /**
     * Retrieves all resources, optionally filtered by query parameters.
     *
     * @param {Object} [params] - Query parameters.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getAll(params = {}) {
        return this.#api.http.get(this.#path, {params});
    }

    /**
     * Retrieves a resource by its identifier.
     *
     * @param {number|string} id - The resource identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getById(id) {
        return this.#api.http.get(`${this.#path}/${id}`);
    }

    /**
     * Creates a resource.
     *
     * @param {Object} resource - The request body.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    create(resource) {
        return this.#api.http.post(this.#path, resource);
    }

    /**
     * Replaces a resource.
     *
     * @param {number|string} id - The resource identifier.
     * @param {Object} resource - The request body.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    update(id, resource) {
        return this.#api.http.put(`${this.#path}/${id}`, resource);
    }

    /**
     * Partially updates a resource.
     *
     * @param {number|string} id - The resource identifier.
     * @param {Object} changes - The fields to change.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    patch(id, changes) {
        return this.#api.http.patch(`${this.#path}/${id}`, changes);
    }

    /**
     * Deletes a resource.
     *
     * @param {number|string} id - The resource identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    delete(id) {
        return this.#api.http.delete(`${this.#path}/${id}`);
    }
}

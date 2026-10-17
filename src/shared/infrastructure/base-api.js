import axios from 'axios';
import {errorInterceptor} from '@/shared/infrastructure/error.interceptor.js';

const fiaditoApiUrl = import.meta.env.VITE_FIADITO_API_URL;

/**
 * Base class for the RESTful API clients of each bounded context.
 *
 * @remarks
 * Owns a pre-configured Axios instance pointing to the Fiadito API (Fake API for now),
 * with the shared error interceptor applied. Context APIs extend it and expose their endpoints.
 * When the database is connected only the base URL changes.
 */
export class BaseApi {
    /** @type {import('axios').AxiosInstance} */
    #http;

    /**
     * Creates a new BaseApi instance.
     */
    constructor() {
        this.#http = axios.create({
            baseURL: fiaditoApiUrl,
            headers: {'Content-Type': 'application/json'}
        });
        this.#http.interceptors.response.use(errorInterceptor.onResponse, errorInterceptor.onError);
    }

    /**
     * The configured Axios instance.
     *
     * @returns {import('axios').AxiosInstance}
     */
    get http() {
        return this.#http;
    }
}

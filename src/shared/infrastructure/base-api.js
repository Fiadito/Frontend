import axios from 'axios';
import {errorInterceptor} from '@/shared/infrastructure/error.interceptor.js';
import {sessionStorageService} from '@/iam/infrastructure/session-storage.js';

const fiaditoApiUrl = import.meta.env.VITE_FIADITO_API_URL || 'http://localhost:8080/api/v1';

/**
 * Base class for the RESTful API clients of each bounded context.
 *
 * @remarks
 * Owns a pre-configured Axios instance pointing to the Fiadito API (Spring Boot backend).
 * A request interceptor adds "Authorization: Bearer <token>" to every call (section 9 of the
 * report) and the shared error interceptor turns errors into Spanish messages.
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
        this.#http.interceptors.request.use(config => {
            const token = sessionStorageService.token();
            if (token) config.headers.Authorization = `Bearer ${token}`;
            return config;
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

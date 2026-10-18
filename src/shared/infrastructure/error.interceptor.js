import {sessionStorageService} from '@/iam/infrastructure/session-storage.js';

/**
 * Axios response interceptor that centralizes technical error handling.
 *
 * @remarks
 * The backend answers errors as {"message": "..."}; that message is shown to the user.
 * A 401 on a protected call means the token expired: the session is closed and the user goes
 * back to "Iniciar sesión". A 403 means the role cannot use that service.
 */
export const errorInterceptor = {

    /**
     * Passes JSON responses through and rejects HTML answers (the request did not reach the API).
     *
     * @param {import('axios').AxiosResponse} response - The HTTP response.
     * @returns {import('axios').AxiosResponse|Promise<never>}
     */
    onResponse: (response) => {
        if (typeof response.data === 'string' && response.data.trimStart().startsWith('<')) {
            return Promise.reject(`La petición a ${response.config?.url ?? ''} no llegó al backend. Revisa VITE_FIADITO_API_URL.`);
        }
        return response;
    },

    /**
     * Normalizes an Axios error into a message.
     *
     * @param {import('axios').AxiosError} error - The HTTP error.
     * @returns {Promise<never>} A rejected promise with the error message.
     */
    onError: (error) => {
        let message;
        if (error.response) {
            const status = error.response.status;
            console.error('Status:', status, 'URL:', error.config?.url, 'Data:', error.response.data);
            message = error.response.data?.message || `Error ${status}: ${error.response.statusText}`;
            const isLogin = String(error.config?.url ?? '').includes('/auth/login');
            if (status === 401 && !isLogin && sessionStorageService.token()) {
                sessionStorageService.clear();
                window.location.assign('/iniciar-sesion?expired=1');
            }
        } else if (error.request) {
            console.error('Request:', error.request);
            message = 'El backend de Fiadito no responde. Verifica que esté en ejecución en http://localhost:8080 (IntelliJ).';
        } else {
            console.error('Error Message:', error.message);
            message = error.message;
        }
        return Promise.reject(message);
    }
};

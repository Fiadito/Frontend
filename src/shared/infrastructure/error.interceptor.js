/**
 * Axios response interceptor that centralizes technical error handling.
 *
 * @remarks
 * Successful responses are returned untouched. Failed responses are logged and converted
 * into a single Spanish message that the Application layer (stores) shows to the user.
 */
export const errorInterceptor = {

    /**
     * Passes successful responses through.
     *
     * @param {import('axios').AxiosResponse} response - The HTTP response.
     * @returns {import('axios').AxiosResponse} The same response.
     */
    onResponse: (response) => response,

    /**
     * Normalizes an Axios error into a message.
     *
     * @param {import('axios').AxiosError} error - The HTTP error.
     * @returns {Promise<never>} A rejected promise with the error message.
     */
    onError: (error) => {
        let message;

        if (error.response) {
            console.error('Status:', error.response.status, 'Data:', error.response.data);
            message = error.response.data?.message || `Error ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
            console.error('Request:', error.request);
            message = 'El servicio de Fiadito no responde. Verifica que la Fake API esté en ejecución (npm run fake-api).';
        } else {
            console.error('Error Message:', error.message);
            message = error.message;
        }

        return Promise.reject(message);
    }
};

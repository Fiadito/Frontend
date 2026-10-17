const sessionKey = 'fiadito.session';

/**
 * Infrastructure helper that persists the signed-in user in the browser.
 *
 * @remarks
 * Storage access is wrapped in try/catch because it can be unavailable
 * (private mode, blocked site data). In that case the session only lives in memory.
 */
export const sessionStorageService = {

    /**
     * Saves the session.
     *
     * @param {Object} session - Serializable user data.
     */
    save(session) {
        try {
            localStorage.setItem(sessionKey, JSON.stringify(session));
        } catch (error) {
            console.warn('Session could not be persisted:', error);
        }
    },

    /**
     * Reads the stored session.
     *
     * @returns {Object|null} The stored session, if any.
     */
    load() {
        try {
            const value = localStorage.getItem(sessionKey);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            return null;
        }
    },

    /** Removes the stored session. */
    clear() {
        try {
            localStorage.removeItem(sessionKey);
        } catch (error) {
            console.warn('Session could not be cleared:', error);
        }
    }
};

const sessionKey = 'fiadito.session';

/**
 * Infrastructure helper that persists the session (JWT token and user) in the browser.
 *
 * @remarks
 * Storage access is wrapped in try/catch because it can be unavailable
 * (private mode, blocked site data). In that case the session only lives in memory.
 */
let memorySession = null;

export const sessionStorageService = {

    /**
     * Saves the session.
     *
     * @param {{token: string, usuario: Object}} session - Token and user returned by POST /auth/login.
     */
    save(session) {
        memorySession = session;
        try {
            localStorage.setItem(sessionKey, JSON.stringify(session));
        } catch (error) {
            console.warn('Session could not be persisted:', error);
        }
    },

    /**
     * Reads the stored session.
     *
     * @returns {{token: string, usuario: Object}|null}
     */
    load() {
        if (memorySession) return memorySession;
        try {
            const value = localStorage.getItem(sessionKey);
            memorySession = value ? JSON.parse(value) : null;
            return memorySession;
        } catch (error) {
            return null;
        }
    },

    /** @returns {string|null} The JWT of the current session. */
    token() {
        return this.load()?.token ?? null;
    },

    /** Removes the stored session. */
    clear() {
        memorySession = null;
        try {
            localStorage.removeItem(sessionKey);
        } catch (error) {
            console.warn('Session could not be cleared:', error);
        }
    }
};

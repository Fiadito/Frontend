/**
 * Hashes a password with SHA-256 (Web Crypto) so the Fake API never stores it in plain text.
 *
 * @remarks
 * Only for the Fake API stage. The Spring Boot backend will validate passwords with BCrypt
 * (section 9 of the report) and the frontend will just send them to POST /auth/login over HTTPS.
 *
 * @param {string} password - The password.
 * @returns {Promise<string>} Hexadecimal hash.
 */
export const hashPassword = async password => {
    const bytes = new TextEncoder().encode(`fiadito:${password}`);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
};

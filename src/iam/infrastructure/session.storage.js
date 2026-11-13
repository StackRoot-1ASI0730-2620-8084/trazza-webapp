/**
 * Browser storage of the IAM session: access token, rotating refresh token, the account resource and the active role.
 * The refresh token is kept in localStorage for this MVP; a production build should move it to an HttpOnly cookie.
 */
const KEYS = Object.freeze({
    accessToken: 'trazza.session.access-token',
    refreshToken: 'trazza.session.refresh-token',
    user: 'trazza.session.user',
    activeRole: 'trazza.session.active-role'
});

const listeners = new Set();

const read = key => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

const write = (key, value) => {
    try {
        if (value === null || value === undefined) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
    } catch {
        // Storage can be unavailable (private mode); the session then lives only in memory.
    }
};

export const sessionStorage = {
    /** @returns {?string} Bearer access token. */
    get accessToken() {
        return read(KEYS.accessToken);
    },

    /** @returns {?string} Refresh token. */
    get refreshToken() {
        return read(KEYS.refreshToken);
    },

    /** @returns {?Object} Account resource returned by the API. */
    get user() {
        const raw = read(KEYS.user);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    },

    /** @returns {?string} Role the user is working with (CARRIER or MERCHANT). */
    get activeRole() {
        return read(KEYS.activeRole);
    },

    set activeRole(role) {
        write(KEYS.activeRole, role);
    },

    /**
     * Saves a session resource ({ accessToken, refreshToken, user }) and notifies the listeners.
     * @param {Object} session - Authenticated session resource.
     */
    save(session) {
        write(KEYS.accessToken, session.accessToken);
        write(KEYS.refreshToken, session.refreshToken);
        write(KEYS.user, JSON.stringify(session.user));
        listeners.forEach(listener => listener(session.user));
    },

    /**
     * Replaces the stored account resource.
     * @param {Object} user - Account resource.
     */
    saveUser(user) {
        write(KEYS.user, JSON.stringify(user));
        listeners.forEach(listener => listener(user));
    },

    /** Removes every session artifact and notifies the listeners. */
    clear() {
        Object.values(KEYS).forEach(key => write(key, null));
        listeners.forEach(listener => listener(null));
    },

    /**
     * Subscribes to session changes (sign-in, refresh, sign-out).
     * @param {function(?Object): void} listener - Receives the account resource or null.
     */
    onChange(listener) {
        listeners.add(listener);
    }
};

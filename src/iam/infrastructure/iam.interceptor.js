/**
 * Key used to persist the session token in the browser storage.
 * @type {string}
 */
export const SESSION_TOKEN_KEY = 'trazza.session.token';

/**
 * Key used to persist the refresh token in the browser storage.
 * @type {string}
 */
export const SESSION_REFRESH_TOKEN_KEY = 'trazza.session.refresh-token';

/**
 * Adds the IAM bearer token to outbound requests when a session exists.
 *
 * @param {import('axios').InternalAxiosRequestConfig} config - Axios request configuration.
 * @returns {import('axios').InternalAxiosRequestConfig} Updated request configuration.
 */
export const iamInterceptor = (config) => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
};

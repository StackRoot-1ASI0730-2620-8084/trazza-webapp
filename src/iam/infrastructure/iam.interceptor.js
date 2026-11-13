import {sessionStorage} from "./session.storage.js";
import i18n from "../../i18n.js";

/**
 * Adds the bearer token and the active language to outbound requests.
 * The API answers its error messages (ProblemDetails) in that language.
 *
 * @param {import('axios').InternalAxiosRequestConfig} config - Axios request configuration.
 * @returns {import('axios').InternalAxiosRequestConfig} Updated request configuration.
 */
export const iamInterceptor = (config) => {
    const token = sessionStorage.accessToken;
    if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
    config.headers['Accept-Language'] = i18n.global.locale.value;
    return config;
};

import axios from "axios";
import {iamInterceptor} from "../../iam/infrastructure/iam.interceptor.js";
import {sessionStorage} from "../../iam/infrastructure/session.storage.js";

const platformApi = import.meta.env.VITE_TRAZZA_PLATFORM_API_URL;
const authenticationPath = import.meta.env.VITE_AUTHENTICATION_ENDPOINT_PATH ?? '/authentication';

/** Single in-flight refresh shared by every request that receives a 401. */
let refreshing = null;

/**
 * Exchanges the refresh token for a new session. The refresh token rotates on every call.
 * @returns {Promise<string>} New access token.
 */
const refreshSession = async () => {
    const refreshToken = sessionStorage.refreshToken;
    if (!refreshToken) throw new Error('errors.session-expired');
    const response = await axios.post(`${platformApi}${authenticationPath}/refresh`, { refreshToken });
    sessionStorage.save(response.data);
    return response.data.accessToken;
};

/**
 * Shared infrastructure base class that configures the HTTP client used by every bounded context.
 * A 401 answer triggers one transparent refresh of the session before giving up.
 *
 * @class BaseApi
 */
export class BaseApi {
    constructor() {
        this._http = axios.create({
            baseURL: platformApi,
            headers: { 'Content-Type': 'application/json' }
        });
        this._http.interceptors.request.use(iamInterceptor);
        this._http.interceptors.response.use(response => response, async error => {
            const request = error.config;
            const isAuthCall = request?.url?.startsWith(authenticationPath);
            if (error.response?.status !== 401 || !request || request._retried || isAuthCall || !sessionStorage.refreshToken)
                return Promise.reject(error);
            request._retried = true;
            try {
                refreshing ??= refreshSession().finally(() => { refreshing = null; });
                const token = await refreshing;
                request.headers.Authorization = `Bearer ${token}`;
                return this._http(request);
            } catch (refreshError) {
                sessionStorage.clear();
                return Promise.reject(error);
            }
        });
    }

    /** @returns {import('axios').AxiosInstance} Configured Axios HTTP client. */
    get http() {
        return this._http;
    }
}

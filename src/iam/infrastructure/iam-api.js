import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const usersEndpointPath = import.meta.env.VITE_USERS_ENDPOINT_PATH;
const authenticationEndpointPath = import.meta.env.VITE_AUTHENTICATION_ENDPOINT_PATH;
const vehiclesEndpointPath = import.meta.env.VITE_VEHICLES_ENDPOINT_PATH ?? '/vehicles';
const driversEndpointPath = import.meta.env.VITE_DRIVERS_ENDPOINT_PATH ?? '/drivers';
const savedAddressesEndpointPath = import.meta.env.VITE_SAVED_ADDRESSES_ENDPOINT_PATH ?? '/saved-addresses';

/**
 * Infrastructure gateway for the IAM endpoints.
 *
 * @class IamApi
 * @extends BaseApi
 */
export class IamApi extends BaseApi {
    /** Creates the endpoint clients of the carrier fleet and of the saved addresses. */
    constructor() {
        super();
        this.vehicles = new BaseEndpoint(this, vehiclesEndpointPath);
        this.drivers = new BaseEndpoint(this, driversEndpointPath);
        this.savedAddresses = new BaseEndpoint(this, savedAddressesEndpointPath);
    }

    /**
     * Authenticates a user against the Trazza Platform API.
     *
     * @param {import('../domain/commands/sign-in.command.js').SignInCommand} signInCommand - Sign-in command.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the session tokens and the account.
     */
    signIn(signInCommand) {
        return this.http.post(`${authenticationEndpointPath}/sign-in`, {
            email: signInCommand.email,
            password: signInCommand.password
        });
    }

    /**
     * Registers a new user from a sign-up command.
     *
     * @param {import('../domain/commands/sign-up.command.js').SignUpCommand} signUpCommand - Sign-up command.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the session tokens and the created account.
     */
    signUp(signUpCommand) {
        return this.http.post(`${authenticationEndpointPath}/sign-up`, {
            email: signUpCommand.email,
            password: signUpCommand.password,
            fullName: signUpCommand.fullName,
            dni: signUpCommand.dni,
            phone: signUpCommand.phone,
            roles: [signUpCommand.role.toUpperCase()],
            merchant: signUpCommand.isMerchant
                ? { businessName: signUpCommand.businessName, ruc: signUpCommand.ruc, businessType: signUpCommand.businessType }
                : null
        });
    }

    /**
     * Revokes the refresh token of the session.
     *
     * @param {string} refreshToken - Refresh token to revoke.
     * @returns {Promise<import('axios').AxiosResponse>} Empty response.
     */
    signOut(refreshToken) {
        return this.http.post(`${authenticationEndpointPath}/sign-out`, { refreshToken });
    }

    /**
     * @returns {Promise<import('axios').AxiosResponse>} Response with the account of the signed-in user.
     */
    getCurrentUser() {
        return this.http.get(`${usersEndpointPath}/me`);
    }

    /**
     * Updates the contact data (full name and phone) of the signed-in user.
     *
     * @param {Object} resource - User resource.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the updated account.
     */
    updateUser(resource) {
        return this.http.put(`${usersEndpointPath}/me/identity`, { fullName: resource.fullName, phone: resource.phone });
    }
}

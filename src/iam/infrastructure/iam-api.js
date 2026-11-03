import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const usersEndpointPath = import.meta.env.VITE_USERS_ENDPOINT_PATH;
const authenticationEndpointPath = import.meta.env.VITE_AUTHENTICATION_ENDPOINT_PATH;

/**
 * Infrastructure gateway for the IAM endpoints.
 *
 * @class IamApi
 * @extends BaseApi
 */
export class IamApi extends BaseApi {
    /** Creates the endpoint client for users. */
    constructor() {
        super();
        this._usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
    }

    /**
     * Authenticates a user against the Trazza Platform API.
     *
     * @param {import('../domain/commands/sign-in.command.js').SignInCommand} signInCommand - Sign-in command.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the user resource and its bearer token.
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
     * @returns {Promise<import('axios').AxiosResponse>} Response with the created user and its bearer token.
     */
    signUp(signUpCommand) {
        return this.http.post(`${authenticationEndpointPath}/sign-up`, {
            fullName: signUpCommand.fullName,
            email: signUpCommand.email,
            phone: signUpCommand.phone,
            role: signUpCommand.role,
            password: signUpCommand.password
        });
    }

    /**
     * @param {number} id - User identifier.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the user.
     */
    getUserById(id) {
        return this._usersEndpoint.getById(id);
    }

    /**
     * Updates the contact data (full name and phone) of a user.
     *
     * @param {Object} resource - User resource (must include id).
     * @returns {Promise<import('axios').AxiosResponse>} Response with the updated user.
     */
    updateUser(resource) {
        return this._usersEndpoint.update(resource.id, { fullName: resource.fullName, phone: resource.phone });
    }
}

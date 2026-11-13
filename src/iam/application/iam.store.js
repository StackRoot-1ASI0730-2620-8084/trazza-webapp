import {computed, reactive} from "vue";
import {IamApi} from "../infrastructure/iam-api.js";
import {UserAssembler} from "../infrastructure/user.assembler.js";
import {sessionStorage} from "../infrastructure/session.storage.js";
import {Phone} from "../domain/model/phone.value-object.js";
import {UserRole} from "../domain/model/user-role.value-object.js";

const iamApi = new IamApi();

/**
 * Reactive state of the IAM bounded context.
 *
 * @type {{currentUser: ?import('../domain/model/user.entity.js').User, errors: Error[], processing: boolean}}
 */
const state = reactive({
    currentUser: null,
    errors: [],
    processing: false
});

/** @type {import('vue').ComputedRef<boolean>} Whether a user is signed in. */
const isSignedIn = computed(() => state.currentUser !== null);

/** @type {import('vue').ComputedRef<?string>} Role of the signed-in user. */
const currentRole = computed(() => state.currentUser?.role.value ?? null);

/** @type {import('vue').ComputedRef<?number>} Identifier of the signed-in user. */
const currentUserId = computed(() => state.currentUser?.id ?? null);

/** @type {import('vue').ComputedRef<boolean>} Whether the signed-in user is a carrier. */
const isCarrier = computed(() => currentRole.value === UserRole.CARRIER);

/** @type {import('vue').ComputedRef<boolean>} Whether the signed-in user is a merchant. */
const isMerchant = computed(() => currentRole.value === UserRole.MERCHANT);

/**
 * Applies the account stored in the session to the state. The session storage calls it on sign-in, on every
 * refresh of the tokens and on sign-out (with null).
 *
 * @param {?Object} resource - Account resource, or null when the session ends.
 * @returns {void}
 */
function applyUser(resource) {
    try {
        state.currentUser = resource ? UserAssembler.toEntityFromResource(resource) : null;
    } catch (error) {
        state.currentUser = null;
    }
}

/**
 * Stores the session of a user in the browser storage.
 *
 * @param {Object} session - Session resource issued by the Trazza Platform API.
 * @param {string} session.accessToken - Bearer token (JWT).
 * @param {string} session.refreshToken - Token used to renew the session.
 * @param {Object} session.user - Account of the authenticated user.
 * @returns {import('../domain/model/user.entity.js').User} Authenticated user.
 */
function startSession(session) {
    sessionStorage.save(session);
    return state.currentUser;
}

/**
 * Turns an error response of the platform API into an error whose message is an i18n key.
 * The API returns a ProblemDetails body with a stable code, such as email-invalid.
 *
 * @param {Error} error - Error thrown by the HTTP client.
 * @returns {Error} Error with a validation.* message, or the original error.
 */
function toApiError(error) {
    const code = error.response?.data?.code;
    return code ? new Error(`validation.${code}`) : error;
}

/**
 * Restores a previous session from the browser storage and follows its changes.
 *
 * @returns {void}
 */
function restoreSession() {
    sessionStorage.onChange(applyUser);
    applyUser(sessionStorage.accessToken ? sessionStorage.user : null);
}

/**
 * Executes the sign-in use case.
 *
 * @param {import('../domain/commands/sign-in.command.js').SignInCommand} signInCommand - Sign-in command.
 * @returns {Promise<import('../domain/model/user.entity.js').User>} Authenticated user.
 * @throws {Error} When the credentials are not valid.
 */
async function signIn(signInCommand) {
    state.processing = true;
    try {
        const response = await iamApi.signIn(signInCommand).catch(error => { throw toApiError(error); });
        const user = startSession(response.data);
        state.errors = [];
        return user;
    } catch (error) {
        state.errors.push(error);
        throw error;
    } finally {
        state.processing = false;
    }
}

/**
 * Executes the sign-up use case: the platform registers the user with its profile and opens a session.
 *
 * @param {import('../domain/commands/sign-up.command.js').SignUpCommand} signUpCommand - Sign-up command.
 * @returns {Promise<import('../domain/model/user.entity.js').User>} Registered user.
 * @throws {Error} When the API rejects the registration (e.g. the e-mail is already registered).
 */
async function signUp(signUpCommand) {
    state.processing = true;
    try {
        const response = await iamApi.signUp(signUpCommand).catch(error => { throw toApiError(error); });
        const user = startSession(response.data);
        state.errors = [];
        return user;
    } catch (error) {
        state.errors.push(error);
        throw error;
    } finally {
        state.processing = false;
    }
}

/**
 * Updates the contact data of the signed-in user.
 *
 * @param {Object} params - New contact data.
 * @param {string} params.fullName - Full name.
 * @param {string} params.phone - Mobile phone.
 * @returns {Promise<void>}
 */
async function updateCurrentUser({ fullName, phone }) {
    const user = state.currentUser;
    user.updateContact({ fullName, phone: new Phone(phone) });
    const response = await iamApi.updateUser(UserAssembler.toResourceFromEntity(user));
    sessionStorage.saveUser(response.data);
}

/**
 * Revokes the refresh token in the API (best effort) and clears the local session.
 *
 * @returns {Promise<void>}
 */
async function signOut() {
    const refreshToken = sessionStorage.refreshToken;
    state.errors = [];
    try {
        if (refreshToken) await iamApi.signOut(refreshToken);
    } catch (error) {
        // The local session is cleared anyway.
    }
    sessionStorage.clear();
}

restoreSession();

const iamStore = {
    state,
    isSignedIn,
    currentRole,
    currentUserId,
    isCarrier,
    isMerchant,
    signIn,
    signUp,
    signOut,
    updateCurrentUser
};

/**
 * Application service store for the IAM bounded context.
 * It coordinates authentication commands and exposes the UI-facing session state.
 *
 * @returns {typeof iamStore} Store state, getters and actions.
 */
const useIamStore = () => iamStore;

export default useIamStore;

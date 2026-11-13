import {computed, reactive} from "vue";
import {IamApi} from "../infrastructure/iam-api.js";
import {IamAssembler} from "../infrastructure/iam.assembler.js";
import {sessionStorage} from "../infrastructure/session.storage.js";
import {UserRole} from "../domain/model/user-role.value-object.js";

const iamApi = new IamApi();

/**
 * Reactive state of the IAM bounded context. One account can hold both roles; the active role decides which
 * menu the user sees and can be switched at any time.
 *
 * @type {{currentUser: ?import('../domain/model/user.entity.js').User, activeRole: ?string, verifications: Object[],
 *     errors: Error[], processing: boolean}}
 */
const state = reactive({
    currentUser: null,
    activeRole: null,
    verifications: [],
    errors: [],
    processing: false
});

/** @type {import('vue').ComputedRef<boolean>} Whether a user is signed in. */
const isSignedIn = computed(() => state.currentUser !== null);

/** @type {import('vue').ComputedRef<string[]>} Roles of the account. */
const roles = computed(() => state.currentUser?.roles ?? []);

/** @type {import('vue').ComputedRef<?string>} Role the user is working with (CARRIER or MERCHANT). */
const activeRole = computed(() => state.activeRole);

/** @type {import('vue').ComputedRef<?string>} Same as the active role. */
const currentRole = activeRole;

/** @type {import('vue').ComputedRef<?string>} Public id of the signed-in user. */
const currentUserId = computed(() => state.currentUser?.id ?? null);

/** @type {import('vue').ComputedRef<boolean>} Whether the user works as a carrier. */
const isCarrier = computed(() => state.activeRole === UserRole.CARRIER);

/** @type {import('vue').ComputedRef<boolean>} Whether the user works as a merchant. */
const isMerchant = computed(() => state.activeRole === UserRole.MERCHANT);

/**
 * Applies an account resource to the state and keeps the active role valid. The session storage calls it on
 * sign-in, on every refresh of the tokens and on sign-out (with null).
 *
 * @param {?Object} resource - Account resource, or null when the session ends.
 * @returns {void}
 */
function applyUser(resource) {
    if (!resource) {
        state.currentUser = null;
        state.activeRole = null;
        return;
    }
    state.currentUser = IamAssembler.toUser(resource);
    const stored = sessionStorage.activeRole;
    state.activeRole = state.currentUser.hasRole(stored) ? stored : state.currentUser.roles[0] ?? null;
    sessionStorage.activeRole = state.activeRole;
}

sessionStorage.onChange(applyUser);
applyUser(sessionStorage.accessToken ? sessionStorage.user : null);

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
 * Runs an action while the processing flag is on.
 *
 * @template T
 * @param {function(): Promise<T>} action - Action to run.
 * @returns {Promise<T>} Result of the action.
 */
async function run(action) {
    state.processing = true;
    try {
        return await action();
    } finally {
        state.processing = false;
    }
}

/**
 * Executes the sign-in use case.
 *
 * @param {import('../domain/commands/sign-in.command.js').SignInCommand} signInCommand - Sign-in command.
 * @returns {Promise<import('../domain/model/user.entity.js').User>} Authenticated user.
 */
const signIn = signInCommand => run(async () => {
    try {
        const response = await iamApi.signIn(signInCommand).catch(error => { throw toApiError(error); });
        sessionStorage.save(response.data);
        state.errors = [];
        return state.currentUser;
    } catch (error) {
        state.errors.push(error);
        throw error;
    }
});

/**
 * Executes the sign-up use case: the platform registers the user with its profile and opens a session.
 *
 * @param {import('../domain/commands/sign-up.command.js').SignUpCommand} signUpCommand - Sign-up command.
 * @returns {Promise<import('../domain/model/user.entity.js').User>} Registered user.
 */
const signUp = signUpCommand => run(async () => {
    try {
        const response = await iamApi.signUp(signUpCommand).catch(error => { throw toApiError(error); });
        sessionStorage.save(response.data);
        state.errors = [];
        return state.currentUser;
    } catch (error) {
        state.errors.push(error);
        throw error;
    }
});

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

/**
 * Reloads the account from the API (roles, profiles, KYC status).
 *
 * @returns {Promise<import('../domain/model/user.entity.js').User>} Signed-in user.
 */
async function refreshAccount() {
    const response = await iamApi.getMe();
    sessionStorage.saveUser(response.data);
    return state.currentUser;
}

/**
 * @param {string} role - CARRIER or MERCHANT, must be one of the user's roles.
 * @returns {void}
 */
function switchRole(role) {
    if (!state.currentUser?.hasRole(role)) return;
    state.activeRole = role;
    sessionStorage.activeRole = role;
}

/**
 * Updates the contact data of the signed-in user.
 *
 * @param {{fullName: string, phone: string}} identity - New contact data.
 * @returns {Promise<void>}
 */
const updateIdentity = ({ fullName, phone }) => run(async () => {
    const response = await iamApi.updateIdentity({ fullName, phone });
    sessionStorage.saveUser(response.data);
});

/**
 * Adds the missing role to the account and switches to it. The merchant role needs the business data.
 *
 * @param {string} role - CARRIER or MERCHANT.
 * @param {?{businessName: string, ruc: string, businessType: string}} merchant - Business data.
 * @returns {Promise<void>}
 */
const addRole = (role, merchant = null) => run(async () => {
    const response = await iamApi.addRole({ role, merchant });
    sessionStorage.saveUser(response.data);
    switchRole(role);
});

/**
 * @param {{businessName: string, businessType: string}} business - New business data.
 * @returns {Promise<void>}
 */
const updateMerchantProfile = ({ businessName, businessType }) => run(async () => {
    const response = await iamApi.updateMerchantProfile({ businessName, businessType });
    sessionStorage.saveUser(response.data);
});

/** @returns {Promise<void>} Loads the identity checks of the user. */
async function fetchVerifications() {
    state.verifications = (await iamApi.listIdentityVerifications()).data;
}

/**
 * Sends the identity check to the simulated RENIEC provider and reloads the account.
 *
 * @param {?string} [documentFrontS3Key=null] - Photo of the front of the DNI.
 * @param {?string} [documentBackS3Key=null] - Photo of the back of the DNI.
 * @returns {Promise<void>}
 */
const submitVerification = (documentFrontS3Key = null, documentBackS3Key = null) => run(async () => {
    await iamApi.submitIdentityVerification({ documentFrontS3Key, documentBackS3Key });
    await Promise.all([fetchVerifications(), refreshAccount()]);
});

const iamStore = {
    state,
    isSignedIn,
    roles,
    activeRole,
    currentRole,
    currentUserId,
    isCarrier,
    isMerchant,
    signIn,
    signUp,
    signOut,
    refreshAccount,
    switchRole,
    updateIdentity,
    addRole,
    updateMerchantProfile,
    fetchVerifications,
    submitVerification
};

/**
 * Application service store for the IAM bounded context.
 * It coordinates authentication commands and exposes the UI-facing session state.
 *
 * @returns {typeof iamStore} Store state, getters and actions.
 */
const useIamStore = () => iamStore;

export default useIamStore;

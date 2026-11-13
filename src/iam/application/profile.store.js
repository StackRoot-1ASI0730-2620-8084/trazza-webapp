import {computed} from "vue";
import useIamStore from "./iam.store.js";
import useFleetStore from "./fleet.store.js";

/**
 * Carrier and merchant profiles of the signed-in user, read from its account (GET /users/me) and its fleet
 * (GET /vehicles). The platform does not list the profiles of other users.
 */

/** @type {import('vue').ComputedRef<?Object>} Carrier profile of the signed-in user. */
const currentCarrierProfile = computed(() => {
    const user = useIamStore().state.currentUser;
    if (!user?.isCarrier) return null;
    const fleet = useFleetStore();
    return {
        id: user.carrierProfileId,
        userId: user.id,
        fullName: user.fullName,
        verified: user.isIdentityValidated,
        vehicles: fleet.state.vehicles,
        activeVehicles: fleet.activeVehicles.value,
        findVehicle: id => fleet.findVehicle(id)
    };
});

/** @type {import('vue').ComputedRef<?Object>} Merchant profile of the signed-in user. */
const currentMerchantProfile = computed(() => {
    const user = useIamStore().state.currentUser;
    if (!user?.merchantProfile) return null;
    return { ...user.merchantProfile, userId: user.id, contactName: user.fullName, verified: user.isIdentityValidated };
});

/**
 * Reloads the account and, for carriers, the fleet.
 *
 * @returns {Promise<void>}
 */
async function fetchProfiles() {
    const iamStore = useIamStore();
    await iamStore.refreshAccount();
    if (iamStore.state.currentUser?.isCarrier) await useFleetStore().fetchFleet();
}

/**
 * @param {?string} userId - User public id.
 * @returns {Object|undefined} Carrier profile, only for the signed-in user.
 */
const getCarrierProfileByUserId = userId =>
    currentCarrierProfile.value?.userId === userId ? currentCarrierProfile.value : undefined;

/**
 * @param {?string} userId - User public id.
 * @returns {Object|undefined} Merchant profile, only for the signed-in user.
 */
const getMerchantProfileByUserId = userId =>
    currentMerchantProfile.value?.userId === userId ? currentMerchantProfile.value : undefined;

/**
 * @param {string} userId - User public id.
 * @returns {string} Carrier full name, merchant business name or an empty string.
 */
const displayNameOf = userId =>
    getCarrierProfileByUserId(userId)?.fullName ?? getMerchantProfileByUserId(userId)?.businessName ?? '';

const profileStore = {
    currentCarrierProfile,
    currentMerchantProfile,
    fetchProfiles,
    getCarrierProfileByUserId,
    getMerchantProfileByUserId,
    displayNameOf
};

/**
 * Application service store for the profiles of the signed-in user.
 *
 * @returns {typeof profileStore} Store getters and actions.
 */
const useProfileStore = () => profileStore;

export default useProfileStore;

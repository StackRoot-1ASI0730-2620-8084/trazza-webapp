import {UserRole} from "./user-role.value-object.js";

/**
 * Signed-in account as returned by GET /users/me. Personal data arrives masked (DNI) or decrypted for its owner.
 *
 * @class User
 */
export class User {
    constructor({ id, email, roles = [], fullName = '', dniMasked = '', phone = null, kycStatus = null,
                    carrierProfileId = null, merchantProfile = null, createdAt = null }) {
        this.id = id;
        this.email = email;
        this.roles = [...roles];
        this.fullName = fullName;
        this.dniMasked = dniMasked;
        this.phone = phone;
        this.kycStatus = kycStatus;
        this.carrierProfileId = carrierProfileId;
        this.merchantProfile = merchantProfile;
        this.createdAt = createdAt;
    }

    /** @param {string} role - CARRIER or MERCHANT. @returns {boolean} */
    hasRole(role) {
        return this.roles.includes(role);
    }

    get isCarrier() {
        return this.hasRole(UserRole.CARRIER);
    }

    get isMerchant() {
        return this.hasRole(UserRole.MERCHANT);
    }

    get hasBothRoles() {
        return this.isCarrier && this.isMerchant;
    }

    get isIdentityValidated() {
        return this.kycStatus === 'VALIDATED';
    }
}

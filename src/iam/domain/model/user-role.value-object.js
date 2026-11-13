/**
 * Immutable value object that represents the role of a Trazza user.
 *
 * @class UserRole
 */
export class UserRole {
    /** @type {string} Carrier role: owns vehicles and publishes return routes. */
    static CARRIER = 'CARRIER';

    /** @type {string} Merchant role: publishes freight requests. */
    static MERCHANT = 'MERCHANT';

    /** @type {ReadonlyArray<string>} Supported roles. */
    static VALUES = Object.freeze([UserRole.CARRIER, UserRole.MERCHANT]);

    /**
     * @param {string} value - Role value, as the API names it (CARRIER or MERCHANT).
     * @throws {Error} When the role is not supported.
     */
    constructor(value) {
        const role = (value ?? '').toUpperCase();
        if (!UserRole.VALUES.includes(role)) throw new Error('validation.role-invalid');
        this._value = role;
        Object.freeze(this);
    }

    /** @returns {string} Role value. */
    get value() {
        return this._value;
    }

    /** @returns {boolean} True for carriers. */
    get isCarrier() {
        return this._value === UserRole.CARRIER;
    }

    /** @returns {boolean} True for merchants. */
    get isMerchant() {
        return this._value === UserRole.MERCHANT;
    }
}

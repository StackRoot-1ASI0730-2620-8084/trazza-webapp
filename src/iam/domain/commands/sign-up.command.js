import {Email} from "../model/email.value-object.js";
import {Phone} from "../model/phone.value-object.js";
import {Dni} from "../model/dni.value-object.js";
import {Ruc} from "../model/ruc.value-object.js";
import {UserRole} from "../model/user-role.value-object.js";

/**
 * Command that carries the data required to register a carrier or a merchant.
 *
 * @class SignUpCommand
 */
export class SignUpCommand {
    /**
     * Minimum password length.
     * @type {number}
     */
    static MIN_PASSWORD_LENGTH = 8;

    /**
     * @param {Object} params - Command attributes.
     * @param {string} params.role - "carrier" or "merchant".
     * @param {string} params.fullName - Full name of the person.
     * @param {string} [params.businessName=''] - Business name (merchants only).
     * @param {string} [params.businessType=''] - Type of business (merchants only).
     * @param {string} params.email - E-mail.
     * @param {string} params.phone - Mobile phone.
     * @param {string} params.dni - DNI of the person.
     * @param {string} [params.ruc=''] - RUC of the business (merchants only).
     * @param {string} params.password - Password.
     * @param {string} params.confirmPassword - Password confirmation.
     * @param {boolean} params.acceptedTerms - Terms and privacy policy acceptance.
     * @throws {Error} When a business rule of the registration is violated.
     */
    constructor({ role, fullName, businessName = '', businessType = '', email, phone, dni, ruc = '', password, confirmPassword, acceptedTerms }) {
        this._role = new UserRole(role);
        if ((fullName ?? '').trim().length < 3) throw new Error('validation.full-name-required');
        if (this._role.isMerchant && (businessName ?? '').trim().length < 3) throw new Error('validation.business-name-required');
        if (this._role.isMerchant && (businessType ?? '').trim().length < 2) throw new Error('validation.business-type-required');
        this._email = new Email(email);
        this._phone = new Phone(phone);
        this._dni = new Dni(dni);
        this._ruc = this._role.isMerchant ? new Ruc(ruc) : null;
        if ((password ?? '').length < SignUpCommand.MIN_PASSWORD_LENGTH) throw new Error('validation.password-too-short');
        if (password !== confirmPassword) throw new Error('validation.password-mismatch');
        if (!acceptedTerms) throw new Error('validation.terms-required');
        this._fullName = fullName.trim();
        this._businessName = (businessName ?? '').trim();
        this._businessType = (businessType ?? '').trim();
        this._password = password;
        Object.freeze(this);
    }

    /** @returns {string} Role value. */
    get role() {
        return this._role.value;
    }

    /** @returns {string} Full name. */
    get fullName() {
        return this._fullName;
    }

    /** @returns {string} Business name. */
    get businessName() {
        return this._businessName;
    }

    /** @returns {string} Normalized e-mail. */
    get email() {
        return this._email.value;
    }

    /** @returns {string} Normalized phone. */
    get phone() {
        return this._phone.value;
    }

    /** @returns {boolean} True when the user registers as a merchant. */
    get isMerchant() {
        return this._role.isMerchant;
    }

    /** @returns {string} Type of business. */
    get businessType() {
        return this._businessType;
    }

    /** @returns {string} DNI number. */
    get dni() {
        return this._dni.value;
    }

    /** @returns {?string} RUC number (merchants only). */
    get ruc() {
        return this._ruc?.value ?? null;
    }

    /** @returns {string} Password. */
    get password() {
        return this._password;
    }
}

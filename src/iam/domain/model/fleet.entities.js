/**
 * Truck of a carrier. Identified by its public id (UUID).
 * @class Vehicle
 */
export class Vehicle {
    constructor({ id = null, plate = '', model = '', maxLoadKg = 0, cargoLengthM = 0, cargoWidthM = 0, cargoHeightM = 0,
                    cargoVolumeM3 = 0, photoS3Key = null, isActive = true }) {
        Object.assign(this, { id, plate, model, maxLoadKg, cargoLengthM, cargoWidthM, cargoHeightM, cargoVolumeM3, photoS3Key, isActive });
    }

    /** @returns {string} Plate and model, e.g. ABC-123 · Hino 300. */
    get label() {
        return `${this.plate} · ${this.model}`;
    }
}

/**
 * Driver employed by a carrier. Sex is optional (F, M or X).
 * @class Driver
 */
export class Driver {
    constructor({ id = null, fullName = '', sex = null, experienceStars = 3, isActive = true }) {
        Object.assign(this, { id, fullName, sex, experienceStars, isActive });
    }
}

/**
 * Frequent address with real coordinates.
 * @class SavedAddress
 */
export class SavedAddress {
    constructor({ id = null, label = '', address = '', district = null, latitude = null, longitude = null }) {
        Object.assign(this, { id, label, address, district, latitude, longitude });
    }
}

/**
 * Trip agreed between a carrier and a merchant when a proposal is accepted.
 * Flow: SCHEDULED → PICKED_UP → IN_TRANSIT → DELIVERED → CONFIRMED (or CANCELLED while SCHEDULED).
 * @class Trip
 */
export class Trip {
    static ACTIVE_STATUSES = ['SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

    constructor(resource) {
        Object.assign(this, resource);
        this.lastPoint = resource.lastPoint ? new TrackingPoint(resource.lastPoint) : null;
    }

    get label() {
        return `${this.pickup.address} → ${this.delivery.address}`;
    }

    get isCarrier() {
        return this.myRole === 'CARRIER';
    }

    get isMerchant() {
        return this.myRole === 'MERCHANT';
    }

    get isActive() {
        return Trip.ACTIVE_STATUSES.includes(this.status);
    }

    get isClosed() {
        return this.status === 'CONFIRMED' || this.status === 'CANCELLED';
    }

    get canPickUp() {
        return this.isCarrier && this.status === 'SCHEDULED';
    }

    get canDeliver() {
        return this.isCarrier && (this.status === 'PICKED_UP' || this.status === 'IN_TRANSIT');
    }

    get canConfirm() {
        return this.isMerchant && this.status === 'DELIVERED';
    }

    get canCancel() {
        return this.status === 'SCHEDULED';
    }

    get canTrack() {
        return this.isCarrier && (this.status === 'PICKED_UP' || this.status === 'IN_TRANSIT');
    }

    get counterpart() {
        return this.isCarrier ? this.merchant : this.carrier;
    }
}

/** GPS position sent by the carrier's phone or by an IoT device. */
export class TrackingPoint {
    constructor({ id, latitude, longitude, speedKmh = null, source = 'PHONE', recordedAt }) {
        Object.assign(this, { id, latitude, longitude, speedKmh, source, recordedAt });
    }
}

/** Alert raised when the truck is more than 2 km away from the planned path. */
export class DeviationAlert {
    constructor({ id, latitude, longitude, deviationKm, detectedAt, acknowledgedAt = null }) {
        Object.assign(this, { id, latitude, longitude, deviationKm, detectedAt, acknowledgedAt });
    }

    get isOpen() {
        return this.acknowledgedAt === null;
    }
}

/** Problem reported on a trip (damaged or incomplete cargo, delay, other). */
export class Incident {
    static TYPES = ['DAMAGED', 'INCOMPLETE', 'DELAY', 'OTHER'];

    constructor({ id, type, description, status, resolution = null, reportedAt, resolvedAt = null, evidences = [] }) {
        Object.assign(this, { id, type, description, status, resolution, reportedAt, resolvedAt, evidences });
    }

    get isResolved() {
        return this.status === 'RESOLVED';
    }
}

/** IoT tracker loaned with the IOT_PER_TRUCK plan. */
export class IotDevice {
    constructor({ id, serialNumber, status, vehicleId, vehiclePlate, loanedAt = null }) {
        Object.assign(this, { id, serialNumber, status, vehicleId, vehiclePlate, loanedAt });
    }
}

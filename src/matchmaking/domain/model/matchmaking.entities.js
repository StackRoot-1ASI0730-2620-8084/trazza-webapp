/**
 * Address with its real coordinates (SRID 4326).
 * @class Place
 */
export class Place {
    constructor({ address = '', latitude = null, longitude = null } = {}) {
        Object.assign(this, { address, latitude, longitude });
    }
}

/**
 * Empty return trip of a carrier. Carries at most two shipments; free capacity comes computed from the API.
 * @class ReturnRoute
 */
export class ReturnRoute {
    static MAX_SHIPMENTS = 2;

    constructor({ id, origin, destination, departureAt, maxShipments, status, vehicle, driverId = null, driverName = null,
                    acceptedShipments = 0, availableWeightKg = 0, availableVolumeM3 = 0, pendingProposals = 0, createdAt = null }) {
        Object.assign(this, { id, departureAt, maxShipments, status, vehicle, driverId, driverName, acceptedShipments,
            availableWeightKg, availableVolumeM3, pendingProposals, createdAt });
        this.origin = new Place(origin);
        this.destination = new Place(destination);
    }

    get label() {
        return `${this.origin.address} → ${this.destination.address}`;
    }

    get isOpen() {
        return this.status === 'PUBLISHED';
    }

    get isClosed() {
        return this.status === 'COMPLETED' || this.status === 'CANCELLED';
    }

    get freeSlots() {
        return Math.max(0, this.maxShipments - this.acceptedShipments);
    }
}

/**
 * Cargo a merchant needs to move, with a pick-up window.
 * @class ShipmentRequest
 */
export class ShipmentRequest {
    constructor({ id, description, weightKg, volumeM3, pickup, delivery, pickupFrom, pickupUntil, status, merchantName = '',
                    pendingProposals = 0, cancellationReason = null, cancelledAt = null, createdAt = null }) {
        Object.assign(this, { id, description, weightKg, volumeM3, pickupFrom, pickupUntil, status, merchantName,
            pendingProposals, cancellationReason, cancelledAt, createdAt });
        this.pickup = new Place(pickup);
        this.delivery = new Place(delivery);
    }

    get label() {
        return `${this.pickup.address} → ${this.delivery.address}`;
    }

    get isOpen() {
        return this.status === 'OPEN';
    }
}

/**
 * Single offer of a carrier for a shipment on one of its routes (no counter-offers).
 * @class MatchProposal
 */
export class MatchProposal {
    constructor({ id, offeredRate, currency, status, respondedAt = null, createdAt = null, route, shipment, carrier, merchant, tripId = null }) {
        Object.assign(this, { id, offeredRate, currency, status, respondedAt, createdAt, carrier, merchant, tripId });
        this.route = new ReturnRoute(route);
        this.shipment = new ShipmentRequest(shipment);
    }

    get isPending() {
        return this.status === 'PENDING';
    }

    get isAccepted() {
        return this.status === 'ACCEPTED';
    }

    get chatOpen() {
        return this.status === 'PENDING' || this.status === 'ACCEPTED';
    }
}

/**
 * Chat message of a proposal. The chat is deleted when the trip ends.
 * @class Message
 */
export class Message {
    constructor({ id, senderId, senderName, isMine, content, sentAt, readAt = null }) {
        Object.assign(this, { id, senderId, senderName, isMine, content, sentAt, readAt });
    }
}

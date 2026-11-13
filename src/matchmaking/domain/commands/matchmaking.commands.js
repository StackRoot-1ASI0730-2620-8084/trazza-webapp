import {GeoLocation} from "../../../shared/domain/model/geo-location.value-object.js";
import {ReturnRoute} from "../model/matchmaking.entities.js";

/**
 * Validates an address with coordinates and returns the resource expected by the API.
 * @param {{address: string, latitude: ?number, longitude: ?number}} place - Value of a map picker.
 * @returns {{address: string, latitude: number, longitude: number}}
 */
const toPlace = (place) => {
    const address = (place?.address ?? '').trim();
    if (!address) throw new Error('validation.address-required');
    if (place.latitude === null || place.latitude === undefined) throw new Error('validation.point-required');
    const location = new GeoLocation(place);
    return { address, latitude: location.latitude, longitude: location.longitude };
};

/** Publication of a return route. */
export class CreateReturnRouteCommand {
    constructor({ vehicleId, driverId = null, origin, destination, departureAt, maxShipments = ReturnRoute.MAX_SHIPMENTS }) {
        if (!vehicleId) throw new Error('validation.vehicle-required');
        if (!(departureAt instanceof Date) || departureAt <= new Date()) throw new Error('validation.departure-future');
        if (![1, 2].includes(maxShipments)) throw new Error('validation.max-shipments');
        this.vehicleId = vehicleId;
        this.driverId = driverId || null;
        this.origin = toPlace(origin);
        this.destination = toPlace(destination);
        this.departureAt = departureAt.toISOString();
        this.maxShipments = maxShipments;
    }
}

/** Publication of a shipment request by a merchant. */
export class CreateShipmentRequestCommand {
    constructor({ description, weightKg, volumeM3, pickup, delivery, pickupFrom, pickupUntil }) {
        const text = (description ?? '').trim();
        if (!text) throw new Error('validation.description-required');
        if (!(weightKg > 0)) throw new Error('validation.weight-positive');
        if (!(volumeM3 > 0)) throw new Error('validation.volume-positive');
        if (!(pickupFrom instanceof Date) || !(pickupUntil instanceof Date) || pickupUntil <= pickupFrom)
            throw new Error('validation.pickup-window');
        if (pickupUntil <= new Date()) throw new Error('validation.pickup-window-past');
        this.description = text;
        this.weightKg = weightKg;
        this.volumeM3 = volumeM3;
        this.pickup = toPlace(pickup);
        this.delivery = toPlace(delivery);
        this.pickupFrom = pickupFrom.toISOString();
        this.pickupUntil = pickupUntil.toISOString();
    }
}

/** Single offer of a carrier. */
export class CreateMatchProposalCommand {
    constructor({ shipmentRequestId, returnRouteId, offeredRate, currency = 'PEN' }) {
        if (!shipmentRequestId || !returnRouteId) throw new Error('validation.route-required');
        if (!(offeredRate > 0)) throw new Error('validation.rate-positive');
        Object.assign(this, { shipmentRequestId, returnRouteId, offeredRate, currency });
    }
}

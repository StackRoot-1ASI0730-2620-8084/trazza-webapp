import {MatchProposal, Message, ReturnRoute, ShipmentRequest} from "../domain/model/matchmaking.entities.js";

/**
 * Converts the Matchmaking resources of the API into entities and commands into resources.
 * The API returns flat resources (address plus location) with lower-case statuses; the entities use places
 * and upper-case statuses.
 */

const toStatus = status => String(status ?? '').toUpperCase();

const toPlace = (address, location) => ({ address, latitude: location?.latitude ?? null, longitude: location?.longitude ?? null });

const toLocation = place => ({ latitude: place.latitude, longitude: place.longitude });

export const MatchmakingAssembler = {
    /**
     * @param {Object} resource - ReturnRouteResource.
     * @param {Object} [context] - Data the API does not return with the route.
     * @param {Object} [context.vehicle] - Vehicle of the route, when it belongs to the signed-in carrier.
     * @param {?string} [context.driverName] - Name of its driver.
     * @param {Array<{weightKg: number, volumeM3: number}>} [context.acceptedShipments] - Shipments already accepted on the route.
     * @param {number} [context.pendingProposals] - Proposals waiting for an answer.
     * @returns {ReturnRoute}
     */
    toRoute(resource, { vehicle = null, driverName = null, acceptedShipments = [], pendingProposals = 0 } = {}) {
        const usedWeight = acceptedShipments.reduce((sum, shipment) => sum + Number(shipment.weightKg ?? 0), 0);
        const usedVolume = acceptedShipments.reduce((sum, shipment) => sum + Number(shipment.volumeM3 ?? 0), 0);
        return new ReturnRoute({
            id: resource.id,
            origin: toPlace(resource.originAddress, resource.originLocation),
            destination: toPlace(resource.destinationAddress, resource.destinationLocation),
            departureAt: resource.departureAt,
            maxShipments: resource.maxShipments,
            status: toStatus(resource.status),
            vehicle: vehicle ?? { id: resource.vehicleId, plate: '—', model: '' },
            driverId: resource.driverId ?? null,
            driverName,
            acceptedShipments: acceptedShipments.length,
            availableWeightKg: vehicle ? Math.max(0, vehicle.maxLoadKg - usedWeight) : 0,
            availableVolumeM3: vehicle ? Math.max(0, vehicle.cargoVolumeM3 - usedVolume) : 0,
            pendingProposals,
            createdAt: resource.createdAt ?? null
        });
    },

    /**
     * @param {Object} resource - ShipmentRequestResource.
     * @param {number} [pendingProposals] - Proposals waiting for an answer.
     * @returns {ShipmentRequest}
     */
    toShipment(resource, pendingProposals = 0) {
        return new ShipmentRequest({
            id: resource.id,
            description: resource.description,
            weightKg: resource.weightKg,
            volumeM3: resource.volumeM3,
            pickup: toPlace(resource.pickupAddress, resource.pickupLocation),
            delivery: toPlace(resource.deliveryAddress, resource.deliveryLocation),
            pickupFrom: resource.pickupFrom,
            pickupUntil: resource.pickupUntil,
            status: toStatus(resource.status),
            pendingProposals,
            cancellationReason: resource.cancellationReason ?? null,
            cancelledAt: resource.cancelledAt ?? null,
            createdAt: resource.createdAt ?? null
        });
    },

    /**
     * @param {Object} resource - MatchProposalResource.
     * @param {ReturnRoute} route - Route of the proposal.
     * @param {ShipmentRequest} shipment - Shipment of the proposal.
     * @returns {MatchProposal}
     */
    toProposal(resource, route, shipment) {
        return new MatchProposal({
            id: resource.id,
            offeredRate: resource.offeredRate?.amount ?? 0,
            currency: resource.offeredRate?.currency ?? 'PEN',
            status: toStatus(resource.status),
            respondedAt: resource.respondedAt ?? null,
            createdAt: resource.createdAt ?? null,
            route,
            shipment,
            carrier: null,
            merchant: null,
            tripId: resource.tripId ?? null
        });
    },

    /**
     * @param {Object} resource - MessageResource.
     * @param {?number} mySenderId - Internal user id of the signed-in user, when known.
     * @returns {Message}
     */
    toMessage(resource, mySenderId) {
        return new Message({
            id: resource.id,
            senderId: resource.senderUserId,
            senderName: '',
            isMine: mySenderId !== null && resource.senderUserId === mySenderId,
            content: resource.content,
            sentAt: resource.sentAt,
            readAt: resource.readAt ?? null
        });
    },

    toRouteResource: command => ({
        vehicleId: command.vehicleId,
        driverId: command.driverId,
        originAddress: command.origin.address,
        originLocation: toLocation(command.origin),
        destinationAddress: command.destination.address,
        destinationLocation: toLocation(command.destination),
        departureAt: command.departureAt,
        maxShipments: command.maxShipments
    }),

    toShipmentResource: command => ({
        description: command.description,
        weightKg: command.weightKg,
        volumeM3: command.volumeM3,
        pickupAddress: command.pickup.address,
        pickupLocation: toLocation(command.pickup),
        deliveryAddress: command.delivery.address,
        deliveryLocation: toLocation(command.delivery),
        pickupFrom: command.pickupFrom,
        pickupUntil: command.pickupUntil
    }),

    toProposalResource: command => ({
        shipmentRequestId: command.shipmentRequestId,
        returnRouteId: command.returnRouteId,
        offeredRate: { amount: command.offeredRate, currency: command.currency }
    })
};

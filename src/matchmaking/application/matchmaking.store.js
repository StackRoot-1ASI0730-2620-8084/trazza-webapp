import {computed, reactive} from "vue";
import {MatchmakingApi} from "../infrastructure/matchmaking-api.js";
import {MatchmakingAssembler} from "../infrastructure/matchmaking.assembler.js";
import useFleetStore from "../../iam/application/fleet.store.js";
import useIamStore from "../../iam/application/iam.store.js";

const api = new MatchmakingApi();

/**
 * Reactive state of the Matchmaking &amp; Routing bounded context.
 */
const state = reactive({
    myRoutes: [],
    myShipments: [],
    openShipments: [],
    proposals: [],
    loaded: false
});

/**
 * Resources returned by the API, by id. The entities are rebuilt from them, because a route needs its
 * proposals (accepted shipments) and its vehicle, and a proposal needs its route and its shipment.
 */
const resources = {
    routes: new Map(),
    shipments: new Map(),
    proposals: [],
    myRouteIds: [],
    myShipmentIds: [],
    openShipmentIds: []
};

const openRoutes = computed(() => state.myRoutes.filter(route => route.isOpen));
const pendingProposals = computed(() => state.proposals.filter(proposal => proposal.isPending));

const cache = (map, list) => list.forEach(resource => map.set(resource.id, resource));

const proposalsOf = (key, id, status) => resources.proposals.filter(proposal => proposal[key] === id && proposal.status === status);

const toRoute = (resource) => {
    const fleet = useFleetStore();
    return MatchmakingAssembler.toRoute(resource, {
        vehicle: fleet.findVehicle(resource.vehicleId),
        driverName: fleet.state.drivers.find(driver => driver.id === resource.driverId)?.fullName ?? null,
        acceptedShipments: proposalsOf('returnRouteId', resource.id, 'accepted')
            .map(proposal => resources.shipments.get(proposal.shipmentRequestId)).filter(Boolean),
        pendingProposals: proposalsOf('returnRouteId', resource.id, 'pending').length
    });
};

const toShipment = resource => MatchmakingAssembler.toShipment(resource, proposalsOf('shipmentRequestId', resource.id, 'pending').length);

const toProposal = resource => MatchmakingAssembler.toProposal(resource,
    toRoute(resources.routes.get(resource.returnRouteId)), toShipment(resources.shipments.get(resource.shipmentRequestId)));

/** Rebuilds the entities of the state from the cached resources. */
function refresh() {
    state.myRoutes = resources.myRouteIds.map(id => toRoute(resources.routes.get(id)));
    state.myShipments = resources.myShipmentIds.map(id => toShipment(resources.shipments.get(id)));
    state.openShipments = resources.openShipmentIds.map(id => toShipment(resources.shipments.get(id)));
    state.proposals = resources.proposals.map(toProposal);
}

/** Loads the routes and shipments of the proposals that are not cached yet. */
async function fetchMissing(proposals) {
    const missingRoutes = [...new Set(proposals.map(proposal => proposal.returnRouteId))].filter(id => !resources.routes.has(id));
    const missingShipments = [...new Set(proposals.map(proposal => proposal.shipmentRequestId))].filter(id => !resources.shipments.has(id));
    const [routes, shipments] = await Promise.all([
        Promise.all(missingRoutes.map(id => api.getRoute(id))),
        Promise.all(missingShipments.map(id => api.getShipment(id)))
    ]);
    cache(resources.routes, routes.map(response => response.data));
    cache(resources.shipments, shipments.map(response => response.data));
}

async function fetchCarrierData() {
    const fleet = useFleetStore();
    const [routes, open] = await Promise.all([api.listMyRoutes(), api.listOpenShipments(), fleet.state.loaded ? null : fleet.fetchFleet()]);
    cache(resources.routes, routes.data);
    cache(resources.shipments, open.data);
    resources.myRouteIds = routes.data.map(route => route.id);
    resources.openShipmentIds = open.data.map(shipment => shipment.id);
    refresh();
}

async function fetchMerchantData() {
    const shipments = (await api.listMyShipments()).data;
    cache(resources.shipments, shipments);
    resources.myShipmentIds = shipments.map(shipment => shipment.id);
    refresh();
}

async function fetchProposals() {
    const proposals = (await api.listProposals()).data;
    await fetchMissing(proposals);
    resources.proposals = proposals;
    refresh();
}

/**
 * Loads the data of the active role.
 * @param {string} role - CARRIER or MERCHANT.
 */
async function fetchAll(role) {
    Object.assign(resources, { myRouteIds: [], myShipmentIds: [], openShipmentIds: [] });
    await Promise.all([role === 'CARRIER' ? fetchCarrierData() : fetchMerchantData(), fetchProposals()]);
    state.loaded = true;
}

async function getRoute(id) {
    const resource = (await api.getRoute(id)).data;
    resources.routes.set(resource.id, resource);
    return toRoute(resource);
}

async function createRoute(command) {
    const resource = (await api.createRoute(MatchmakingAssembler.toRouteResource(command))).data;
    resources.routes.set(resource.id, resource);
    resources.myRouteIds.unshift(resource.id);
    refresh();
    return toRoute(resource);
}

async function cancelRoute(route) {
    const resource = (await api.cancelRoute(route.id)).data;
    resources.routes.set(resource.id, resource);
    refresh();
}

async function suggestShipments(routeId) {
    const shipments = (await api.suggestShipments(routeId)).data;
    cache(resources.shipments, shipments);
    return shipments.map(toShipment);
}

async function createShipment(command) {
    const resource = (await api.createShipment(MatchmakingAssembler.toShipmentResource(command))).data;
    resources.shipments.set(resource.id, resource);
    resources.myShipmentIds.unshift(resource.id);
    refresh();
    return toShipment(resource);
}

async function cancelShipment(shipment, reason) {
    const resource = (await api.cancelShipment(shipment.id, reason)).data;
    resources.shipments.set(resource.id, resource);
    refresh();
}

async function suggestRoutes(shipmentId) {
    const routes = (await api.suggestRoutes(shipmentId)).data;
    cache(resources.routes, routes);
    return routes.map(toRoute);
}

/** Replaces (or adds) a proposal resource and returns its entity. */
async function storeProposal(resource) {
    await fetchMissing([resource]);
    const index = resources.proposals.findIndex(proposal => proposal.id === resource.id);
    if (index >= 0) resources.proposals.splice(index, 1, resource);
    else resources.proposals.unshift(resource);
    refresh();
    return toProposal(resource);
}

async function getProposal(id) {
    return storeProposal((await api.getProposal(id)).data);
}

async function createProposal(command) {
    return storeProposal((await api.createProposal(MatchmakingAssembler.toProposalResource(command))).data);
}

/**
 * Accepts, rejects or cancels a pending proposal.
 * @param {MatchProposal} proposal - Proposal.
 * @param {'accept'|'reject'|'cancel'} action - Action.
 * @returns {Promise<MatchProposal>} Updated proposal (with its trip id when accepted).
 */
async function respondProposal(proposal, action) {
    return storeProposal((await api.respondProposal(proposal.id, action)).data);
}

/*
 * Messages carry the internal id of their sender, which the API does not return for the signed-in user.
 * It is learnt from the first message the user sends and kept per account.
 */
const senderIdKey = () => `trazza.matchmaking.sender-id.${useIamStore().currentUserId.value}`;

const mySenderId = () => {
    const value = localStorage.getItem(senderIdKey());
    return value === null ? null : Number(value);
};

async function listMessages(proposalId) {
    const senderId = mySenderId();
    return (await api.listMessages(proposalId)).data.map(resource => MatchmakingAssembler.toMessage(resource, senderId));
}

async function sendMessage(proposalId, content) {
    const resource = (await api.sendMessage(proposalId, content)).data;
    localStorage.setItem(senderIdKey(), String(resource.senderUserId));
    return MatchmakingAssembler.toMessage(resource, resource.senderUserId);
}

const matchmakingStore = {
    state, openRoutes, pendingProposals, fetchAll, fetchCarrierData, fetchMerchantData, fetchProposals,
    getRoute, createRoute, cancelRoute, suggestShipments, createShipment, cancelShipment, suggestRoutes,
    getProposal, createProposal, respondProposal, listMessages, sendMessage
};

/** @returns {typeof matchmakingStore} Application service store of Matchmaking. */
const useMatchmakingStore = () => matchmakingStore;

export default useMatchmakingStore;

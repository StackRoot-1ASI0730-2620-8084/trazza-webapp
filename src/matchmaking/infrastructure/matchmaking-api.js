import {BaseApi} from "../../shared/infrastructure/base-api.js";

const returnRoutesPath = import.meta.env.VITE_RETURN_ROUTES_ENDPOINT_PATH ?? '/return-routes';
const shipmentRequestsPath = import.meta.env.VITE_SHIPMENT_REQUESTS_ENDPOINT_PATH ?? '/shipment-requests';
const matchProposalsPath = import.meta.env.VITE_MATCH_PROPOSALS_ENDPOINT_PATH ?? '/match-proposals';

/**
 * Gateway to the Matchmaking &amp; Routing bounded context.
 * @class MatchmakingApi
 */
export class MatchmakingApi extends BaseApi {
    listMyRoutes() { return this.http.get(`${returnRoutesPath}/mine`); }

    getRoute(id) { return this.http.get(`${returnRoutesPath}/${id}`); }

    createRoute(resource) { return this.http.post(returnRoutesPath, resource); }

    cancelRoute(id) { return this.http.post(`${returnRoutesPath}/${id}/cancel`); }

    suggestShipments(routeId) { return this.http.get(`${returnRoutesPath}/${routeId}/suggested-shipments`); }

    listMyShipments() { return this.http.get(`${shipmentRequestsPath}/mine`); }

    listOpenShipments() { return this.http.get(`${shipmentRequestsPath}/open`); }

    getShipment(id) { return this.http.get(`${shipmentRequestsPath}/${id}`); }

    createShipment(resource) { return this.http.post(shipmentRequestsPath, resource); }

    cancelShipment(id, reason) { return this.http.post(`${shipmentRequestsPath}/${id}/cancel`, null, { params: { reason } }); }

    suggestRoutes(shipmentId) { return this.http.get(`${shipmentRequestsPath}/${shipmentId}/suggested-routes`); }

    listProposals() { return this.http.get(matchProposalsPath); }

    getProposal(id) { return this.http.get(`${matchProposalsPath}/${id}`); }

    createProposal(resource) { return this.http.post(matchProposalsPath, resource); }

    respondProposal(id, action) { return this.http.post(`${matchProposalsPath}/${id}/${action}`); }

    listMessages(proposalId) { return this.http.get(`${matchProposalsPath}/${proposalId}/messages`); }

    sendMessage(proposalId, content) { return this.http.post(`${matchProposalsPath}/${proposalId}/messages`, { content }); }
}

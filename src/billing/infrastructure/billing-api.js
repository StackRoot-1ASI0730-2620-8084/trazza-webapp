import {BaseApi} from "../../shared/infrastructure/base-api.js";

const plansPath = import.meta.env.VITE_PLANS_ENDPOINT_PATH ?? '/plans';
const subscriptionsPath = import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH ?? '/subscriptions';
const settlementsPath = import.meta.env.VITE_FREIGHT_SETTLEMENTS_ENDPOINT_PATH ?? '/freight-settlements';
const compensationsPath = import.meta.env.VITE_CANCELLATION_COMPENSATIONS_ENDPOINT_PATH ?? '/cancellation-compensations';

export class BillingApi extends BaseApi {
    listPlans() { return this.http.get(plansPath); }

    listSubscriptions() { return this.http.get(subscriptionsPath); }

    subscribe(planCode, vehicleIds) { return this.http.post(subscriptionsPath, { planCode, vehicleIds }); }

    renew(id) { return this.http.post(`${subscriptionsPath}/${id}/renew`); }

    cancelSubscription(id) { return this.http.post(`${subscriptionsPath}/${id}/cancel`); }

    listSettlements() { return this.http.get(settlementsPath); }

    markPaid(tripId, externalReference) { return this.http.post(`${settlementsPath}/${tripId}/mark-paid`, { externalReference }); }

    confirmSettlement(tripId) { return this.http.post(`${settlementsPath}/${tripId}/confirm`); }

    listCompensations() { return this.http.get(compensationsPath); }

    /** @param {'confirm-paid'|'waive'|'dispute'} action */
    updateCompensation(tripId, action) { return this.http.post(`${compensationsPath}/${tripId}/${action}`); }
}

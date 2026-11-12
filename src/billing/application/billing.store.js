import {reactive} from "vue";
import {BillingApi} from "../infrastructure/billing-api.js";
import {CancellationCompensation, FreightSettlement, Plan, Subscription} from "../domain/model/billing.entities.js";

const api = new BillingApi();

const state = reactive({
    plans: [],
    subscriptions: [],
    settlements: [],
    compensations: []
});

const replaceById = (list, item, key) => list.map(current => key(current) === key(item) ? item : current);
const byTrip = item => item.trip.id;

async function fetchPlans() {
    state.plans = (await api.listPlans()).data.map(resource => new Plan(resource));
}

async function fetchSubscriptions() {
    state.subscriptions = (await api.listSubscriptions()).data.map(resource => new Subscription(resource));
}

async function subscribe(plan, vehicleIds) {
    if (!plan.acceptsVehicleCount(vehicleIds.length)) throw new Error('validation.plan-vehicle-count');
    const subscription = new Subscription((await api.subscribe(plan.code, vehicleIds)).data);
    state.subscriptions.unshift(subscription);
    return subscription;
}

async function renew(subscription) {
    const updated = new Subscription((await api.renew(subscription.id)).data);
    state.subscriptions = replaceById(state.subscriptions, updated, item => item.id);
}

async function cancelSubscription(subscription) {
    const updated = new Subscription((await api.cancelSubscription(subscription.id)).data);
    state.subscriptions = replaceById(state.subscriptions, updated, item => item.id);
}

async function fetchSettlements() {
    const [settlements, compensations] = await Promise.all([api.listSettlements(), api.listCompensations()]);
    state.settlements = settlements.data.map(resource => new FreightSettlement(resource));
    state.compensations = compensations.data.map(resource => new CancellationCompensation(resource));
}

async function markPaid(settlement, externalReference) {
    const updated = new FreightSettlement((await api.markPaid(settlement.trip.id, (externalReference ?? '').trim() || null)).data);
    state.settlements = replaceById(state.settlements, updated, byTrip);
}

async function confirmSettlement(settlement) {
    const updated = new FreightSettlement((await api.confirmSettlement(settlement.trip.id)).data);
    state.settlements = replaceById(state.settlements, updated, byTrip);
}

async function updateCompensation(compensation, action) {
    const updated = new CancellationCompensation((await api.updateCompensation(compensation.trip.id, action)).data);
    state.compensations = replaceById(state.compensations, updated, byTrip);
}

const billingStore = {
    state, fetchPlans, fetchSubscriptions, subscribe, renew, cancelSubscription,
    fetchSettlements, markPaid, confirmSettlement, updateCompensation
};

const useBillingStore = () => billingStore;

export default useBillingStore;

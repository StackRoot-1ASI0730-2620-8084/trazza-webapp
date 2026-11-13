import {computed, reactive} from "vue";
import {ExecutionApi} from "../infrastructure/execution-api.js";
import {DeviationAlert, Incident, IotDevice, TrackingPoint, Trip} from "../domain/model/execution.entities.js";

const api = new ExecutionApi();

/**
 * Reactive state of the Service Execution &amp; Monitoring bounded context.
 */
const state = reactive({
    trips: [],
    iotDevices: [],
    loaded: false
});

const activeTrips = computed(() => state.trips.filter(trip => trip.isActive));
const openAlerts = computed(() => state.trips.reduce((total, trip) => total + (trip.openAlerts ?? 0), 0));

const replace = trip => {
    state.trips = state.trips.some(item => item.id === trip.id)
        ? state.trips.map(item => item.id === trip.id ? trip : item)
        : [trip, ...state.trips];
    return trip;
};

async function fetchTrips() {
    state.trips = (await api.listTrips()).data.map(resource => new Trip(resource));
    state.loaded = true;
}

async function getTrip(id) {
    return replace(new Trip((await api.getTrip(id)).data));
}

async function getHistory(id) {
    return (await api.getHistory(id)).data;
}

async function assignDriver(trip, driverId) {
    return replace(new Trip((await api.assignDriver(trip.id, driverId)).data));
}

/**
 * Moves a trip forward.
 * @param {Trip} trip - Trip.
 * @param {'pick-up'|'deliver'|'confirm'} action - Action allowed for the role.
 */
async function runAction(trip, action) {
    return replace(new Trip((await api.runAction(trip.id, action)).data));
}

async function cancelTrip(trip, reason) {
    return replace(new Trip((await api.cancel(trip.id, reason)).data));
}

async function listTrackingPoints(tripId) {
    return (await api.listTrackingPoints(tripId)).data.map(resource => new TrackingPoint(resource));
}

/**
 * Sends the current position of the carrier's phone.
 * @returns {Promise<{point: TrackingPoint, alert: ?DeviationAlert, tripStatus: string}>}
 */
async function recordTrackingPoint(tripId, { latitude, longitude, speedKmh = null }) {
    const { data } = await api.recordTrackingPoint(tripId, { latitude, longitude, speedKmh, source: 'PHONE' });
    return { point: new TrackingPoint(data.point), alert: data.alert ? new DeviationAlert(data.alert) : null, tripStatus: data.tripStatus };
}

async function listAlerts(tripId) {
    return (await api.listAlerts(tripId)).data.map(resource => new DeviationAlert(resource));
}

async function acknowledgeAlert(tripId, alertId) {
    await api.acknowledgeAlert(tripId, alertId);
}

async function listIncidents(tripId) {
    return (await api.listIncidents(tripId)).data.map(resource => new Incident(resource));
}

async function reportIncident(tripId, { type, description }) {
    const text = (description ?? '').trim();
    if (!Incident.TYPES.includes(type)) throw new Error('validation.incident-type');
    if (!text) throw new Error('validation.description-required');
    return new Incident((await api.reportIncident(tripId, { type, description: text })).data);
}

async function addEvidence(tripId, incidentId, s3Key) {
    if (!(s3Key ?? '').trim()) throw new Error('validation.evidence-required');
    return (await api.addEvidence(tripId, incidentId, s3Key.trim())).data;
}

async function resolveIncident(tripId, incidentId, resolution) {
    if (!(resolution ?? '').trim()) throw new Error('validation.resolution-required');
    return new Incident((await api.resolveIncident(tripId, incidentId, resolution.trim())).data);
}

async function fetchIotDevices() {
    state.iotDevices = (await api.listIotDevices()).data.map(resource => new IotDevice(resource));
}

const executionStore = {
    state, activeTrips, openAlerts, fetchTrips, getTrip, getHistory, assignDriver, runAction, cancelTrip,
    listTrackingPoints, recordTrackingPoint, listAlerts, acknowledgeAlert, listIncidents, reportIncident,
    addEvidence, resolveIncident, fetchIotDevices
};

/** @returns {typeof executionStore} Application service store of Execution. */
const useExecutionStore = () => executionStore;

export default useExecutionStore;

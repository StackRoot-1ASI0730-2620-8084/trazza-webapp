import {BaseApi} from "../../shared/infrastructure/base-api.js";

const tripsPath = import.meta.env.VITE_TRIPS_ENDPOINT_PATH ?? '/trips';
const iotDevicesPath = import.meta.env.VITE_IOT_DEVICES_ENDPOINT_PATH ?? '/iot-devices';

/**
 * Gateway to the Service Execution &amp; Monitoring bounded context.
 * @class ExecutionApi
 */
export class ExecutionApi extends BaseApi {
    listTrips() { return this.http.get(tripsPath); }

    getTrip(id) { return this.http.get(`${tripsPath}/${id}`); }

    getHistory(id) { return this.http.get(`${tripsPath}/${id}/status-history`); }

    assignDriver(id, driverId) { return this.http.put(`${tripsPath}/${id}/driver`, { driverId }); }

    runAction(id, action) { return this.http.post(`${tripsPath}/${id}/${action}`); }

    cancel(id, reason) { return this.http.post(`${tripsPath}/${id}/cancel`, { reason }); }

    listTrackingPoints(id) { return this.http.get(`${tripsPath}/${id}/tracking-points`); }

    recordTrackingPoint(id, point) { return this.http.post(`${tripsPath}/${id}/tracking-points`, point); }

    listAlerts(id) { return this.http.get(`${tripsPath}/${id}/deviation-alerts`); }

    acknowledgeAlert(id, alertId) { return this.http.post(`${tripsPath}/${id}/deviation-alerts/${alertId}/acknowledge`); }

    listIncidents(id) { return this.http.get(`${tripsPath}/${id}/incidents`); }

    reportIncident(id, resource) { return this.http.post(`${tripsPath}/${id}/incidents`, resource); }

    addEvidence(id, incidentId, s3Key) { return this.http.post(`${tripsPath}/${id}/incidents/${incidentId}/evidences`, { s3Key }); }

    resolveIncident(id, incidentId, resolution) { return this.http.post(`${tripsPath}/${id}/incidents/${incidentId}/resolve`, { resolution }); }

    listIotDevices() { return this.http.get(iotDevicesPath); }
}

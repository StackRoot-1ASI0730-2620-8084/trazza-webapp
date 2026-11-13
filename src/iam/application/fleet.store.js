import {computed, reactive} from "vue";
import {BaseApi} from "../../shared/infrastructure/base-api.js";

// Provisional fleet store until the IAM fleet module is pushed; it only reads the carrier vehicles.
const vehiclesEndpointPath = import.meta.env.VITE_VEHICLES_ENDPOINT_PATH ?? '/vehicles';

class FleetApi extends BaseApi {
    getVehicles() { return this.http.get(vehiclesEndpointPath); }
}

const api = new FleetApi();

/**
 * Reactive state of the signed-in carrier fleet.
 *
 * @type {{vehicles: Object[], errors: Error[]}}
 */
const state = reactive({
    vehicles: [],
    errors: []
});

const toVehicle = resource => ({
    id: resource.id,
    plate: resource.plate,
    model: resource.model,
    active: resource.isActive,
    label: `${resource.model} · ${resource.plate}`
});

/** @type {import('vue').ComputedRef<Object[]>} Vehicles that can be subscribed to a plan. */
const activeVehicles = computed(() => state.vehicles.filter(vehicle => vehicle.active));

/**
 * Loads the vehicles of the signed-in carrier. Users without a fleet get an empty list.
 *
 * @returns {Promise<void>}
 */
async function fetchFleet() {
    try {
        state.vehicles = (await api.getVehicles()).data.map(toVehicle);
    } catch (error) {
        state.vehicles = [];
        state.errors.push(error);
    }
}

const fleetStore = {state, activeVehicles, fetchFleet};

const useFleetStore = () => fleetStore;

export default useFleetStore;

import {computed, reactive} from "vue";
import {IamApi} from "../infrastructure/iam-api.js";
import {IamAssembler} from "../infrastructure/iam.assembler.js";

const iamApi = new IamApi();

/**
 * Reactive state of the carrier's fleet (trucks and drivers) and of the user's saved addresses.
 */
const state = reactive({
    vehicles: [],
    drivers: [],
    savedAddresses: [],
    loaded: false
});

const activeVehicles = computed(() => state.vehicles.filter(vehicle => vehicle.isActive));
const activeDrivers = computed(() => state.drivers.filter(driver => driver.isActive));

async function fetchFleet() {
    const [vehicles, drivers] = await Promise.all([iamApi.vehicles.getAll(), iamApi.drivers.getAll()]);
    state.vehicles = vehicles.data.map(IamAssembler.toVehicle);
    state.drivers = drivers.data.map(IamAssembler.toDriver);
    state.loaded = true;
}

async function fetchSavedAddresses() {
    state.savedAddresses = (await iamApi.savedAddresses.getAll()).data.map(IamAssembler.toSavedAddress);
}

const findVehicle = id => state.vehicles.find(vehicle => vehicle.id === id) ?? null;

async function saveVehicle(vehicle) {
    const resource = IamAssembler.toVehicleResource(vehicle);
    const response = vehicle.id ? await iamApi.vehicles.update(vehicle.id, resource) : await iamApi.vehicles.create(resource);
    await fetchFleet();
    return IamAssembler.toVehicle(response.data);
}

async function deactivateVehicle(vehicle) {
    await iamApi.vehicles.delete(vehicle.id);
    await fetchFleet();
}

async function saveDriver(driver) {
    const resource = IamAssembler.toDriverResource(driver);
    if (driver.id) await iamApi.drivers.update(driver.id, resource);
    else await iamApi.drivers.create(resource);
    await fetchFleet();
}

async function deactivateDriver(driver) {
    await iamApi.drivers.delete(driver.id);
    await fetchFleet();
}

async function createSavedAddress({ label, address, district, latitude, longitude }) {
    await iamApi.savedAddresses.create({ label, address, district: district || null, latitude, longitude });
    await fetchSavedAddresses();
}

async function deleteSavedAddress(savedAddress) {
    await iamApi.savedAddresses.delete(savedAddress.id);
    await fetchSavedAddresses();
}

const fleetStore = {
    state, activeVehicles, activeDrivers, fetchFleet, fetchSavedAddresses, findVehicle, saveVehicle, deactivateVehicle,
    saveDriver, deactivateDriver, createSavedAddress, deleteSavedAddress
};

/** @returns {typeof fleetStore} Application service store of the fleet and saved addresses. */
const useFleetStore = () => fleetStore;

export default useFleetStore;

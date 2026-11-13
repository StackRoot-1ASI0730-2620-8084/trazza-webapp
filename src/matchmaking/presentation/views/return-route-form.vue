<script setup>
import {computed, onMounted, reactive} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import useFleetStore from "../../../iam/application/fleet.store.js";
import {CreateReturnRouteCommand} from "../../domain/commands/matchmaking.commands.js";
import PlaceField from "../../../shared/presentation/components/place-field.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";

const { t } = useI18n();
const router = useRouter();
const store = useMatchmakingStore();
const fleet = useFleetStore();
const { showError, showSuccess } = useErrorHandler();

const form = reactive({
  vehicleId: null, driverId: null, departureAt: null, maxShipments: 2,
  origin: { address: '', latitude: null, longitude: null },
  destination: { address: '', latitude: null, longitude: null }
});
const vehicleOptions = computed(() => fleet.activeVehicles.value.map(vehicle => ({ id: vehicle.id, label: vehicle.label })));
const driverOptions = computed(() => [{ id: null, fullName: t('return-route.no-driver') }, ...fleet.activeDrivers.value]);
const slotOptions = [1, 2];

onMounted(() => Promise.all([fleet.fetchFleet(), fleet.fetchSavedAddresses()]).catch(showError));

const submit = async () => {
  try {
    const route = await store.createRoute(new CreateReturnRouteCommand(form));
    showSuccess('return-route.published');
    await router.push({ name: 'matchmaking-route-suggestions', params: { id: route.id } });
  } catch (error) {
    showError(error);
  }
};
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('return-route.new-title') }}</h1>
      <p>{{ t('return-route.new-subtitle') }}</p>
    </div>
    <pv-message v-if="fleet.state.loaded && !vehicleOptions.length" severity="warn" class="mb-3">
      {{ t('return-route.no-vehicles') }}
      <router-link :to="{ name: 'iam-vehicles' }" class="font-semibold ml-1">{{ t('option.vehicles') }}</router-link>
    </pv-message>
    <form class="trazza-panel grid" @submit.prevent="submit">
      <div class="col-12 md:col-6 flex flex-column gap-1">
        <label for="route-vehicle" class="trazza-label">{{ t('fields.vehicle') }}</label>
        <pv-select input-id="route-vehicle" v-model="form.vehicleId" :options="vehicleOptions" option-label="label" option-value="id"/>
      </div>
      <div class="col-12 md:col-6 flex flex-column gap-1">
        <label for="route-driver" class="trazza-label">{{ t('fields.driver') }}</label>
        <pv-select input-id="route-driver" v-model="form.driverId" :options="driverOptions" option-label="fullName" option-value="id"/>
      </div>
      <div class="col-12 md:col-6 flex flex-column gap-1">
        <label for="route-departure" class="trazza-label">{{ t('fields.departure') }}</label>
        <pv-date-picker input-id="route-departure" v-model="form.departureAt" show-time hour-format="24" :min-date="new Date()" fluid/>
      </div>
      <div class="col-12 md:col-6 flex flex-column gap-1">
        <span class="trazza-label">{{ t('fields.max-shipments') }}</span>
        <pv-select-button v-model="form.maxShipments" :options="slotOptions" :allow-empty="false"/>
        <small class="trazza-muted">{{ t('return-route.max-shipments-hint') }}</small>
      </div>
      <div class="col-12 lg:col-6">
        <place-field v-model="form.origin" :label="t('fields.origin')" input-id="route-origin" :saved-addresses="fleet.state.savedAddresses"/>
      </div>
      <div class="col-12 lg:col-6">
        <place-field v-model="form.destination" :label="t('fields.destination')" input-id="route-destination" :saved-addresses="fleet.state.savedAddresses"/>
      </div>
      <div class="col-12 flex justify-content-end gap-2">
        <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="router.back()"/>
        <pv-button type="submit" :label="t('return-route.publish')" icon="pi pi-check"/>
      </div>
    </form>
  </div>
</template>

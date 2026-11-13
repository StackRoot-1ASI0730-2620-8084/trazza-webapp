<script setup>
import {onMounted, reactive} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import useFleetStore from "../../../iam/application/fleet.store.js";
import {CreateShipmentRequestCommand} from "../../domain/commands/matchmaking.commands.js";
import MapPicker from "../../../shared/presentation/components/map-picker.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";

const { t } = useI18n();
const router = useRouter();
const store = useMatchmakingStore();
const fleet = useFleetStore();
const { showError, showSuccess } = useErrorHandler();

const form = reactive({
  description: '', weightKg: null, volumeM3: null, pickupFrom: null, pickupUntil: null,
  pickup: { address: '', latitude: null, longitude: null },
  delivery: { address: '', latitude: null, longitude: null }
});

onMounted(() => fleet.fetchSavedAddresses().catch(showError));

const submit = async () => {
  try {
    await store.createShipment(new CreateShipmentRequestCommand(form));
    showSuccess('shipment.published');
    await router.push({ name: 'matchmaking-shipment-requests' });
  } catch (error) {
    showError(error);
  }
};
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('shipment.new-title') }}</h1>
      <p>{{ t('shipment.new-subtitle') }}</p>
    </div>
    <form class="trazza-panel grid" @submit.prevent="submit">
      <div class="col-12 flex flex-column gap-1">
        <label for="shipment-description" class="trazza-label">{{ t('fields.description') }}</label>
        <pv-input-text id="shipment-description" v-model="form.description" maxlength="255"/>
      </div>
      <div class="col-12 md:col-6 flex flex-column gap-1">
        <label for="shipment-weight" class="trazza-label">{{ t('fields.weight-kg') }}</label>
        <pv-input-number input-id="shipment-weight" v-model="form.weightKg" :min="0" :max-fraction-digits="2" suffix=" kg" fluid/>
      </div>
      <div class="col-12 md:col-6 flex flex-column gap-1">
        <label for="shipment-volume" class="trazza-label">{{ t('fields.volume-m3') }}</label>
        <pv-input-number input-id="shipment-volume" v-model="form.volumeM3" :min="0" :max-fraction-digits="3" suffix=" m³" fluid/>
      </div>
      <div class="col-12 md:col-6 flex flex-column gap-1">
        <label for="shipment-from" class="trazza-label">{{ t('fields.pickup-from') }}</label>
        <pv-date-picker input-id="shipment-from" v-model="form.pickupFrom" show-time hour-format="24" :min-date="new Date()" fluid/>
      </div>
      <div class="col-12 md:col-6 flex flex-column gap-1">
        <label for="shipment-until" class="trazza-label">{{ t('fields.pickup-until') }}</label>
        <pv-date-picker input-id="shipment-until" v-model="form.pickupUntil" show-time hour-format="24" :min-date="form.pickupFrom ?? new Date()" fluid/>
      </div>
      <div class="col-12 lg:col-6">
        <map-picker v-model="form.pickup" :label="t('fields.pickup')" input-id="shipment-pickup" :saved-addresses="fleet.state.savedAddresses"/>
      </div>
      <div class="col-12 lg:col-6">
        <map-picker v-model="form.delivery" :label="t('fields.delivery')" input-id="shipment-delivery" :saved-addresses="fleet.state.savedAddresses"/>
      </div>
      <div class="col-12 flex justify-content-end gap-2">
        <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="router.back()"/>
        <pv-button type="submit" :label="t('shipment.publish')" icon="pi pi-check"/>
      </div>
    </form>
  </div>
</template>

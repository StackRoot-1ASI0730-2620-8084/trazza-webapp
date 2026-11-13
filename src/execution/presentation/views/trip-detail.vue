<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import {useConfirm} from "primevue";
import useExecutionStore from "../../application/execution.store.js";
import useFleetStore from "../../../iam/application/fleet.store.js";
import useReputationStore from "../../../reputation/application/reputation.store.js";
import RouteMap from "../../../shared/presentation/components/route-map.vue";
import IncidentPanel from "../components/incident-panel.vue";
import RatingDialog from "../../../reputation/presentation/components/rating-dialog.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDateTime, formatMoney, formatNumber, statusKey, statusSeverity} from "../../../shared/presentation/formatters.js";

const POLL_MS = 15000;
const { t, locale } = useI18n();
const currentRoute = useRoute();
const confirm = useConfirm();
const store = useExecutionStore();
const fleet = useFleetStore();
const reputation = useReputationStore();
const { showError, showSuccess } = useErrorHandler();

const trip = ref(null);
const track = ref([]);
const alerts = ref([]);
const history = ref([]);
const busy = ref(false);
const sharing = ref(false);
const cancelVisible = ref(false);
const cancelReason = ref('');
const ratingVisible = ref(false);
let pollTimer = null;
let watchId = null;

const tripId = computed(() => currentRoute.params.id);
const stops = computed(() => trip.value ? [
  { label: t('fields.origin'), ...trip.value.origin, color: '#64748b' },
  { label: t('fields.pickup'), ...trip.value.pickup, color: '#0037b0' },
  { label: t('fields.delivery'), ...trip.value.delivery, color: '#16a34a' },
  { label: t('fields.destination'), ...trip.value.destination, color: '#64748b' }
] : []);
const openAlerts = computed(() => alerts.value.filter(alert => alert.isOpen));
const canRate = computed(() => trip.value?.status === 'CONFIRMED' && !reputation.hasRated(trip.value.id));
const driverOptions = computed(() => fleet.activeDrivers.value);
const lostProfitWarning = computed(() => trip.value?.isMerchant && new Date(trip.value.departureAt) <= new Date());

const load = async () => {
  try {
    const [loaded, points, alertList, changes] = await Promise.all([
      store.getTrip(tripId.value), store.listTrackingPoints(tripId.value), store.listAlerts(tripId.value), store.getHistory(tripId.value)
    ]);
    trip.value = loaded;
    track.value = points;
    alerts.value = alertList;
    history.value = changes;
  } catch (error) {
    showError(error);
  }
};

const run = async (action) => {
  busy.value = true;
  try {
    trip.value = await store.runAction(trip.value, action);
    showSuccess(`trip.done.${action}`);
    if (action === 'confirm') await reputation.fetchLoyalty().catch(() => {});
    await load();
  } catch (error) {
    showError(error);
  } finally {
    busy.value = false;
  }
};

const ask = action => confirm.require({
  message: t(`trip.confirm.${action}`),
  header: t(`trip.actions.${action}`),
  icon: 'pi pi-question-circle',
  rejectProps: { label: t('actions.back'), severity: 'secondary', outlined: true },
  acceptProps: { label: t(`trip.actions.${action}`) },
  accept: () => run(action)
});

const cancel = async () => {
  try {
    if (!cancelReason.value.trim()) throw new Error('validation.reason-required');
    trip.value = await store.cancelTrip(trip.value, cancelReason.value.trim());
    cancelVisible.value = false;
    showSuccess('trip.done.cancel');
    await load();
  } catch (error) {
    showError(error);
  }
};

const assignDriver = async (driverId) => {
  try {
    trip.value = await store.assignDriver(trip.value, driverId);
    showSuccess('trip.driver-assigned');
  } catch (error) {
    showError(error);
  }
};

const acknowledge = async (alert) => {
  try {
    await store.acknowledgeAlert(trip.value.id, alert.id);
    await load();
  } catch (error) {
    showError(error);
  }
};

/** Sends the phone position every time the browser reports a new one (carrier only). */
const toggleSharing = () => {
  if (sharing.value) return stopSharing();
  if (!navigator.geolocation) return showError(new Error('errors.geolocation-unavailable'));
  sharing.value = true;
  watchId = navigator.geolocation.watchPosition(async ({ coords }) => {
    try {
      const result = await store.recordTrackingPoint(trip.value.id, {
        latitude: coords.latitude, longitude: coords.longitude,
        speedKmh: coords.speed === null ? null : Math.round(coords.speed * 3.6 * 10) / 10
      });
      track.value = [...track.value, result.point];
      if (result.alert) alerts.value = [result.alert, ...alerts.value];
    } catch (error) {
      showError(error);
      stopSharing();
    }
  }, () => {
    showError(new Error('errors.geolocation-denied'));
    stopSharing();
  }, { enableHighAccuracy: true, maximumAge: 10000 });
};

const stopSharing = () => {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  sharing.value = false;
};

onMounted(async () => {
  await load();
  if (trip.value?.isCarrier) fleet.fetchFleet().catch(showError);
  reputation.fetchRatings().catch(() => {});
  pollTimer = setInterval(() => { if (trip.value?.isActive && !document.hidden) load(); }, POLL_MS);
});

onBeforeUnmount(() => {
  clearInterval(pollTimer);
  stopSharing();
});
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('trip.detail-title') }}</h1>
    </div>
    <div v-if="trip" class="grid">
      <div class="col-12 lg:col-8 flex flex-column gap-3">
        <pv-message v-for="alert in openAlerts" :key="alert.id" severity="error">
          <div class="flex flex-wrap justify-content-between align-items-center gap-2 w-full">
            <span>{{ t('trip.deviation', { km: formatNumber(alert.deviationKm), time: formatDateTime(alert.detectedAt, locale) }) }}</span>
            <pv-button :label="t('trip.acknowledge')" size="small" severity="danger" outlined @click="acknowledge(alert)"/>
          </div>
        </pv-message>
        <div class="trazza-panel"><route-map :stops="stops" :track="track" :alerts="alerts" height="24rem"/></div>
        <div class="trazza-panel">
          <h3 class="mt-0">{{ t('trip.history') }}</h3>
          <pv-timeline :value="history">
            <template #content="{ item }">
              <span class="font-semibold">{{ t(`statuses.${statusKey(item.toStatus)}`) }}</span>
              <span class="text-sm trazza-muted ml-2">{{ formatDateTime(item.changedAt, locale) }}</span>
            </template>
          </pv-timeline>
        </div>
      </div>
      <div class="col-12 lg:col-4 flex flex-column gap-3">
        <div class="trazza-panel flex flex-column gap-2">
          <div class="flex justify-content-between align-items-center gap-2">
            <span class="text-2xl font-bold">{{ formatMoney(trip.agreedRate, trip.currency) }}</span>
            <pv-tag :value="t(`statuses.${statusKey(trip.status)}`)" :severity="statusSeverity(trip.status)"/>
          </div>
          <div class="trazza-route">{{ trip.label }}</div>
          <div class="text-sm trazza-muted">{{ trip.description }} · {{ formatNumber(trip.weightKg) }} kg · {{ formatNumber(trip.volumeM3) }} m³</div>
          <div class="text-sm">{{ t('columns.departure') }}: {{ formatDateTime(trip.departureAt, locale) }}</div>
          <div class="text-sm">{{ t('fields.vehicle') }}: {{ trip.vehicle.plate }}</div>
          <div class="text-sm">
            <span class="trazza-label">{{ trip.isCarrier ? t('roles.merchant') : t('roles.carrier') }}:</span> {{ trip.counterpart.name }}
            <template v-if="trip.counterpart.phone"> · <i class="pi pi-phone text-xs"></i> {{ trip.counterpart.phone }}</template>
          </div>
          <div class="flex flex-column gap-1">
            <span class="trazza-label">{{ t('fields.driver') }}</span>
            <pv-select v-if="trip.isCarrier && trip.status === 'SCHEDULED'" :model-value="trip.driverId" :options="driverOptions"
                       option-label="fullName" option-value="id" :placeholder="t('return-route.no-driver')" @update:model-value="assignDriver"/>
            <span v-else class="text-sm">{{ trip.driverName ?? t('return-route.no-driver') }}</span>
          </div>
          <div v-if="trip.totalDistanceKm" class="text-sm">{{ t('trip.distance') }}: {{ formatNumber(trip.totalDistanceKm) }} km</div>
          <div v-if="trip.cancellationReason" class="text-sm"><span class="trazza-label">{{ t('fields.reason') }}:</span> {{ trip.cancellationReason }}</div>

          <div class="flex flex-column gap-2 mt-2">
            <pv-button v-if="trip.canPickUp" :label="t('trip.actions.pick-up')" icon="pi pi-box" :loading="busy" @click="ask('pick-up')"/>
            <pv-button v-if="trip.canTrack" :label="sharing ? t('trip.stop-sharing') : t('trip.share-location')"
                       :icon="sharing ? 'pi pi-pause' : 'pi pi-map-marker'" :severity="sharing ? 'warn' : 'info'" outlined @click="toggleSharing"/>
            <pv-button v-if="trip.canDeliver" :label="t('trip.actions.deliver')" icon="pi pi-check" :loading="busy" @click="ask('deliver')"/>
            <pv-button v-if="trip.canConfirm" :label="t('trip.actions.confirm')" icon="pi pi-verified" severity="success" :loading="busy" @click="ask('confirm')"/>
            <pv-button v-if="canRate" :label="t('rating.rate', { name: trip.counterpart.name })" icon="pi pi-star" outlined @click="ratingVisible = true"/>
            <pv-button v-if="trip.status !== 'SCHEDULED' && trip.status !== 'CANCELLED'" :label="t('option.settlements')" icon="pi pi-wallet" text
                       @click="$router.push({ name: 'billing-settlements' })"/>
            <pv-button v-if="trip.canCancel" :label="t('trip.actions.cancel')" icon="pi pi-times" severity="danger" text @click="cancelVisible = true"/>
          </div>
        </div>
        <incident-panel :trip-id="trip.id" :can-report="trip.status !== 'SCHEDULED' && trip.status !== 'CANCELLED'"/>
      </div>
    </div>

    <pv-dialog v-model:visible="cancelVisible" modal :header="t('trip.actions.cancel')" :style="{ width: '28rem' }">
      <pv-message v-if="lostProfitWarning" severity="warn" class="mb-3">{{ t('trip.lost-profit-warning') }}</pv-message>
      <label for="trip-cancel-reason" class="trazza-label">{{ t('fields.reason') }}</label>
      <pv-textarea id="trip-cancel-reason" v-model="cancelReason" rows="3" class="w-full mt-1" maxlength="255"/>
      <template #footer>
        <pv-button :label="t('actions.back')" severity="secondary" outlined @click="cancelVisible = false"/>
        <pv-button :label="t('trip.actions.cancel')" severity="danger" @click="cancel"/>
      </template>
    </pv-dialog>

    <rating-dialog v-if="trip" v-model:visible="ratingVisible" :trip-id="trip.id" :counterpart-name="trip.counterpart.name"/>
  </div>
</template>

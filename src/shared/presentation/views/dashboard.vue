<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useIamStore from "../../../iam/application/iam.store.js";
import useMatchmakingStore from "../../../matchmaking/application/matchmaking.store.js";
import useExecutionStore from "../../../execution/application/execution.store.js";
import useReputationStore from "../../../reputation/application/reputation.store.js";
import {formatDateTime, formatNumber, statusKey, statusSeverity} from "../formatters.js";

const { t, locale } = useI18n();
const router = useRouter();
const iamStore = useIamStore();
const matchmakingStore = useMatchmakingStore();
const executionStore = useExecutionStore();
const reputationStore = useReputationStore();

const isCarrier = computed(() => iamStore.isCarrier.value);
const firstName = computed(() => (iamStore.state.currentUser?.fullName ?? '').split(' ')[0]);
const greetingKey = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'dashboard.good-morning';
  if (hour < 19) return 'dashboard.good-afternoon';
  return 'dashboard.good-evening';
});
const reputation = computed(() => ({ average: reputationStore.averageScore.value, count: reputationStore.state.received.length }));
const month = new Date().toLocaleDateString('en-CA').slice(0, 7);
const tripsThisMonth = computed(() => executionStore.state.trips.filter(trip => String(trip.createdAt ?? '').slice(0, 7) === month).length);
const activeTrip = computed(() => executionStore.activeTrips.value[0] ?? null);
const openRoutes = computed(() => matchmakingStore.openRoutes.value);
const nextRoute = computed(() => [...openRoutes.value].sort((a, b) => String(a.departureAt).localeCompare(String(b.departureAt)))[0] ?? null);
const openRequests = computed(() => matchmakingStore.state.myShipments.filter(shipment => shipment.isOpen));
const topShipments = computed(() => matchmakingStore.state.openShipments.slice(0, 3));

const carrierKpis = computed(() => [
  { label: 'dashboard.active-routes', value: openRoutes.value.length, hint: nextRoute.value ? formatDateTime(nextRoute.value.departureAt, locale.value) : '—' },
  { label: 'dashboard.pending-offers', value: matchmakingStore.pendingProposals.value.length, hint: t('dashboard.waiting-for-you') },
  { label: 'dashboard.trips-month', value: tripsThisMonth.value, hint: t('dashboard.this-month') },
  { label: 'dashboard.your-rating', value: reputation.value.count ? `${formatNumber(reputation.value.average)} ★` : '—', hint: t('reputation.based-on', { count: reputation.value.count }) }
]);

const merchantKpis = computed(() => [
  { label: 'dashboard.in-transit', value: executionStore.activeTrips.value.length, hint: activeTrip.value ? formatDateTime(activeTrip.value.departureAt, locale.value) : '—' },
  { label: 'dashboard.open-requests', value: openRequests.value.length, hint: t('dashboard.waiting-carriers') },
  { label: 'dashboard.offers-to-review', value: matchmakingStore.pendingProposals.value.length, hint: t('dashboard.waiting-for-you') },
  { label: 'dashboard.your-rating', value: reputation.value.count ? `${formatNumber(reputation.value.average)} ★` : '—', hint: t('reputation.based-on', { count: reputation.value.count }) }
]);

const kpis = computed(() => isCarrier.value ? carrierKpis.value : merchantKpis.value);
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1>{{ t(greetingKey, { name: firstName }) }}</h1>
        <p>{{ isCarrier ? t('dashboard.carrier-subtitle') : t('dashboard.merchant-subtitle') }}</p>
      </div>
      <pv-button v-if="isCarrier" :label="t('return-route.publish')" icon="pi pi-plus" @click="router.push({ name: 'matchmaking-return-route-new' })"/>
      <pv-button v-else :label="t('shipment.publish')" icon="pi pi-plus" @click="router.push({ name: 'matchmaking-shipment-new' })"/>
    </div>
    <div class="grid">
      <div v-for="kpi in kpis" :key="kpi.label" class="col-6 lg:col-3">
        <div class="trazza-panel h-full">
          <div class="trazza-overline mb-2">{{ t(kpi.label) }}</div>
          <div class="trazza-kpi">{{ kpi.value }}</div>
          <div class="text-sm trazza-muted mt-1">{{ kpi.hint }}</div>
        </div>
      </div>
    </div>
    <div class="grid mt-2">
      <div class="col-12 lg:col-6">
        <div class="trazza-panel h-full">
          <template v-if="activeTrip">
            <div class="trazza-overline mb-2">{{ isCarrier ? t('dashboard.active-trip') : t('dashboard.shipment-in-transit') }}</div>
            <div class="trazza-route text-lg">{{ activeTrip.label }}</div>
            <div class="text-sm mb-2">{{ isCarrier ? activeTrip.merchant?.name : `${t('roles.carrier')}: ${activeTrip.carrier?.name ?? ''}` }}</div>
            <pv-tag :value="t(`statuses.${statusKey(activeTrip.status)}`)" :severity="statusSeverity(activeTrip.status)"/>
            <div class="mt-3">
              <pv-button :label="isCarrier ? t('dashboard.view-trip') : t('dashboard.track-shipment')" size="small" @click="router.push({ name: 'execution-trip-detail', params: { id: activeTrip.id } })"/>
            </div>
          </template>
          <template v-else-if="isCarrier && nextRoute">
            <div class="trazza-overline mb-2">{{ t('dashboard.next-return-trip') }}</div>
            <div class="trazza-route text-lg">{{ nextRoute.label }}</div>
            <div class="text-sm">{{ formatDateTime(nextRoute.departureAt, locale) }} · {{ formatNumber(nextRoute.availableWeightKg) }} kg {{ t('return-route.free') }}</div>
          </template>
          <template v-else>
            <div class="trazza-overline mb-2">{{ t('dashboard.getting-started') }}</div>
            <p class="m-0 trazza-muted">{{ isCarrier ? t('dashboard.carrier-empty') : t('dashboard.merchant-empty') }}</p>
          </template>
        </div>
      </div>
      <div class="col-12 lg:col-6">
        <div class="trazza-panel h-full">
          <template v-if="isCarrier">
            <div class="trazza-overline mb-2">{{ t('dashboard.new-suggestions') }}</div>
            <p v-if="!topShipments.length" class="m-0 trazza-muted">{{ t('open-shipments.empty') }}</p>
            <div v-for="shipment in topShipments" :key="shipment.id" class="flex justify-content-between align-items-center py-2 border-bottom-1 surface-border cursor-pointer"
                 @click="router.push({ name: 'matchmaking-open-shipments' })">
              <div>
                <div class="font-semibold">{{ shipment.label }}</div>
                <div class="text-sm trazza-muted">{{ shipment.description }} · {{ formatNumber(shipment.weightKg) }} kg · {{ formatNumber(shipment.volumeM3) }} m³</div>
              </div>
              <i class="pi pi-angle-right"></i>
            </div>
          </template>
          <template v-else>
            <div class="trazza-overline mb-2">{{ t('dashboard.recent-requests') }}</div>
            <p v-if="!matchmakingStore.state.myShipments.length" class="m-0 trazza-muted">{{ t('shipment.empty') }}</p>
            <div v-for="shipment in matchmakingStore.state.myShipments.slice(0, 4)" :key="shipment.id" class="flex justify-content-between align-items-center py-2 border-bottom-1 surface-border">
              <div>
                <div class="font-semibold">{{ shipment.label }}</div>
                <div class="text-sm trazza-muted">{{ formatDateTime(shipment.pickupFrom, locale) }} · {{ formatNumber(shipment.weightKg) }} kg</div>
              </div>
              <pv-tag :value="t(`statuses.${statusKey(shipment.status)}`)" :severity="statusSeverity(shipment.status)"/>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

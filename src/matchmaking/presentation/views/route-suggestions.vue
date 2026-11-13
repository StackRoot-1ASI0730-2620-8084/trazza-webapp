<script setup>
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import OfferDialog from "../components/offer-dialog.vue";
import RouteMap from "../../../shared/presentation/components/route-map.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDateTime, formatNumber, statusKey, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const currentRoute = useRoute();
const store = useMatchmakingStore();
const { showError } = useErrorHandler();
const route = ref(null);
const suggestions = ref([]);
const loading = ref(true);
const offerVisible = ref(false);
const selected = ref(null);

const stops = computed(() => route.value ? [
  { label: t('fields.origin'), ...route.value.origin, color: '#0037b0' },
  { label: t('fields.destination'), ...route.value.destination, color: '#001f66' }
] : []);

const load = async () => {
  loading.value = true;
  try {
    route.value = await store.getRoute(currentRoute.params.id);
    suggestions.value = await store.suggestShipments(route.value.id);
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
};

const offer = (shipment) => {
  selected.value = shipment;
  offerVisible.value = true;
};

onMounted(load);
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('route-suggestions.title') }}</h1>
      <p>{{ t('route-suggestions.subtitle') }}</p>
    </div>
    <div v-if="route" class="grid">
      <div class="col-12 lg:col-5">
        <div class="trazza-panel flex flex-column gap-2">
          <div class="flex justify-content-between align-items-center gap-2">
            <span class="trazza-route">{{ route.label }}</span>
            <pv-tag :value="t(`statuses.${statusKey(route.status)}`)" :severity="statusSeverity(route.status)"/>
          </div>
          <div class="text-sm trazza-muted">{{ t('columns.departure') }}: {{ formatDateTime(route.departureAt, locale) }}</div>
          <div class="text-sm trazza-muted">{{ route.vehicle.plate }} · {{ route.driverName ?? t('return-route.no-driver') }}</div>
          <div class="text-sm">{{ t('columns.slots') }}: {{ route.acceptedShipments }} / {{ route.maxShipments }} ·
            {{ t('columns.free-capacity') }}: {{ formatNumber(route.availableWeightKg) }} kg, {{ formatNumber(route.availableVolumeM3) }} m³</div>
          <route-map :stops="stops" height="18rem"/>
        </div>
      </div>
      <div class="col-12 lg:col-7">
        <div class="trazza-panel p-0 overflow-hidden">
          <pv-data-table :value="suggestions" :loading="loading" data-key="id" striped-rows>
            <template #empty><div class="text-center py-4 trazza-muted">{{ route.isOpen ? t('route-suggestions.empty') : t('route-suggestions.route-not-open') }}</div></template>
            <pv-column :header="t('columns.shipment')">
              <template #body="{ data }">
                <div class="trazza-route">{{ data.label }}</div>
                <div class="text-sm trazza-muted">{{ data.description }}<template v-if="data.merchantName"> · {{ data.merchantName }}</template></div>
              </template>
            </pv-column>
            <pv-column :header="t('columns.cargo')">
              <template #body="{ data }">{{ formatNumber(data.weightKg) }} kg · {{ formatNumber(data.volumeM3) }} m³</template>
            </pv-column>
            <pv-column :header="t('shipment.pickup-window')">
              <template #body="{ data }"><span class="text-sm">{{ formatDateTime(data.pickupFrom, locale) }} – {{ formatDateTime(data.pickupUntil, locale) }}</span></template>
            </pv-column>
            <pv-column>
              <template #body="{ data }"><pv-button :label="t('offer.make')" size="small" @click="offer(data)"/></template>
            </pv-column>
          </pv-data-table>
        </div>
      </div>
    </div>
    <offer-dialog v-model:visible="offerVisible" :shipment="selected" :routes="route ? [route] : []" :route-id="route?.id" @created="load"/>
  </div>
</template>

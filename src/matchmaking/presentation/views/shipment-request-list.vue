<script setup>
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDateTime, formatNumber, statusKey, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const router = useRouter();
const store = useMatchmakingStore();
const { showError, showSuccess } = useErrorHandler();
const loading = ref(true);
const cancelVisible = ref(false);
const cancelReason = ref('');
const target = ref(null);
const suggestionsVisible = ref(false);
const suggestions = ref([]);

onMounted(() => store.fetchMerchantData().catch(showError).finally(() => { loading.value = false; }));

const askCancel = (shipment) => {
  target.value = shipment;
  cancelReason.value = '';
  cancelVisible.value = true;
};

const cancel = async () => {
  try {
    if (!cancelReason.value.trim()) throw new Error('validation.reason-required');
    await store.cancelShipment(target.value, cancelReason.value.trim());
    cancelVisible.value = false;
    showSuccess('shipment.cancelled');
  } catch (error) {
    showError(error);
  }
};

const showSuggestions = async (shipment) => {
  try {
    target.value = shipment;
    suggestions.value = await store.suggestRoutes(shipment.id);
    suggestionsVisible.value = true;
  } catch (error) {
    showError(error);
  }
};
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1>{{ t('shipment.list-title') }}</h1>
        <p>{{ t('shipment.list-subtitle') }}</p>
      </div>
      <pv-button :label="t('shipment.publish')" icon="pi pi-plus" @click="router.push({ name: 'matchmaking-shipment-new' })"/>
    </div>
    <div class="trazza-panel p-0 overflow-hidden">
      <pv-data-table :value="store.state.myShipments" :loading="loading" data-key="id" paginator :rows="8" striped-rows>
        <template #empty><div class="text-center py-4 trazza-muted">{{ t('shipment.empty') }}</div></template>
        <pv-column :header="t('columns.shipment')">
          <template #body="{ data }">
            <div class="trazza-route">{{ data.label }}</div>
            <div class="text-sm trazza-muted">{{ data.description }}</div>
          </template>
        </pv-column>
        <pv-column :header="t('columns.cargo')"><template #body="{ data }">{{ formatNumber(data.weightKg) }} kg · {{ formatNumber(data.volumeM3) }} m³</template></pv-column>
        <pv-column :header="t('shipment.pickup-window')">
          <template #body="{ data }"><span class="text-sm">{{ formatDateTime(data.pickupFrom, locale) }} – {{ formatDateTime(data.pickupUntil, locale) }}</span></template>
        </pv-column>
        <pv-column :header="t('columns.offers')"><template #body="{ data }">{{ data.pendingProposals }}</template></pv-column>
        <pv-column :header="t('columns.status')">
          <template #body="{ data }"><pv-tag :value="t(`statuses.${statusKey(data.status)}`)" :severity="statusSeverity(data.status)"/></template>
        </pv-column>
        <pv-column :header="t('columns.actions')">
          <template #body="{ data }">
            <div class="flex gap-1">
              <pv-button v-if="data.isOpen" icon="pi pi-truck" text rounded v-tooltip.top="t('shipment.view-routes')" :aria-label="t('shipment.view-routes')" @click="showSuggestions(data)"/>
              <pv-button v-if="data.pendingProposals" icon="pi pi-inbox" text rounded v-tooltip.top="t('option.proposals')" :aria-label="t('option.proposals')"
                         @click="router.push({ name: 'matchmaking-proposals' })"/>
              <pv-button v-if="data.isOpen" icon="pi pi-times-circle" text rounded severity="danger" v-tooltip.top="t('shipment.cancel')" :aria-label="t('shipment.cancel')" @click="askCancel(data)"/>
            </div>
          </template>
        </pv-column>
      </pv-data-table>
    </div>

    <pv-dialog v-model:visible="cancelVisible" modal :header="t('shipment.cancel')" :style="{ width: '28rem' }">
      <label for="cancel-reason" class="trazza-label">{{ t('fields.reason') }}</label>
      <pv-textarea id="cancel-reason" v-model="cancelReason" rows="3" class="w-full mt-1" maxlength="255"/>
      <template #footer>
        <pv-button :label="t('actions.back')" severity="secondary" outlined @click="cancelVisible = false"/>
        <pv-button :label="t('shipment.cancel')" severity="danger" @click="cancel"/>
      </template>
    </pv-dialog>

    <pv-dialog v-model:visible="suggestionsVisible" modal :header="t('shipment.compatible-routes')" :style="{ width: '40rem' }">
      <p class="text-sm trazza-muted mt-0">{{ t('shipment.compatible-routes-hint') }}</p>
      <div v-if="!suggestions.length" class="trazza-muted">{{ t('shipment.no-compatible-routes') }}</div>
      <div v-for="route in suggestions" :key="route.id" class="border-bottom-1 surface-border py-2">
        <div class="trazza-route">{{ route.label }}</div>
        <div class="text-sm trazza-muted">{{ formatDateTime(route.departureAt, locale) }} · {{ route.vehicle.plate }} ·
          {{ formatNumber(route.availableWeightKg) }} kg {{ t('return-route.free') }}</div>
      </div>
    </pv-dialog>
  </div>
</template>

<script setup>
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import OfferDialog from "../components/offer-dialog.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDateTime, formatNumber} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const store = useMatchmakingStore();
const { showError } = useErrorHandler();
const offerVisible = ref(false);
const selected = ref(null);
const loading = ref(true);

onMounted(() => store.fetchCarrierData().catch(showError).finally(() => { loading.value = false; }));

const offer = (shipment) => {
  selected.value = shipment;
  offerVisible.value = true;
};
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('open-shipments.title') }}</h1>
      <p>{{ t('open-shipments.subtitle') }}</p>
    </div>
    <pv-message v-if="!loading && !store.openRoutes.value.length" severity="info" class="mb-3">{{ t('open-shipments.need-route') }}</pv-message>
    <div class="trazza-panel p-0 overflow-hidden">
      <pv-data-table :value="store.state.openShipments" :loading="loading" data-key="id" paginator :rows="10" striped-rows>
        <template #empty><div class="text-center py-4 trazza-muted">{{ t('open-shipments.empty') }}</div></template>
        <pv-column :header="t('columns.shipment')">
          <template #body="{ data }">
            <div class="trazza-route">{{ data.label }}</div>
            <div class="text-sm trazza-muted">{{ data.description }}<template v-if="data.merchantName"> · {{ data.merchantName }}</template></div>
          </template>
        </pv-column>
        <pv-column :header="t('columns.cargo')"><template #body="{ data }">{{ formatNumber(data.weightKg) }} kg · {{ formatNumber(data.volumeM3) }} m³</template></pv-column>
        <pv-column :header="t('shipment.pickup-window')">
          <template #body="{ data }"><span class="text-sm">{{ formatDateTime(data.pickupFrom, locale) }} – {{ formatDateTime(data.pickupUntil, locale) }}</span></template>
        </pv-column>
        <pv-column>
          <template #body="{ data }">
            <pv-button :label="t('offer.make')" size="small" :disabled="!store.openRoutes.value.length" @click="offer(data)"/>
          </template>
        </pv-column>
      </pv-data-table>
    </div>
    <offer-dialog v-model:visible="offerVisible" :shipment="selected" :routes="store.openRoutes.value"/>
  </div>
</template>

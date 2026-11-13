<script setup>
import {onMounted} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useConfirm} from "primevue";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDateTime, formatNumber, statusKey, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const store = useMatchmakingStore();
const { showError, showSuccess } = useErrorHandler();

onMounted(() => store.fetchCarrierData().catch(showError));

const cancel = (route) => confirm.require({
  message: t('return-route.confirm-cancel', { route: route.label }),
  header: t('return-route.cancel'),
  icon: 'pi pi-exclamation-triangle',
  rejectProps: { label: t('actions.back'), severity: 'secondary', outlined: true },
  acceptProps: { label: t('return-route.cancel'), severity: 'danger' },
  accept: () => store.cancelRoute(route).then(() => showSuccess('return-route.cancelled')).catch(showError)
});
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1>{{ t('return-route.list-title') }}</h1>
        <p>{{ t('return-route.list-subtitle') }}</p>
      </div>
      <pv-button :label="t('return-route.publish')" icon="pi pi-plus" @click="router.push({ name: 'matchmaking-return-route-new' })"/>
    </div>
    <div class="trazza-panel p-0 overflow-hidden">
      <pv-data-table :value="store.state.myRoutes" data-key="id" paginator :rows="8" striped-rows>
        <template #empty><div class="text-center py-4 trazza-muted">{{ t('return-route.empty') }}</div></template>
        <pv-column :header="t('columns.route')">
          <template #body="{ data }">
            <div class="trazza-route">{{ data.label }}</div>
            <div class="text-sm trazza-muted">{{ data.vehicle.plate }} · {{ data.driverName ?? t('return-route.no-driver') }}</div>
          </template>
        </pv-column>
        <pv-column :header="t('columns.departure')"><template #body="{ data }">{{ formatDateTime(data.departureAt, locale) }}</template></pv-column>
        <pv-column :header="t('columns.slots')"><template #body="{ data }">{{ data.acceptedShipments }} / {{ data.maxShipments }}</template></pv-column>
        <pv-column :header="t('columns.free-capacity')">
          <template #body="{ data }">{{ formatNumber(data.availableWeightKg) }} kg · {{ formatNumber(data.availableVolumeM3) }} m³</template>
        </pv-column>
        <pv-column :header="t('columns.status')">
          <template #body="{ data }"><pv-tag :value="t(`statuses.${statusKey(data.status)}`)" :severity="statusSeverity(data.status)"/></template>
        </pv-column>
        <pv-column :header="t('columns.actions')">
          <template #body="{ data }">
            <div class="flex gap-1">
              <pv-button icon="pi pi-box" text rounded v-tooltip.top="t('return-route.view-suggestions')" :aria-label="t('return-route.view-suggestions')"
                         @click="router.push({ name: 'matchmaking-route-suggestions', params: { id: data.id } })"/>
              <pv-button v-if="!data.isClosed && data.acceptedShipments === 0" icon="pi pi-times-circle" text rounded severity="danger"
                         v-tooltip.top="t('return-route.cancel')" :aria-label="t('return-route.cancel')" @click="cancel(data)"/>
            </div>
          </template>
        </pv-column>
      </pv-data-table>
    </div>
  </div>
</template>

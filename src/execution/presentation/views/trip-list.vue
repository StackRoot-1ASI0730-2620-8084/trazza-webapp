<script setup>
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useExecutionStore from "../../application/execution.store.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDateTime, formatMoney, statusKey, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const router = useRouter();
const store = useExecutionStore();
const { showError } = useErrorHandler();
const loading = ref(true);
const filter = ref('active');
const filters = computed(() => [
  { value: 'active', label: t('trip.filter-active') },
  { value: 'closed', label: t('trip.filter-closed') },
  { value: 'all', label: t('trip.filter-all') }
]);
const trips = computed(() => store.state.trips.filter(trip =>
    filter.value === 'all' || (filter.value === 'active' ? trip.isActive : trip.isClosed)));

onMounted(() => store.fetchTrips().catch(showError).finally(() => { loading.value = false; }));

const open = trip => router.push({ name: 'execution-trip-detail', params: { id: trip.id } });
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1>{{ t('trip.list-title') }}</h1>
        <p>{{ t('trip.list-subtitle') }}</p>
      </div>
      <pv-select-button v-model="filter" :options="filters" option-label="label" option-value="value" :allow-empty="false"/>
    </div>
    <div class="trazza-panel p-0 overflow-hidden">
      <pv-data-table :value="trips" :loading="loading" data-key="id" paginator :rows="10" striped-rows
                     selection-mode="single" @row-click="({ data }) => open(data)">
        <template #empty><div class="text-center py-4 trazza-muted">{{ t('trip.empty') }}</div></template>
        <pv-column :header="t('columns.shipment')">
          <template #body="{ data }">
            <div class="trazza-route">{{ data.label }}</div>
            <div class="text-sm trazza-muted">{{ data.description }} · {{ data.vehicle.plate }}</div>
          </template>
        </pv-column>
        <pv-column :header="t('columns.counterpart')"><template #body="{ data }">{{ data.counterpart.name }}</template></pv-column>
        <pv-column :header="t('columns.departure')"><template #body="{ data }">{{ formatDateTime(data.departureAt, locale) }}</template></pv-column>
        <pv-column :header="t('columns.rate')"><template #body="{ data }">{{ formatMoney(data.agreedRate, data.currency) }}</template></pv-column>
        <pv-column :header="t('columns.status')">
          <template #body="{ data }">
            <div class="flex align-items-center gap-2">
              <pv-tag :value="t(`statuses.${statusKey(data.status)}`)" :severity="statusSeverity(data.status)"/>
              <i v-if="data.openAlerts" class="pi pi-exclamation-triangle text-red-600" v-tooltip.top="t('trip.open-alerts', { count: data.openAlerts })"></i>
            </div>
          </template>
        </pv-column>
        <pv-column>
          <template #body="{ data }"><pv-button icon="pi pi-angle-right" text rounded :aria-label="t('actions.open')" @click.stop="open(data)"/></template>
        </pv-column>
      </pv-data-table>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useBillingStore from "../../application/billing.store.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDateTime, formatMoney, statusKey, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const router = useRouter();
const store = useBillingStore();
const { showError, showSuccess } = useErrorHandler();
const payVisible = ref(false);
const reference = ref('');
const target = ref(null);

onMounted(() => store.fetchSettlements().catch(showError));

const askPaid = settlement => {
  target.value = settlement;
  reference.value = '';
  payVisible.value = true;
};

const markPaid = async () => {
  try {
    await store.markPaid(target.value, reference.value);
    payVisible.value = false;
    showSuccess('settlement.marked-paid');
  } catch (error) {
    showError(error);
  }
};

const confirmReceived = settlement => store.confirmSettlement(settlement).then(() => showSuccess('settlement.confirmed')).catch(showError);
const compensate = (compensation, action) => store.updateCompensation(compensation, action).then(() => showSuccess(`compensation.done.${action}`)).catch(showError);
const openTrip = trip => router.push({ name: 'execution-trip-detail', params: { id: trip.id } });
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('settlement.title') }}</h1>
      <p>{{ t('settlement.subtitle') }}</p>
    </div>
    <h3>{{ t('settlement.freight') }}</h3>
    <div class="trazza-panel p-0 overflow-hidden mb-4">
      <pv-data-table :value="store.state.settlements" data-key="trip.id" paginator :rows="8" striped-rows>
        <template #empty><div class="text-center py-4 trazza-muted">{{ t('settlement.empty') }}</div></template>
        <pv-column :header="t('columns.trip')">
          <template #body="{ data }"><a class="cursor-pointer trazza-route" @click="openTrip(data.trip)">{{ data.trip.originAddress }} → {{ data.trip.destinationAddress }}</a></template>
        </pv-column>
        <pv-column :header="t('columns.amount')"><template #body="{ data }">{{ formatMoney(data.amount, data.currency) }}</template></pv-column>
        <pv-column :header="t('settlement.reference')" field="externalReference"/>
        <pv-column :header="t('columns.status')">
          <template #body="{ data }"><pv-tag :value="t(`statuses.${statusKey(data.status)}`)" :severity="statusSeverity(data.status)"/></template>
        </pv-column>
        <pv-column>
          <template #body="{ data }">
            <pv-button v-if="data.canMarkPaid" :label="t('settlement.mark-paid')" size="small" @click="askPaid(data)"/>
            <pv-button v-if="data.canConfirm" :label="t('settlement.confirm')" size="small" severity="success" @click="confirmReceived(data)"/>
            <span v-if="data.carrierConfirmedAt" class="text-xs trazza-muted">{{ formatDateTime(data.carrierConfirmedAt, locale) }}</span>
          </template>
        </pv-column>
      </pv-data-table>
    </div>

    <h3>{{ t('compensation.title') }}</h3>
    <p class="text-sm trazza-muted">{{ t('compensation.rule') }}</p>
    <div class="trazza-panel p-0 overflow-hidden">
      <pv-data-table :value="store.state.compensations" data-key="trip.id" striped-rows>
        <template #empty><div class="text-center py-4 trazza-muted">{{ t('compensation.empty') }}</div></template>
        <pv-column :header="t('columns.trip')">
          <template #body="{ data }"><a class="cursor-pointer trazza-route" @click="openTrip(data.trip)">{{ data.trip.originAddress }} → {{ data.trip.destinationAddress }}</a></template>
        </pv-column>
        <pv-column :header="t('columns.amount')"><template #body="{ data }">{{ formatMoney(data.amount, data.currency) }}</template></pv-column>
        <pv-column :header="t('columns.status')">
          <template #body="{ data }"><pv-tag :value="t(`statuses.${statusKey(data.status)}`)" :severity="statusSeverity(data.status)"/></template>
        </pv-column>
        <pv-column>
          <template #body="{ data }">
            <div class="flex gap-1">
              <pv-button v-if="data.canSettle" :label="t('compensation.confirm-paid')" size="small" severity="success" @click="compensate(data, 'confirm-paid')"/>
              <pv-button v-if="data.canSettle" :label="t('compensation.waive')" size="small" text @click="compensate(data, 'waive')"/>
              <pv-button v-if="data.canDispute" :label="t('compensation.dispute')" size="small" severity="danger" outlined @click="compensate(data, 'dispute')"/>
            </div>
          </template>
        </pv-column>
      </pv-data-table>
    </div>

    <pv-dialog v-model:visible="payVisible" modal :header="t('settlement.mark-paid')" :style="{ width: '28rem' }">
      <p class="text-sm mt-0">{{ t('settlement.external-note') }}</p>
      <label for="settlement-reference" class="trazza-label">{{ t('settlement.reference') }}</label>
      <pv-input-text id="settlement-reference" v-model="reference" class="w-full mt-1" maxlength="100"/>
      <template #footer>
        <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="payVisible = false"/>
        <pv-button :label="t('settlement.mark-paid')" @click="markPaid"/>
      </template>
    </pv-dialog>
  </div>
</template>

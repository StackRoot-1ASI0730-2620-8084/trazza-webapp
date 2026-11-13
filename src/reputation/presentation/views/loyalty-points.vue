<script setup>
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import useReputationStore from "../../application/reputation.store.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDateTime, statusKey} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const store = useReputationStore();
const { showError, showSuccess } = useErrorHandler();
const points = ref(null);

onMounted(() => store.fetchLoyalty().catch(showError));

const redeem = async () => {
  try {
    await store.redeemPoints(points.value);
    points.value = null;
    showSuccess('points.redeemed');
  } catch (error) {
    showError(error);
  }
};
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('points.title') }}</h1>
      <p>{{ t('points.subtitle') }}</p>
    </div>
    <div class="grid">
      <div class="col-12 md:col-4">
        <div class="trazza-panel flex flex-column gap-3">
          <div>
            <div class="trazza-label">{{ t('points.balance') }}</div>
            <div class="text-5xl font-bold">{{ store.state.loyalty.balance }}</div>
          </div>
          <div class="flex flex-column gap-1">
            <label for="redeem-points" class="trazza-label">{{ t('points.redeem') }}</label>
            <pv-input-number input-id="redeem-points" v-model="points" :min="1" :max="store.state.loyalty.balance || 1" fluid/>
          </div>
          <pv-button :label="t('points.redeem')" icon="pi pi-gift" :disabled="!store.state.loyalty.balance" @click="redeem"/>
          <small class="trazza-muted">{{ t('points.rules') }}</small>
        </div>
      </div>
      <div class="col-12 md:col-8">
        <div class="trazza-panel p-0 overflow-hidden">
          <pv-data-table :value="store.state.loyalty.entries" data-key="id" paginator :rows="10" striped-rows>
            <template #empty><div class="text-center py-4 trazza-muted">{{ t('points.empty') }}</div></template>
            <pv-column :header="t('columns.date')"><template #body="{ data }">{{ formatDateTime(data.createdAt, locale) }}</template></pv-column>
            <pv-column :header="t('columns.reason')"><template #body="{ data }">{{ t(`points.reasons.${statusKey(data.reason)}`) }}</template></pv-column>
            <pv-column :header="t('columns.points')">
              <template #body="{ data }"><span :class="data.points > 0 ? 'text-green-600' : 'text-red-600'" class="font-semibold">{{ data.points > 0 ? '+' : '' }}{{ data.points }}</span></template>
            </pv-column>
          </pv-data-table>
        </div>
      </div>
    </div>
  </div>
</template>
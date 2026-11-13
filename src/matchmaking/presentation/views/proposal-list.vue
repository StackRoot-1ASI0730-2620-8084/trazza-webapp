<script setup>
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDateTime, formatMoney, statusKey, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const router = useRouter();
const store = useMatchmakingStore();
const iam = useIamStore();
const { showError } = useErrorHandler();
const loading = ref(true);

onMounted(() => store.fetchProposals().catch(showError).finally(() => { loading.value = false; }));

const counterpart = proposal => iam.isCarrier.value ? proposal.merchant : proposal.carrier;
const open = proposal => router.push({ name: 'matchmaking-proposal-detail', params: { id: proposal.id } });
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('proposal.list-title') }}</h1>
      <p>{{ iam.isCarrier.value ? t('proposal.list-subtitle-carrier') : t('proposal.list-subtitle-merchant') }}</p>
    </div>
    <div class="trazza-panel p-0 overflow-hidden">
      <pv-data-table :value="store.state.proposals" :loading="loading" data-key="id" paginator :rows="10" striped-rows
                     selection-mode="single" @row-click="({ data }) => open(data)">
        <template #empty><div class="text-center py-4 trazza-muted">{{ t('proposal.empty') }}</div></template>
        <pv-column :header="t('columns.shipment')">
          <template #body="{ data }">
            <div class="trazza-route">{{ data.shipment.label }}</div>
            <div class="text-sm trazza-muted">{{ data.shipment.description }}</div>
          </template>
        </pv-column>
        <pv-column :header="iam.isCarrier.value ? t('roles.merchant') : t('roles.carrier')">
          <template #body="{ data }">{{ counterpart(data)?.name }}</template>
        </pv-column>
        <pv-column :header="t('columns.rate')"><template #body="{ data }">{{ formatMoney(data.offeredRate, data.currency) }}</template></pv-column>
        <pv-column :header="t('columns.date')"><template #body="{ data }">{{ formatDateTime(data.createdAt, locale) }}</template></pv-column>
        <pv-column :header="t('columns.status')">
          <template #body="{ data }"><pv-tag :value="t(`statuses.${statusKey(data.status)}`)" :severity="statusSeverity(data.status)"/></template>
        </pv-column>
        <pv-column>
          <template #body="{ data }"><pv-button icon="pi pi-angle-right" text rounded :aria-label="t('actions.open')" @click.stop="open(data)"/></template>
        </pv-column>
      </pv-data-table>
    </div>
  </div>
</template>

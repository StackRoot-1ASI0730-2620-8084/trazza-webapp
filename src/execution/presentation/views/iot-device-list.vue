<script setup>
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import useExecutionStore from "../../application/execution.store.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDate, statusKey, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const store = useExecutionStore();
const { showError } = useErrorHandler();
const loading = ref(true);

onMounted(() => store.fetchIotDevices().catch(showError).finally(() => { loading.value = false; }));
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('iot.title') }}</h1>
      <p>{{ t('iot.subtitle') }}</p>
    </div>
    <div class="trazza-panel p-0 overflow-hidden">
      <pv-data-table :value="store.state.iotDevices" :loading="loading" data-key="id" striped-rows>
        <template #empty>
          <div class="text-center py-4 trazza-muted">
            {{ t('iot.empty') }}
            <router-link :to="{ name: 'billing-plans' }" class="font-semibold ml-1">{{ t('option.plans') }}</router-link>
          </div>
        </template>
        <pv-column :header="t('fields.serial-number')" field="serialNumber"/>
        <pv-column :header="t('fields.vehicle')" field="vehiclePlate"/>
        <pv-column :header="t('iot.loaned-at')"><template #body="{ data }">{{ formatDate(data.loanedAt, locale) }}</template></pv-column>
        <pv-column :header="t('columns.status')">
          <template #body="{ data }"><pv-tag :value="t(`statuses.${statusKey(data.status)}`)" :severity="statusSeverity(data.status)"/></template>
        </pv-column>
      </pv-data-table>
    </div>
  </div>
</template>

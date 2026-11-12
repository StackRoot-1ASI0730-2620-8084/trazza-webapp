<script setup>
import {onMounted} from "vue";
import {useI18n} from "vue-i18n";
import {useConfirm} from "primevue";
import useBillingStore from "../../application/billing.store.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDate, formatMoney, statusKey, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const confirm = useConfirm();
const store = useBillingStore();
const { showError, showSuccess } = useErrorHandler();

onMounted(() => store.fetchSubscriptions().catch(showError));

const renew = subscription => store.renew(subscription).then(() => showSuccess('subscription.renewed')).catch(showError);

const cancel = subscription => confirm.require({
  message: t('subscription.confirm-cancel'),
  header: t('subscription.cancel'),
  icon: 'pi pi-exclamation-triangle',
  rejectProps: { label: t('actions.back'), severity: 'secondary', outlined: true },
  acceptProps: { label: t('subscription.cancel'), severity: 'danger' },
  accept: () => store.cancelSubscription(subscription).then(() => showSuccess('subscription.cancelled')).catch(showError)
});
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('subscription.title') }}</h1>
      <p>{{ t('subscription.subtitle') }}</p>
    </div>
    <div v-if="!store.state.subscriptions.length" class="trazza-panel trazza-muted">
      {{ t('subscription.empty') }} <router-link :to="{ name: 'billing-plans' }" class="font-semibold">{{ t('option.plans') }}</router-link>
    </div>
    <div v-for="subscription in store.state.subscriptions" :key="subscription.id" class="trazza-panel mb-3 flex flex-column gap-2">
      <div class="flex flex-wrap justify-content-between align-items-center gap-2">
        <h3 class="m-0">{{ subscription.plan.name }}</h3>
        <pv-tag :value="t(`statuses.${statusKey(subscription.status)}`)" :severity="statusSeverity(subscription.status)"/>
      </div>
      <div class="text-sm">{{ t('subscription.period') }}: {{ formatDate(subscription.currentPeriodStart, locale) }} – {{ formatDate(subscription.currentPeriodEnd, locale) }}</div>
      <div class="text-sm">{{ t('plan.monthly-total') }}: <b>{{ formatMoney(subscription.monthlyAmount, subscription.plan.currency) }}</b></div>
      <div class="flex flex-wrap gap-1"><pv-chip v-for="vehicle in subscription.vehicles" :key="vehicle.id" :label="vehicle.plate"/></div>
      <pv-data-table :value="subscription.payments" data-key="id" size="small">
        <pv-column :header="t('columns.date')"><template #body="{ data }">{{ formatDate(data.paidAt, locale) }}</template></pv-column>
        <pv-column :header="t('columns.amount')"><template #body="{ data }">{{ formatMoney(data.amount, data.currency) }}</template></pv-column>
        <pv-column :header="t('subscription.operation')" field="gatewayPaymentId"/>
        <pv-column :header="t('columns.status')">
          <template #body="{ data }"><pv-tag :value="t(`statuses.${statusKey(data.status)}`)" :severity="statusSeverity(data.status)"/></template>
        </pv-column>
      </pv-data-table>
      <div v-if="!subscription.isCancelled" class="flex justify-content-end gap-2">
        <pv-button :label="t('subscription.cancel')" severity="danger" text @click="cancel(subscription)"/>
        <pv-button :label="t('subscription.renew')" icon="pi pi-refresh" outlined @click="renew(subscription)"/>
      </div>
    </div>
  </div>
</template>

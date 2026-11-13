<script setup>
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useConfirm} from "primevue";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import ChatPanel from "../components/chat-panel.vue";
import RouteMap from "../../../shared/presentation/components/route-map.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDateTime, formatMoney, formatNumber, statusKey, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const currentRoute = useRoute();
const router = useRouter();
const confirm = useConfirm();
const store = useMatchmakingStore();
const iam = useIamStore();
const { showError, showSuccess } = useErrorHandler();
const proposal = ref(null);
const busy = ref(false);

const stops = computed(() => proposal.value ? [
  { label: 'A', ...proposal.value.route.origin, color: '#64748b' },
  { label: '1', ...proposal.value.shipment.pickup, color: '#0037b0' },
  { label: '2', ...proposal.value.shipment.delivery, color: '#16a34a' },
  { label: 'B', ...proposal.value.route.destination, color: '#64748b' }
] : []);
const counterpart = computed(() => iam.isCarrier.value ? proposal.value?.merchant : proposal.value?.carrier);

onMounted(async () => {
  try {
    proposal.value = await store.getProposal(currentRoute.params.id);
  } catch (error) {
    showError(error);
  }
});

const run = async (action) => {
  busy.value = true;
  try {
    proposal.value = await store.respondProposal(proposal.value, action);
    showSuccess(`proposal.${action}ed`);
    if (action === 'accept' && proposal.value.tripId)
      await router.push({ name: 'execution-trip-detail', params: { id: proposal.value.tripId } });
  } catch (error) {
    showError(error);
  } finally {
    busy.value = false;
  }
};

const ask = (action, severity) => confirm.require({
  message: t(`proposal.confirm-${action}`),
  header: t(`proposal.${action}`),
  icon: 'pi pi-question-circle',
  rejectProps: { label: t('actions.back'), severity: 'secondary', outlined: true },
  acceptProps: { label: t(`proposal.${action}`), severity },
  accept: () => run(action)
});
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('proposal.detail-title') }}</h1>
    </div>
    <div v-if="proposal" class="grid">
      <div class="col-12 lg:col-7 flex flex-column gap-3">
        <div class="trazza-panel flex flex-column gap-2">
          <div class="flex justify-content-between align-items-center gap-2">
            <span class="text-2xl font-bold">{{ formatMoney(proposal.offeredRate, proposal.currency) }}</span>
            <pv-tag :value="t(`statuses.${statusKey(proposal.status)}`)" :severity="statusSeverity(proposal.status)"/>
          </div>
          <div><span class="trazza-label">{{ t('columns.shipment') }}:</span> {{ proposal.shipment.label }}</div>
          <div class="text-sm trazza-muted">{{ proposal.shipment.description }} · {{ formatNumber(proposal.shipment.weightKg) }} kg · {{ formatNumber(proposal.shipment.volumeM3) }} m³</div>
          <div class="text-sm trazza-muted">{{ t('shipment.pickup-window') }}: {{ formatDateTime(proposal.shipment.pickupFrom, locale) }} – {{ formatDateTime(proposal.shipment.pickupUntil, locale) }}</div>
          <div><span class="trazza-label">{{ t('columns.route') }}:</span> {{ proposal.route.label }}</div>
          <div class="text-sm trazza-muted">{{ t('columns.departure') }}: {{ formatDateTime(proposal.route.departureAt, locale) }} · {{ proposal.route.vehicle.plate }} {{ proposal.route.vehicle.model }}</div>
          <div class="text-sm">
            <span class="trazza-label">{{ iam.isCarrier.value ? t('roles.merchant') : t('roles.carrier') }}:</span>
            {{ counterpart?.name }}<template v-if="counterpart?.phone"> · <i class="pi pi-phone text-xs"></i> {{ counterpart.phone }}</template>
          </div>
          <small v-if="!counterpart?.phone" class="trazza-muted">{{ t('proposal.phone-hidden') }}</small>
          <div class="flex flex-wrap gap-2 justify-content-end mt-2">
            <template v-if="proposal.isPending && iam.isMerchant.value">
              <pv-button :label="t('proposal.reject')" severity="danger" outlined :loading="busy" @click="ask('reject', 'danger')"/>
              <pv-button :label="t('proposal.accept')" icon="pi pi-check" :loading="busy" @click="ask('accept', 'success')"/>
            </template>
            <pv-button v-if="proposal.isPending && iam.isCarrier.value" :label="t('proposal.cancel')" severity="danger" outlined :loading="busy" @click="ask('cancel', 'danger')"/>
            <pv-button v-if="proposal.tripId" :label="t('proposal.go-to-trip')" icon="pi pi-map"
                       @click="router.push({ name: 'execution-trip-detail', params: { id: proposal.tripId } })"/>
          </div>
        </div>
        <div class="trazza-panel"><route-map :stops="stops" height="20rem"/></div>
      </div>
      <div class="col-12 lg:col-5">
        <chat-panel :proposal-id="proposal.id" :open="proposal.chatOpen" :counterpart="iam.isCarrier.value ? t('roles.merchant') : t('roles.carrier')"/>
      </div>
    </div>
  </div>
</template>

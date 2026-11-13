<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import {CreateMatchProposalCommand} from "../../domain/commands/matchmaking.commands.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDateTime, formatNumber} from "../../../shared/presentation/formatters.js";

/**
 * Dialog where the carrier makes its single offer for a shipment, choosing one of its open routes.
 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  shipment: { type: Object, default: null },
  routes: { type: Array, default: () => [] },
  routeId: { type: String, default: null }
});
const emit = defineEmits(['update:visible', 'created']);
const { t, locale } = useI18n();
const store = useMatchmakingStore();
const { showError, showSuccess } = useErrorHandler();

const selectedRouteId = ref(null);
const rate = ref(null);
const sending = ref(false);
const routeOptions = computed(() => props.routes.map(route => ({ id: route.id, label: `${route.label} · ${formatDateTime(route.departureAt, locale.value)}` })));

watch(() => props.visible, visible => {
  if (!visible) return;
  selectedRouteId.value = props.routeId ?? props.routes[0]?.id ?? null;
  rate.value = null;
});

const submit = async () => {
  sending.value = true;
  try {
    const proposal = await store.createProposal(new CreateMatchProposalCommand({
      shipmentRequestId: props.shipment.id, returnRouteId: selectedRouteId.value, offeredRate: rate.value
    }));
    showSuccess('offer.sent');
    emit('created', proposal);
    emit('update:visible', false);
  } catch (error) {
    showError(error);
  } finally {
    sending.value = false;
  }
};
</script>

<template>
  <pv-dialog :visible="visible" modal :header="t('offer.title')" :style="{ width: '32rem' }" :breakpoints="{ '640px': '95vw' }"
             @update:visible="value => emit('update:visible', value)">
    <form v-if="shipment" class="flex flex-column gap-3" @submit.prevent="submit">
      <div>
        <div class="trazza-route">{{ shipment.label }}</div>
        <div class="text-sm trazza-muted">{{ shipment.description }} · {{ formatNumber(shipment.weightKg) }} kg · {{ formatNumber(shipment.volumeM3) }} m³</div>
        <div class="text-sm trazza-muted">{{ t('shipment.pickup-window') }}: {{ formatDateTime(shipment.pickupFrom, locale) }} – {{ formatDateTime(shipment.pickupUntil, locale) }}</div>
      </div>
      <div class="flex flex-column gap-1">
        <label for="offer-route" class="trazza-label">{{ t('offer.route') }}</label>
        <pv-select input-id="offer-route" v-model="selectedRouteId" :options="routeOptions" option-label="label" option-value="id"
                   :placeholder="t('offer.choose-route')" :disabled="!!routeId"/>
      </div>
      <div class="flex flex-column gap-1">
        <label for="offer-rate" class="trazza-label">{{ t('offer.rate') }}</label>
        <pv-input-number input-id="offer-rate" v-model="rate" mode="currency" currency="PEN" locale="es-PE" :min="1" fluid/>
        <small class="trazza-muted">{{ t('offer.single-offer-hint') }}</small>
      </div>
      <div class="flex justify-content-end gap-2">
        <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="emit('update:visible', false)"/>
        <pv-button type="submit" :label="t('offer.send')" icon="pi pi-send" :loading="sending"/>
      </div>
    </form>
  </pv-dialog>
</template>

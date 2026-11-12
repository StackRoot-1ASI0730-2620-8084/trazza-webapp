<script setup>
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useBillingStore from "../../application/billing.store.js";
import useFleetStore from "../../../iam/application/fleet.store.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatMoney, statusKey} from "../../../shared/presentation/formatters.js";

const { t } = useI18n();
const router = useRouter();
const store = useBillingStore();
const fleet = useFleetStore();
const { showError, showSuccess } = useErrorHandler();
const dialogVisible = ref(false);
const plan = ref(null);
const vehicleIds = ref([]);
const sending = ref(false);

const vehicleOptions = computed(() => fleet.activeVehicles.value.map(vehicle => ({ id: vehicle.id, label: vehicle.label })));
const total = computed(() => plan.value ? plan.value.priceFor(vehicleIds.value.length) : 0);
const validCount = computed(() => plan.value?.acceptsVehicleCount(vehicleIds.value.length) ?? false);
const rangeText = p => p.maxVehicles === null
    ? t('plan.min-trucks', { min: p.minVehicles })
    : t('plan.range-trucks', { min: p.minVehicles, max: p.maxVehicles });

onMounted(() => Promise.all([store.fetchPlans(), fleet.fetchFleet()]).catch(showError));

const choose = (selected) => {
  plan.value = selected;
  vehicleIds.value = [];
  dialogVisible.value = true;
};

const subscribe = async () => {
  sending.value = true;
  try {
    await store.subscribe(plan.value, vehicleIds.value);
    dialogVisible.value = false;
    showSuccess('plan.subscribed');
    await router.push({ name: 'billing-subscriptions' });
  } catch (error) {
    showError(error);
  } finally {
    sending.value = false;
  }
};
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('plan.title') }}</h1>
      <p>{{ t('plan.subtitle') }}</p>
    </div>
    <div class="grid">
      <div v-for="item in store.state.plans" :key="item.code" class="col-12 md:col-4">
        <div class="trazza-panel h-full flex flex-column gap-2">
          <h3 class="m-0">{{ item.name }}</h3>
          <div class="text-3xl font-bold">{{ formatMoney(item.price, item.currency) }}
            <span class="text-base font-normal trazza-muted">{{ item.isPackage ? t('plan.per-month') : t('plan.per-truck-month') }}</span>
          </div>
          <div class="text-sm">{{ t(`plan.types.${statusKey(item.monitoringType)}`) }}</div>
          <div class="text-sm trazza-muted">{{ rangeText(item) }}</div>
          <pv-tag v-if="item.includesIotDevice" :value="t('plan.includes-iot')" severity="info" class="align-self-start"/>
          <div class="flex-1"></div>
          <pv-button :label="t('plan.subscribe')" @click="choose(item)"/>
        </div>
      </div>
    </div>
    <p class="text-sm trazza-muted">{{ t('plan.simulated-note') }}</p>

    <pv-dialog v-model:visible="dialogVisible" modal :header="plan ? t('plan.subscribe-to', { name: plan.name }) : ''" :style="{ width: '32rem' }">
      <div v-if="plan" class="flex flex-column gap-3">
        <label for="plan-vehicles" class="trazza-label">{{ t('plan.choose-trucks') }} ({{ rangeText(plan) }})</label>
        <pv-multi-select input-id="plan-vehicles" v-model="vehicleIds" :options="vehicleOptions" option-label="label" option-value="id" display="chip"/>
        <pv-message v-if="!vehicleOptions.length" severity="warn">{{ t('return-route.no-vehicles') }}</pv-message>
        <div class="text-lg">{{ t('plan.monthly-total') }}: <b>{{ formatMoney(total, plan.currency) }}</b></div>
      </div>
      <template #footer>
        <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="dialogVisible = false"/>
        <pv-button :label="t('plan.pay-simulated')" icon="pi pi-credit-card" :disabled="!validCount" :loading="sending" @click="subscribe"/>
      </template>
    </pv-dialog>
  </div>
</template>

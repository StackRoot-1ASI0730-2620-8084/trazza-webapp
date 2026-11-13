<script setup>
import {onMounted} from "vue";
import {useI18n} from "vue-i18n";
import useReputationStore from "../../application/reputation.store.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDate} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const store = useReputationStore();
const { showError } = useErrorHandler();

onMounted(() => store.fetchRatings().catch(showError));
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('rating.list-title') }}</h1>
      <p>{{ t('rating.list-subtitle') }}</p>
    </div>
    <div class="trazza-panel flex align-items-center gap-3 mb-3">
      <span class="text-4xl font-bold">{{ store.averageScore.value === null ? '–' : store.averageScore.value.toFixed(1) }}</span>
      <div>
        <pv-rating :model-value="Math.round(store.averageScore.value ?? 0)" readonly :cancel="false"/>
        <div class="text-sm trazza-muted">{{ t('rating.count', { count: store.state.received.length }) }}</div>
      </div>
    </div>
    <pv-tabs value="received">
      <pv-tab-list>
        <pv-tab value="received">{{ t('rating.received') }}</pv-tab>
        <pv-tab value="given">{{ t('rating.given') }}</pv-tab>
      </pv-tab-list>
      <pv-tab-panels>
        <pv-tab-panel v-for="tab in ['received', 'given']" :key="tab" :value="tab">
          <div v-if="!store.state[tab].length" class="trazza-muted py-3">{{ t('rating.empty') }}</div>
          <div v-for="rating in store.state[tab]" :key="rating.id" class="border-bottom-1 surface-border py-3">
            <div class="flex justify-content-between align-items-center gap-2">
              <span class="font-semibold">{{ rating.counterpartName }}</span>
              <span class="text-sm trazza-muted">{{ formatDate(rating.createdAt, locale) }}</span>
            </div>
            <pv-rating :model-value="rating.score" readonly :cancel="false" class="my-1"/>
            <div v-if="rating.comment" class="text-sm">{{ rating.comment }}</div>
            <router-link :to="{ name: 'execution-trip-detail', params: { id: rating.tripId } }" class="text-sm">{{ t('rating.view-trip') }}</router-link>
          </div>
        </pv-tab-panel>
      </pv-tab-panels>
    </pv-tabs>
  </div>
</template>
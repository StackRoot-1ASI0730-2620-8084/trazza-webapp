<script setup>
import {onMounted, reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import useExecutionStore from "../../application/execution.store.js";
import {Incident} from "../../domain/model/execution.entities.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDateTime, statusKey, statusSeverity} from "../../../shared/presentation/formatters.js";

/**
 * Incidents of a trip: either party reports them and adds evidence (S3 keys); either party records the resolution.
 */
const props = defineProps({
  tripId: { type: String, required: true },
  canReport: { type: Boolean, default: true }
});
const { t, locale } = useI18n();
const store = useExecutionStore();
const { showError, showSuccess } = useErrorHandler();
const incidents = ref([]);
const reportVisible = ref(false);
const form = reactive({ type: 'DELAY', description: '' });
const evidenceKey = reactive({});
const resolution = reactive({});
const typeOptions = Incident.TYPES.map(type => ({ value: type, label: () => t(`incident.types.${statusKey(type)}`) }));

const load = async () => {
  try {
    incidents.value = await store.listIncidents(props.tripId);
  } catch (error) {
    showError(error);
  }
};

const report = async () => {
  try {
    await store.reportIncident(props.tripId, form);
    form.description = '';
    reportVisible.value = false;
    showSuccess('incident.reported');
    await load();
  } catch (error) {
    showError(error);
  }
};

const addEvidence = async (incident) => {
  try {
    await store.addEvidence(props.tripId, incident.id, evidenceKey[incident.id]);
    evidenceKey[incident.id] = '';
    await load();
  } catch (error) {
    showError(error);
  }
};

const resolve = async (incident) => {
  try {
    await store.resolveIncident(props.tripId, incident.id, resolution[incident.id]);
    showSuccess('incident.resolved');
    await load();
  } catch (error) {
    showError(error);
  }
};

onMounted(load);
defineExpose({ load });
</script>

<template>
  <div class="trazza-panel flex flex-column gap-2">
    <div class="flex justify-content-between align-items-center">
      <h3 class="m-0">{{ t('incident.title') }}</h3>
      <pv-button v-if="canReport" :label="t('incident.report')" icon="pi pi-flag" size="small" outlined @click="reportVisible = true"/>
    </div>
    <div v-if="!incidents.length" class="text-sm trazza-muted">{{ t('incident.empty') }}</div>
    <div v-for="incident in incidents" :key="incident.id" class="border-1 surface-border border-round p-2 flex flex-column gap-2">
      <div class="flex justify-content-between align-items-center gap-2">
        <span class="font-semibold">{{ t(`incident.types.${statusKey(incident.type)}`) }}</span>
        <pv-tag :value="t(`statuses.${statusKey(incident.status)}`)" :severity="statusSeverity(incident.status)"/>
      </div>
      <div class="text-sm">{{ incident.description }}</div>
      <div class="text-xs trazza-muted">{{ formatDateTime(incident.reportedAt, locale) }}</div>
      <div v-for="evidence in incident.evidences" :key="evidence.id" class="text-xs"><i class="pi pi-paperclip"></i> {{ evidence.s3Key }}</div>
      <div v-if="incident.isResolved" class="text-sm"><span class="trazza-label">{{ t('incident.resolution') }}:</span> {{ incident.resolution }}</div>
      <template v-else>
        <div class="flex gap-2">
          <pv-input-text v-model="evidenceKey[incident.id]" :placeholder="t('incident.evidence-placeholder')" class="flex-1" size="small"/>
          <pv-button icon="pi pi-paperclip" size="small" outlined :aria-label="t('incident.add-evidence')" @click="addEvidence(incident)"/>
        </div>
        <div class="flex gap-2">
          <pv-input-text v-model="resolution[incident.id]" :placeholder="t('incident.resolution-placeholder')" class="flex-1" size="small"/>
          <pv-button icon="pi pi-check" size="small" severity="success" outlined :aria-label="t('incident.resolve')" @click="resolve(incident)"/>
        </div>
      </template>
    </div>

    <pv-dialog v-model:visible="reportVisible" modal :header="t('incident.report')" :style="{ width: '28rem' }">
      <div class="flex flex-column gap-3">
        <pv-select v-model="form.type" :options="typeOptions" :option-label="option => option.label()" option-value="value"/>
        <pv-textarea v-model="form.description" rows="3" maxlength="1000" :placeholder="t('fields.description')"/>
      </div>
      <template #footer>
        <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="reportVisible = false"/>
        <pv-button :label="t('incident.report')" severity="danger" @click="report"/>
      </template>
    </pv-dialog>
  </div>
</template>

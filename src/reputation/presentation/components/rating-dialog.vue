<script setup>
import {ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import useReputationStore from "../../application/reputation.store.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";

const props = defineProps({
  visible: { type: Boolean, default: false },
  tripId: { type: String, default: null },
  counterpartName: { type: String, default: '' }
});
const emit = defineEmits(['update:visible', 'rated']);
const { t } = useI18n();
const store = useReputationStore();
const { showError, showSuccess } = useErrorHandler();
const score = ref(5);
const comment = ref('');
const sending = ref(false);

watch(() => props.visible, visible => {
  if (!visible) return;
  score.value = 5;
  comment.value = '';
});

const submit = async () => {
  sending.value = true;
  try {
    const rating = await store.rateTrip({ tripId: props.tripId, score: score.value, comment: comment.value });
    showSuccess('rating.sent');
    emit('rated', rating);
    emit('update:visible', false);
  } catch (error) {
    showError(error);
  } finally {
    sending.value = false;
  }
};
</script>

<template>
  <pv-dialog :visible="visible" modal :header="t('rating.title', { name: counterpartName })" :style="{ width: '28rem' }"
             @update:visible="value => emit('update:visible', value)">
    <div class="flex flex-column gap-3">
      <pv-rating v-model="score" :cancel="false"/>
      <div class="flex flex-column gap-1">
        <label for="rating-comment" class="trazza-label">{{ t('fields.comment') }}</label>
        <pv-textarea id="rating-comment" v-model="comment" rows="3" maxlength="500"/>
      </div>
      <small class="trazza-muted">{{ t('rating.points-hint') }}</small>
    </div>
    <template #footer>
      <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="emit('update:visible', false)"/>
      <pv-button :label="t('rating.send')" icon="pi pi-star" :loading="sending" @click="submit"/>
    </template>
  </pv-dialog>
</template>
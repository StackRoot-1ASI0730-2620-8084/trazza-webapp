<script setup>
import {ref} from "vue";
import {useI18n} from "vue-i18n";

/**
 * Address field with its coordinates. The value is { address, latitude, longitude } (SRID 4326).
 * A saved address fills the three values.
 */
const props = defineProps({
  modelValue: { type: Object, default: () => ({ address: '', latitude: null, longitude: null }) },
  label: { type: String, required: true },
  savedAddresses: { type: Array, default: () => [] },
  inputId: { type: String, required: true }
});
const emit = defineEmits(['update:modelValue']);
const { t } = useI18n();
const selectedSaved = ref(null);

const update = (patch) => emit('update:modelValue', { ...props.modelValue, ...patch });

const useSaved = (saved) => {
  if (saved) update({ address: saved.address, latitude: saved.latitude, longitude: saved.longitude });
};
</script>

<template>
  <div class="flex flex-column gap-2">
    <label :for="inputId" class="trazza-label">{{ label }}</label>
    <pv-select v-if="savedAddresses.length" v-model="selectedSaved" :options="savedAddresses" option-label="label"
               :placeholder="t('option.saved-addresses')" show-clear @change="({ value }) => useSaved(value)"/>
    <pv-input-text :id="inputId" :model-value="modelValue.address" maxlength="255" @update:model-value="address => update({ address })"/>
    <div class="flex gap-2">
      <div class="flex flex-column gap-1 flex-1">
        <label :for="`${inputId}-latitude`" class="text-sm trazza-muted">{{ t('fields.latitude') }}</label>
        <pv-input-number :input-id="`${inputId}-latitude`" :model-value="modelValue.latitude" :min-fraction-digits="4" :max-fraction-digits="6"
                         :min="-90" :max="90" fluid @update:model-value="latitude => update({ latitude })"/>
      </div>
      <div class="flex flex-column gap-1 flex-1">
        <label :for="`${inputId}-longitude`" class="text-sm trazza-muted">{{ t('fields.longitude') }}</label>
        <pv-input-number :input-id="`${inputId}-longitude`" :model-value="modelValue.longitude" :min-fraction-digits="4" :max-fraction-digits="6"
                         :min="-180" :max="180" fluid @update:model-value="longitude => update({ longitude })"/>
      </div>
    </div>
  </div>
</template>

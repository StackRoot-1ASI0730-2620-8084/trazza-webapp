<script setup>
import {onMounted, reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import useFleetStore from "../../application/fleet.store.js";
import MapPicker from "../../../shared/presentation/components/map-picker.vue";
import {GeoLocation} from "../../../shared/domain/model/geo-location.value-object.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";

const { t } = useI18n();
const store = useFleetStore();
const { showError, showSuccess } = useErrorHandler();
const dialog = ref(false);
const form = reactive({ label: '', district: '', place: { address: '', latitude: null, longitude: null } });

onMounted(() => store.fetchSavedAddresses().catch(showError));

const open = () => {
  Object.assign(form, { label: '', district: '', place: { address: '', latitude: null, longitude: null } });
  dialog.value = true;
};

const save = async () => {
  try {
    const location = new GeoLocation(form.place);
    await store.createSavedAddress({ label: form.label, address: form.place.address, district: form.district,
      latitude: location.latitude, longitude: location.longitude });
    dialog.value = false;
    showSuccess('saved-address.saved');
  } catch (error) {
    showError(error);
  }
};

const remove = (address) => store.deleteSavedAddress(address).then(() => showSuccess('saved-address.deleted')).catch(showError);
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1>{{ t('saved-address.title') }}</h1>
        <p>{{ t('saved-address.subtitle') }}</p>
      </div>
      <pv-button :label="t('saved-address.add')" icon="pi pi-plus" @click="open"/>
    </div>
    <div class="trazza-panel p-0 overflow-hidden">
      <pv-data-table :value="store.state.savedAddresses" data-key="id" striped-rows>
        <template #empty><div class="text-center py-4 trazza-muted">{{ t('saved-address.empty') }}</div></template>
        <pv-column field="label" :header="t('fields.label')"/>
        <pv-column field="address" :header="t('fields.address')"/>
        <pv-column :header="t('fields.district')"><template #body="{ data }">{{ data.district ?? '—' }}</template></pv-column>
        <pv-column :header="t('fields.coordinates')">
          <template #body="{ data }"><span class="text-sm">{{ data.latitude.toFixed(5) }}, {{ data.longitude.toFixed(5) }}</span></template>
        </pv-column>
        <pv-column :header="t('columns.actions')">
          <template #body="{ data }">
            <pv-button icon="pi pi-trash" text rounded severity="danger" :aria-label="t('actions.delete')" @click="remove(data)"/>
          </template>
        </pv-column>
      </pv-data-table>
    </div>
    <pv-dialog v-model:visible="dialog" modal :header="t('saved-address.add')" :style="{ width: '40rem' }" :breakpoints="{ '640px': '95vw' }">
      <form class="flex flex-column gap-3" @submit.prevent="save">
        <div class="grid">
          <div class="col-12 md:col-6 flex flex-column gap-1">
            <label for="address-label" class="trazza-label">{{ t('fields.label') }}</label>
            <pv-input-text id="address-label" v-model="form.label" :placeholder="t('saved-address.label-placeholder')"/>
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-1">
            <label for="address-district" class="trazza-label">{{ t('fields.district') }}</label>
            <pv-input-text id="address-district" v-model="form.district"/>
          </div>
        </div>
        <map-picker v-model="form.place" :label="t('fields.address')" input-id="saved-address-place"/>
        <div class="flex justify-content-end gap-2">
          <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="dialog = false"/>
          <pv-button type="submit" :label="t('actions.save')"/>
        </div>
      </form>
    </pv-dialog>
  </div>
</template>

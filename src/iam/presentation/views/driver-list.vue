<script setup>
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import useFleetStore from "../../application/fleet.store.js";
import {Driver} from "../../domain/model/fleet.entities.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";

const { t } = useI18n();
const store = useFleetStore();
const { showError, showSuccess } = useErrorHandler();
const dialog = ref(false);
const editing = ref(new Driver({}));
const sexOptions = [{ value: null, key: 'driver.sex-none' }, { value: 'F', key: 'driver.sex-f' }, { value: 'M', key: 'driver.sex-m' }, { value: 'X', key: 'driver.sex-x' }];

onMounted(() => store.fetchFleet().catch(showError));

const open = (driver = null) => {
  editing.value = new Driver(driver ? { ...driver } : {});
  dialog.value = true;
};

const save = async () => {
  try {
    await store.saveDriver(editing.value);
    dialog.value = false;
    showSuccess('driver.saved');
  } catch (error) {
    showError(error);
  }
};

const deactivate = (driver) => store.deactivateDriver(driver).then(() => showSuccess('driver.deactivated')).catch(showError);
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1>{{ t('driver.title') }}</h1>
        <p>{{ t('driver.subtitle') }}</p>
      </div>
      <pv-button :label="t('driver.add')" icon="pi pi-plus" @click="open()"/>
    </div>
    <div class="trazza-panel p-0 overflow-hidden">
      <pv-data-table :value="store.state.drivers" :loading="!store.state.loaded" data-key="id" striped-rows>
        <template #empty><div class="text-center py-4 trazza-muted">{{ t('driver.empty') }}</div></template>
        <pv-column field="fullName" :header="t('fields.full-name')"/>
        <pv-column :header="t('fields.sex')"><template #body="{ data }">{{ data.sex ?? '—' }}</template></pv-column>
        <pv-column :header="t('fields.experience')">
          <template #body="{ data }"><pv-rating :model-value="data.experienceStars" readonly/></template>
        </pv-column>
        <pv-column :header="t('columns.status')">
          <template #body="{ data }">
            <pv-tag :value="data.isActive ? t('statuses.active') : t('statuses.inactive')" :severity="data.isActive ? 'success' : 'secondary'"/>
          </template>
        </pv-column>
        <pv-column :header="t('columns.actions')">
          <template #body="{ data }">
            <pv-button icon="pi pi-pencil" text rounded :aria-label="t('actions.edit')" @click="open(data)"/>
            <pv-button v-if="data.isActive" icon="pi pi-ban" text rounded severity="danger" :aria-label="t('driver.deactivate')" @click="deactivate(data)"/>
          </template>
        </pv-column>
      </pv-data-table>
    </div>
    <pv-dialog v-model:visible="dialog" modal :header="editing.id ? t('driver.edit') : t('driver.add')" :style="{ width: '28rem' }" :breakpoints="{ '640px': '95vw' }">
      <form class="flex flex-column gap-3" @submit.prevent="save">
        <div class="flex flex-column gap-1">
          <label for="driver-name" class="trazza-label">{{ t('fields.full-name') }}</label>
          <pv-input-text id="driver-name" v-model="editing.fullName"/>
        </div>
        <div class="flex flex-column gap-1">
          <label for="driver-sex" class="trazza-label">{{ t('fields.sex') }}</label>
          <pv-select input-id="driver-sex" v-model="editing.sex" :options="sexOptions" option-value="value" :option-label="option => t(option.key)"/>
        </div>
        <div class="flex flex-column gap-1">
          <span class="trazza-label">{{ t('fields.experience') }}</span>
          <pv-rating v-model="editing.experienceStars" :cancel="false"/>
        </div>
        <div class="flex justify-content-end gap-2">
          <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="dialog = false"/>
          <pv-button type="submit" :label="t('actions.save')"/>
        </div>
      </form>
    </pv-dialog>
  </div>
</template>

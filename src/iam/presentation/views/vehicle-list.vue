<script setup>
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useConfirm} from "primevue";
import useFleetStore from "../../application/fleet.store.js";
import {Vehicle} from "../../domain/model/fleet.entities.js";
import {LicensePlate} from "../../domain/model/license-plate.value-object.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatNumber} from "../../../shared/presentation/formatters.js";

const { t } = useI18n();
const confirm = useConfirm();
const store = useFleetStore();
const { showError, showSuccess } = useErrorHandler();
const dialog = ref(false);
const editing = ref(new Vehicle({}));

onMounted(() => store.fetchFleet().catch(showError));

const open = (vehicle = null) => {
  editing.value = new Vehicle(vehicle ? { ...vehicle } : { cargoLengthM: 4, cargoWidthM: 2, cargoHeightM: 2, maxLoadKg: 3000 });
  dialog.value = true;
};

const save = async () => {
  try {
    editing.value.plate = new LicensePlate(editing.value.plate).value;
    await store.saveVehicle(editing.value);
    dialog.value = false;
    showSuccess('vehicle.saved');
  } catch (error) {
    showError(error);
  }
};

const deactivate = (vehicle) => confirm.require({
  message: t('vehicle.confirm-deactivate', { plate: vehicle.plate }),
  header: t('vehicle.deactivate'),
  icon: 'pi pi-exclamation-triangle',
  rejectProps: { label: t('actions.cancel'), severity: 'secondary', outlined: true },
  acceptProps: { label: t('vehicle.deactivate'), severity: 'danger' },
  accept: () => store.deactivateVehicle(vehicle).then(() => showSuccess('vehicle.deactivated')).catch(showError)
});
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1>{{ t('vehicle.title') }}</h1>
        <p>{{ t('vehicle.subtitle') }}</p>
      </div>
      <pv-button :label="t('vehicle.add')" icon="pi pi-plus" @click="open()"/>
    </div>
    <div class="trazza-panel p-0 overflow-hidden">
      <pv-data-table :value="store.state.vehicles" :loading="!store.state.loaded" data-key="id" striped-rows>
        <template #empty><div class="text-center py-4 trazza-muted">{{ t('vehicle.empty') }}</div></template>
        <pv-column field="plate" :header="t('fields.plate')"/>
        <pv-column field="model" :header="t('fields.model')"/>
        <pv-column :header="t('fields.max-load')"><template #body="{ data }">{{ formatNumber(data.maxLoadKg) }} kg</template></pv-column>
        <pv-column :header="t('fields.volume')"><template #body="{ data }">{{ formatNumber(data.cargoVolumeM3) }} m³</template></pv-column>
        <pv-column :header="t('columns.status')">
          <template #body="{ data }">
            <pv-tag :value="data.isActive ? t('statuses.active') : t('statuses.inactive')" :severity="data.isActive ? 'success' : 'secondary'"/>
          </template>
        </pv-column>
        <pv-column :header="t('columns.actions')">
          <template #body="{ data }">
            <pv-button icon="pi pi-pencil" text rounded :aria-label="t('actions.edit')" @click="open(data)"/>
            <pv-button v-if="data.isActive" icon="pi pi-ban" text rounded severity="danger" :aria-label="t('vehicle.deactivate')" @click="deactivate(data)"/>
          </template>
        </pv-column>
      </pv-data-table>
    </div>
    <pv-dialog v-model:visible="dialog" modal :header="editing.id ? t('vehicle.edit') : t('vehicle.add')" :style="{ width: '32rem' }" :breakpoints="{ '640px': '95vw' }">
      <form class="grid" @submit.prevent="save">
        <div class="col-12 md:col-6 flex flex-column gap-1">
          <label for="plate" class="trazza-label">{{ t('fields.plate') }}</label>
          <pv-input-text id="plate" v-model="editing.plate" placeholder="ABC-123"/>
        </div>
        <div class="col-12 md:col-6 flex flex-column gap-1">
          <label for="model" class="trazza-label">{{ t('fields.model') }}</label>
          <pv-input-text id="model" v-model="editing.model"/>
        </div>
        <div class="col-12 md:col-6 flex flex-column gap-1">
          <label for="max-load" class="trazza-label">{{ t('fields.max-load') }} (kg)</label>
          <pv-input-number input-id="max-load" v-model="editing.maxLoadKg" :min="1" :max="30000" fluid/>
        </div>
        <div class="col-12 md:col-6 flex flex-column gap-1">
          <label for="volume" class="trazza-label">{{ t('fields.volume') }} (m³)</label>
          <pv-input-number input-id="volume" v-model="editing.cargoVolumeM3" :min-fraction-digits="0" :max-fraction-digits="2" :placeholder="t('vehicle.volume-auto')" fluid/>
        </div>
        <div class="col-4 flex flex-column gap-1">
          <label for="length" class="trazza-label">{{ t('fields.length') }} (m)</label>
          <pv-input-number input-id="length" v-model="editing.cargoLengthM" :min-fraction-digits="0" :max-fraction-digits="2" fluid/>
        </div>
        <div class="col-4 flex flex-column gap-1">
          <label for="width" class="trazza-label">{{ t('fields.width') }} (m)</label>
          <pv-input-number input-id="width" v-model="editing.cargoWidthM" :min-fraction-digits="0" :max-fraction-digits="2" fluid/>
        </div>
        <div class="col-4 flex flex-column gap-1">
          <label for="height" class="trazza-label">{{ t('fields.height') }} (m)</label>
          <pv-input-number input-id="height" v-model="editing.cargoHeightM" :min-fraction-digits="0" :max-fraction-digits="2" fluid/>
        </div>
        <div class="col-12 flex justify-content-end gap-2">
          <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="dialog = false"/>
          <pv-button type="submit" :label="t('actions.save')"/>
        </div>
      </form>
    </pv-dialog>
  </div>
</template>

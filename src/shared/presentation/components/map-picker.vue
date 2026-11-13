<script setup>
import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Address field with a map: the user writes the address and clicks the exact point on the map.
 * The value is { address, latitude, longitude } with real coordinates (SRID 4326).
 */
const props = defineProps({
  modelValue: { type: Object, default: () => ({ address: '', latitude: null, longitude: null }) },
  label: { type: String, required: true },
  savedAddresses: { type: Array, default: () => [] },
  inputId: { type: String, required: true }
});
const emit = defineEmits(['update:modelValue']);
const { t } = useI18n();

const LIMA = [-12.0464, -77.0428];
const mapElement = ref();
const selectedSaved = ref(null);
let map = null;
let marker = null;

const update = (patch) => emit('update:modelValue', { ...props.modelValue, ...patch });

const placeMarker = (latitude, longitude, pan = false) => {
  if (!map || latitude === null || longitude === null) return;
  if (!marker) marker = L.circleMarker([latitude, longitude], { radius: 9, color: '#0037b0', fillOpacity: 0.8 }).addTo(map);
  else marker.setLatLng([latitude, longitude]);
  if (pan) map.setView([latitude, longitude], Math.max(map.getZoom(), 14));
};

const useSaved = (saved) => {
  if (!saved) return;
  update({ address: saved.address, latitude: saved.latitude, longitude: saved.longitude });
  placeMarker(saved.latitude, saved.longitude, true);
};

const useMyLocation = () => {
  navigator.geolocation?.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    update({ latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)) });
    placeMarker(latitude, longitude, true);
  });
};

onMounted(() => {
  map = L.map(mapElement.value).setView(LIMA, 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
  map.on('click', event => {
    const latitude = Number(event.latlng.lat.toFixed(6));
    const longitude = Number(event.latlng.lng.toFixed(6));
    update({ latitude, longitude });
    placeMarker(latitude, longitude);
  });
  placeMarker(props.modelValue?.latitude, props.modelValue?.longitude, props.modelValue?.latitude !== null);
});

watch(() => [props.modelValue?.latitude, props.modelValue?.longitude], ([latitude, longitude]) => placeMarker(latitude, longitude));
onBeforeUnmount(() => map?.remove());
</script>

<template>
  <div class="flex flex-column gap-2">
    <label :for="inputId" class="trazza-label">{{ label }}</label>
    <div class="flex flex-wrap gap-2">
      <pv-input-text :id="inputId" class="flex-1" :model-value="modelValue.address" :placeholder="t('map.address-placeholder')"
                     @update:model-value="value => update({ address: value })"/>
      <pv-select v-if="savedAddresses.length" v-model="selectedSaved" :options="savedAddresses" option-label="label"
                 :placeholder="t('map.saved-addresses')" class="w-full md:w-14rem" @change="useSaved(selectedSaved)"/>
      <pv-button icon="pi pi-map-marker" outlined v-tooltip.top="t('map.my-location')" :aria-label="t('map.my-location')" @click="useMyLocation"/>
    </div>
    <div ref="mapElement" class="map-picker"></div>
    <small class="trazza-muted">
      <template v-if="modelValue.latitude !== null && modelValue.latitude !== undefined">
        {{ t('map.selected-point', { latitude: modelValue.latitude, longitude: modelValue.longitude }) }}
      </template>
      <template v-else>{{ t('map.click-hint') }}</template>
    </small>
  </div>
</template>

<style scoped>
.map-picker {
  height: 16rem;
  border-radius: 8px;
  border: 1px solid var(--trazza-line);
  z-index: 0;
}
</style>

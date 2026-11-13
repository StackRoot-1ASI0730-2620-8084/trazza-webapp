<script setup>
import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Read-only map of a route: labeled stops joined by a dashed line, the GPS track and the deviation alerts.
 */
const props = defineProps({
  stops: { type: Array, default: () => [] },
  track: { type: Array, default: () => [] },
  alerts: { type: Array, default: () => [] },
  height: { type: String, default: '22rem' }
});

const mapElement = ref();
let map = null;
let layer = null;

const stopIcon = (label, color) => L.divIcon({
  className: 'route-map-stop',
  html: `<span style="background:${color}">${label}</span>`,
  iconSize: null
});

const draw = () => {
  if (!map) return;
  layer.clearLayers();
  const bounds = [];
  const stopPoints = props.stops.filter(stop => stop.latitude !== null && stop.latitude !== undefined)
      .map(stop => [stop.latitude, stop.longitude]);
  if (stopPoints.length > 1) L.polyline(stopPoints, { color: '#5b7ad6', dashArray: '6 6', weight: 3 }).addTo(layer);
  props.stops.forEach(stop => {
    if (stop.latitude === null || stop.latitude === undefined) return;
    L.marker([stop.latitude, stop.longitude], { icon: stopIcon(stop.label, stop.color ?? '#0037b0') }).addTo(layer);
    bounds.push([stop.latitude, stop.longitude]);
  });
  const trackPoints = props.track.map(point => [point.latitude, point.longitude]);
  if (trackPoints.length) {
    L.polyline(trackPoints, { color: '#16a34a', weight: 4 }).addTo(layer);
    L.circleMarker(trackPoints[trackPoints.length - 1], { radius: 8, color: '#16a34a', fillOpacity: 1 }).addTo(layer);
    bounds.push(...trackPoints);
  }
  props.alerts.forEach(alert => L.circleMarker([alert.latitude, alert.longitude], { radius: 7, color: '#dc2626', fillOpacity: 0.7 }).addTo(layer));
  if (bounds.length) map.fitBounds(L.latLngBounds(bounds).pad(0.2));
};

onMounted(() => {
  map = L.map(mapElement.value).setView([-12.0464, -77.0428], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
  layer = L.layerGroup().addTo(map);
  draw();
});

watch(() => [props.stops, props.track, props.alerts], draw, { deep: true });
onBeforeUnmount(() => map?.remove());
</script>

<template>
  <div ref="mapElement" class="route-map" :style="{ height }"></div>
</template>

<style scoped>
.route-map {
  border-radius: 8px;
  border: 1px solid var(--trazza-line);
  z-index: 0;
}

:global(.route-map-stop span) {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .3);
}
</style>

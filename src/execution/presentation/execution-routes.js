const tripList = () => import('./views/trip-list.vue');
const tripDetail = () => import('./views/trip-detail.vue');
const iotDeviceList = () => import('./views/iot-device-list.vue');

const executionRoutes = [
    { path: 'trips',       name: 'execution-trips',       component: tripList,      meta: { title: 'option.trips' } },
    { path: 'trips/:id',   name: 'execution-trip-detail', component: tripDetail,    meta: { title: 'trip.detail-title' } },
    { path: 'iot-devices', name: 'execution-iot-devices', component: iotDeviceList, meta: { title: 'option.iot-devices', roles: ['CARRIER'] } }
];

export default executionRoutes;

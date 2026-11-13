const returnRouteList = () => import('./views/return-route-list.vue');
const returnRouteForm = () => import('./views/return-route-form.vue');
const loadSuggestions = () => import('./views/load-suggestions.vue');
const loadDetail = () => import('./views/load-detail.vue');
const freightRequestList = () => import('./views/freight-request-list.vue');
const freightRequestForm = () => import('./views/freight-request-form.vue');
const findCarriers = () => import('./views/find-carriers.vue');
const offerList = () => import('./views/offer-list.vue');
const offerDetail = () => import('./views/offer-detail.vue');

const matchmakingRoutes = [
    { path: 'return-routes',                              name: 'matchmaking-return-routes',       component: returnRouteList,    meta: { title: 'option.return-routes', roles: ['CARRIER'] } },
    { path: 'return-routes/new',                          name: 'matchmaking-return-route-new',    component: returnRouteForm,    meta: { title: 'return-route.new-title', roles: ['CARRIER'] } },
    { path: 'load-suggestions',                           name: 'matchmaking-load-suggestions',    component: loadSuggestions,    meta: { title: 'option.load-suggestions', roles: ['CARRIER'] } },
    { path: 'load-suggestions/:routeId/loads/:requestId', name: 'matchmaking-load-detail',         component: loadDetail,         meta: { title: 'load-detail.title', roles: ['CARRIER'] } },
    { path: 'freight-requests',                           name: 'matchmaking-freight-requests',    component: freightRequestList, meta: { title: 'option.freight-requests', roles: ['MERCHANT'] } },
    { path: 'freight-requests/new',                       name: 'matchmaking-freight-request-new', component: freightRequestForm, meta: { title: 'freight-request.new-title', roles: ['MERCHANT'] } },
    { path: 'freight-requests/:id/edit',                  name: 'matchmaking-freight-request-edit',component: freightRequestForm, meta: { title: 'freight-request.edit-title', roles: ['MERCHANT'] } },
    { path: 'find-carriers',                              name: 'matchmaking-find-carriers',       component: findCarriers,       meta: { title: 'option.find-carriers', roles: ['MERCHANT'] } },
    { path: 'offers',                                     name: 'matchmaking-offers',              component: offerList,          meta: { title: 'option.offers' } },
    { path: 'offers/:requestId',                          name: 'matchmaking-offer-detail',        component: offerDetail,        meta: { title: 'offer-detail.title', roles: ['MERCHANT'] } }
];

export default matchmakingRoutes;

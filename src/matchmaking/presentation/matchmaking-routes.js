const returnRouteList = () => import('./views/return-route-list.vue');
const returnRouteForm = () => import('./views/return-route-form.vue');
const routeSuggestions = () => import('./views/route-suggestions.vue');
const openShipments = () => import('./views/open-shipments.vue');
const shipmentRequestList = () => import('./views/shipment-request-list.vue');
const shipmentRequestForm = () => import('./views/shipment-request-form.vue');
const proposalList = () => import('./views/proposal-list.vue');
const proposalDetail = () => import('./views/proposal-detail.vue');

const matchmakingRoutes = [
    { path: 'return-routes',              name: 'matchmaking-return-routes',      component: returnRouteList,     meta: { title: 'option.return-routes', roles: ['CARRIER'] } },
    { path: 'return-routes/new',          name: 'matchmaking-return-route-new',   component: returnRouteForm,     meta: { title: 'return-route.new-title', roles: ['CARRIER'] } },
    { path: 'return-routes/:id',          name: 'matchmaking-route-suggestions',  component: routeSuggestions,    meta: { title: 'route-suggestions.title', roles: ['CARRIER'] } },
    { path: 'open-shipments',             name: 'matchmaking-open-shipments',     component: openShipments,       meta: { title: 'option.open-shipments', roles: ['CARRIER'] } },
    { path: 'shipment-requests',          name: 'matchmaking-shipment-requests',  component: shipmentRequestList, meta: { title: 'option.shipment-requests', roles: ['MERCHANT'] } },
    { path: 'shipment-requests/new',      name: 'matchmaking-shipment-new',       component: shipmentRequestForm, meta: { title: 'shipment.new-title', roles: ['MERCHANT'] } },
    { path: 'proposals',                  name: 'matchmaking-proposals',          component: proposalList,        meta: { title: 'option.proposals' } },
    { path: 'proposals/:id',              name: 'matchmaking-proposal-detail',    component: proposalDetail,      meta: { title: 'proposal.detail-title' } }
];

export default matchmakingRoutes;

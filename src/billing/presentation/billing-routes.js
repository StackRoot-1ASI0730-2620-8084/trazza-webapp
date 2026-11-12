const planList = () => import('./views/plan-list.vue');
const subscriptionList = () => import('./views/subscription-list.vue');
const settlementList = () => import('./views/settlement-list.vue');

const billingRoutes = [
    { path: 'plans',         name: 'billing-plans',         component: planList,         meta: { title: 'option.plans', roles: ['CARRIER'] } },
    { path: 'subscriptions', name: 'billing-subscriptions', component: subscriptionList, meta: { title: 'option.subscriptions', roles: ['CARRIER'] } },
    { path: 'settlements',   name: 'billing-settlements',   component: settlementList,   meta: { title: 'option.settlements' } }
];

export default billingRoutes;

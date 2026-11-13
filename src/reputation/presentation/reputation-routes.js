const ratingList = () => import('./views/rating-list.vue');
const loyaltyPoints = () => import('./views/loyalty-points.vue');

const reputationRoutes = [
    { path: 'ratings', name: 'reputation-ratings', component: ratingList,    meta: { title: 'option.ratings' } },
    { path: 'points',  name: 'reputation-points',  component: loyaltyPoints, meta: { title: 'option.points' } }
];

export default reputationRoutes;
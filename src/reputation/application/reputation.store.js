import {computed, reactive} from "vue";
import {ReputationApi} from "../infrastructure/reputation-api.js";
import {LoyaltyAccount, Rating} from "../domain/model/reputation.entities.js";

const api = new ReputationApi();

const state = reactive({
    received: [],
    given: [],
    loyalty: new LoyaltyAccount(),
    loaded: false
});

const averageScore = computed(() => state.received.length
    ? state.received.reduce((total, rating) => total + rating.score, 0) / state.received.length
    : null);

const toRating = resource => new Rating(resource);

async function fetchRatings() {
    const [received, given] = await Promise.all([api.listReceived(), api.listGiven()]);
    state.received = received.data.map(toRating);
    state.given = given.data.map(toRating);
    state.loaded = true;
}

async function fetchLoyalty() {
    state.loyalty = new LoyaltyAccount((await api.getPoints()).data);
}

const hasRated = tripId => state.given.some(rating => rating.tripId === tripId);

async function rateTrip({ tripId, score, comment }) {
    if (!Number.isInteger(score) || score < Rating.MIN_SCORE || score > Rating.MAX_SCORE) throw new Error('validation.score-range');
    const rating = toRating((await api.rate({ tripId, score, comment: (comment ?? '').trim() || null })).data);
    state.given.unshift(rating);
    await fetchLoyalty();
    return rating;
}

async function redeemPoints(points) {
    if (!Number.isInteger(points) || points <= 0) throw new Error('validation.points-positive');
    if (points > state.loyalty.balance) throw new Error('validation.points-insufficient');
    state.loyalty = new LoyaltyAccount((await api.redeem(points)).data);
}

const reputationStore = { state, averageScore, fetchRatings, fetchLoyalty, hasRated, rateTrip, redeemPoints };

const useReputationStore = () => reputationStore;

export default useReputationStore;
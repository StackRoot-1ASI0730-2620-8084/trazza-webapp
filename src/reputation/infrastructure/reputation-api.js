import {BaseApi} from "../../shared/infrastructure/base-api.js";

const ratingsPath = import.meta.env.VITE_RATINGS_ENDPOINT_PATH ?? '/ratings';
const loyaltyPath = import.meta.env.VITE_LOYALTY_ENDPOINT_PATH ?? '/loyalty';

export class ReputationApi extends BaseApi {
    rate(resource) { return this.http.post(ratingsPath, resource); }

    listReceived() { return this.http.get(`${ratingsPath}/received`); }

    listGiven() { return this.http.get(`${ratingsPath}/given`); }

    getSummary(userId) { return this.http.get(`${ratingsPath}/summary/${userId}`); }

    getPoints() { return this.http.get(`${loyaltyPath}/points`); }

    redeem(points) { return this.http.post(`${loyaltyPath}/redemptions`, { points }); }
}
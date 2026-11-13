export class Rating {
    static MIN_SCORE = 1;
    static MAX_SCORE = 5;

    constructor({ id, tripId, counterpartId, counterpartName, score, comment = null, createdAt }) {
        Object.assign(this, { id, tripId, counterpartId, counterpartName, score, comment, createdAt });
    }
}

export class LoyaltyEntry {
    constructor({ id, points, reason, createdAt }) {
        Object.assign(this, { id, points, reason, createdAt });
    }
}

export class LoyaltyAccount {
    constructor({ balance = 0, entries = [] } = {}) {
        this.balance = balance;
        this.entries = entries.map(entry => new LoyaltyEntry(entry));
    }
}
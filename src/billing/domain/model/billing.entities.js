export class Plan {
    constructor({ code, name, monitoringType, pricingUnit, price, currency, billingPeriod, minVehicles, maxVehicles = null, includesIotDevice }) {
        Object.assign(this, { code, name, monitoringType, pricingUnit, price, currency, billingPeriod, minVehicles, maxVehicles, includesIotDevice });
    }

    get isPackage() {
        return this.pricingUnit === 'PACKAGE';
    }

    acceptsVehicleCount(count) {
        return count >= this.minVehicles && (this.maxVehicles === null || count <= this.maxVehicles);
    }

    priceFor(count) {
        return this.isPackage ? this.price : this.price * count;
    }
}

export class Subscription {
    constructor({ id, plan, status, currentPeriodStart, currentPeriodEnd, monthlyAmount, vehicles = [], payments = [], cancelledAt = null, createdAt }) {
        Object.assign(this, { id, status, currentPeriodStart, currentPeriodEnd, monthlyAmount, vehicles, payments, cancelledAt, createdAt });
        this.plan = new Plan(plan);
    }

    get isCancelled() {
        return this.status === 'CANCELLED';
    }
}

export class FreightSettlement {
    constructor({ trip, myRole, amount, currency, status, merchantMarkedPaidAt = null, carrierConfirmedAt = null, externalReference = null }) {
        Object.assign(this, { trip, myRole, amount, currency, status, merchantMarkedPaidAt, carrierConfirmedAt, externalReference });
    }

    get canMarkPaid() {
        return this.myRole === 'MERCHANT' && this.status === 'PENDING';
    }

    get canConfirm() {
        return this.myRole === 'CARRIER' && this.status === 'MARKED_PAID';
    }
}

export class CancellationCompensation {
    constructor({ trip, myRole, amount, currency, status, createdAt, settledAt = null }) {
        Object.assign(this, { trip, myRole, amount, currency, status, createdAt, settledAt });
    }

    get isOpen() {
        return this.status === 'PENDING' || this.status === 'DISPUTED';
    }

    get canSettle() {
        return this.myRole === 'CARRIER' && this.isOpen;
    }

    get canDispute() {
        return this.myRole === 'MERCHANT' && this.status === 'PENDING';
    }
}

import Stripe from "stripe";

// Lazy-loaded Stripe SDK using a Proxy.
// The actual Stripe instance is created on first property access (at request time),
// not at module-load/build time. This avoids crashes if env vars are missing during build.
let stripeInstance: Stripe | null = null;

function getStripeInstance(): Stripe {
    if (!stripeInstance) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error("STRIPE_SECRET_KEY is not set in environment variables.");
        }
        stripeInstance = new Stripe(key, {
            typescript: true,
        });
    }
    return stripeInstance;
}

export const stripe = new Proxy({} as Stripe, {
    get(_target, prop, receiver) {
        const instance = getStripeInstance();
        const value = Reflect.get(instance, prop, receiver);
        if (typeof value === "function") {
            return value.bind(instance);
        }
        return value;
    },
});

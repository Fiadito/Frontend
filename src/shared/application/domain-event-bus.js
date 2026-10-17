/**
 * Minimal in-memory publish/subscribe bus for domain events.
 *
 * @remarks
 * Implements the Observer pattern so bounded contexts stay decoupled: IAM, Membership,
 * Catalog, Credit and Billing publish events and the Audit context subscribes to them to
 * record every operation in BITACORA (requirement of the assignment).
 */
const handlers = new Map();

export const domainEventBus = {

    /**
     * Registers a handler for an event type.
     *
     * @param {string} eventType - The event name, e.g. "SaleRegistered".
     * @param {(event: Object) => void} handler - The handler.
     * @returns {() => void} Function that removes the subscription.
     */
    subscribe(eventType, handler) {
        if (!handlers.has(eventType)) handlers.set(eventType, new Set());
        handlers.get(eventType).add(handler);
        return () => handlers.get(eventType).delete(handler);
    },

    /**
     * Publishes an event to every subscribed handler.
     *
     * @param {string} eventType - The event name.
     * @param {Object} payload - The event data.
     */
    publish(eventType, payload) {
        (handlers.get(eventType) ?? []).forEach(handler => {
            try {
                handler({type: eventType, occurredAt: new Date(), ...payload});
            } catch (error) {
                console.error(`Handler for ${eventType} failed:`, error);
            }
        });
    }
};

/**
 * Names of the domain events published in Fiadito.
 *
 * @readonly
 * @enum {string}
 */
export const DomainEvents = Object.freeze({
    SIGNED_IN: 'SignedIn',
    SIGN_IN_FAILED: 'SignInFailed',
    SIGNED_OUT: 'SignedOut',
    BUSINESS_REGISTERED: 'BusinessRegistered',
    MEMBER_REGISTERED: 'MemberRegistered',
    MEMBER_EDITED: 'MemberEdited',
    MEMBER_STATUS_CHANGED: 'MemberStatusChanged',
    PRODUCT_REGISTERED: 'ProductRegistered',
    PRODUCT_EDITED: 'ProductEdited',
    PRODUCT_STATUS_CHANGED: 'ProductStatusChanged',
    SALE_REGISTERED: 'SaleRegistered',
    PAYMENT_REGISTERED: 'PaymentRegistered',
    CUTOFF_REPORT_GENERATED: 'CutoffReportGenerated'
});

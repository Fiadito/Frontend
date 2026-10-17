import {domainEventBus, DomainEvents} from '@/shared/application/domain-event-bus.js';
import {auditStore} from '@/audit/application/audit.store.js';

/** Action and entity recorded in BITACORA for each domain event. */
const mapping = {
    [DomainEvents.SIGNED_IN]: {action: 'LOGIN', entity: 'USUARIO'},
    [DomainEvents.SIGN_IN_FAILED]: {action: 'LOGIN_FALLIDO', entity: 'USUARIO'},
    [DomainEvents.SIGNED_OUT]: {action: 'LOGOUT', entity: 'USUARIO'},
    [DomainEvents.BUSINESS_REGISTERED]: {action: 'REGISTRAR', entity: 'NEGOCIO'},
    [DomainEvents.MEMBER_REGISTERED]: {action: 'REGISTRAR', entity: 'SOCIO'},
    [DomainEvents.MEMBER_EDITED]: {action: 'EDITAR', entity: 'SOCIO'},
    [DomainEvents.MEMBER_STATUS_CHANGED]: {action: 'EDITAR', entity: 'SOCIO'},
    [DomainEvents.PRODUCT_REGISTERED]: {action: 'REGISTRAR', entity: 'PRODUCTO'},
    [DomainEvents.PRODUCT_EDITED]: {action: 'EDITAR', entity: 'PRODUCTO'},
    [DomainEvents.PRODUCT_STATUS_CHANGED]: {action: 'EDITAR', entity: 'PRODUCTO'},
    [DomainEvents.SALE_REGISTERED]: {action: 'VENDER', entity: 'VENTA'},
    [DomainEvents.PAYMENT_REGISTERED]: {action: 'PAGAR', entity: 'PAGO'},
    [DomainEvents.CUTOFF_REPORT_GENERATED]: {action: 'CONSULTAR', entity: 'VENTA'}
};

/**
 * Subscribes the Audit context to every domain event, so each operation leaves a row in BITACORA.
 *
 * @remarks
 * Every event carries {businessId, userId, userName, recordId, detail}.
 */
export const registerAuditEventHandlers = () => {
    Object.entries(mapping).forEach(([eventType, {action, entity}]) => {
        domainEventBus.subscribe(eventType, event => auditStore.record({
            businessId: event.businessId ?? null, userId: event.userId ?? null, userName: event.userName ?? '',
            action, entity, recordId: event.recordId ?? null, detail: event.detail ?? ''
        }));
    });
};

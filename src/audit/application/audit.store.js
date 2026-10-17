import {reactive} from 'vue';
import {AuditApi} from '@/audit/infrastructure/audit-api.js';
import {OperationLogAssembler} from '@/audit/infrastructure/operation-log.assembler.js';
import {OperationLog} from '@/audit/domain/model/operation-log.entity.js';

const auditApi = new AuditApi();

/**
 * Application service of the Audit context: records and lists BITACORA.
 */
export const auditStore = reactive({
    /** @type {OperationLog[]} */
    operations: [],
    loading: false,
    /** @type {string[]} */
    errors: [],

    /**
     * Loads the operations of a business (GET /bitacora).
     *
     * @param {number} businessId
     * @returns {Promise<void>}
     */
    load(businessId) {
        this.loading = true;
        this.errors = [];
        return auditApi.getByBusiness(businessId)
            .then(response => {
                this.operations = response.data.map(resource => OperationLogAssembler.toEntity(resource));
            })
            .catch(message => {
                this.errors.push(message);
            })
            .finally(() => {
                this.loading = false;
            });
    },

    /**
     * Records an operation. Failures are only logged: the main operation was already saved.
     *
     * @param {Object} props - Props of OperationLog.
     * @returns {Promise<void>}
     */
    record(props) {
        const operation = new OperationLog({...props, occurredAt: new Date().toISOString()});
        return auditApi.create(OperationLogAssembler.toResource(operation)).then(() => undefined).catch(message => {
            console.warn('No se pudo registrar en la bitácora:', message);
        });
    }
});

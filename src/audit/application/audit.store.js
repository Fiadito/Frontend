import {reactive} from 'vue';
import {AuditApi} from '@/audit/infrastructure/audit-api.js';
import {OperationLogAssembler} from '@/audit/infrastructure/operation-log.assembler.js';

const auditApi = new AuditApi();

/**
 * Application service of the Audit context: lists BITACORA (CP12).
 */
export const auditStore = reactive({
    /** @type {import('@/audit/domain/model/operation-log.entity.js').OperationLog[]} */
    operations: [],
    loading: false,
    /** @type {string[]} */
    errors: [],

    /**
     * Loads the last operations of the business of the signed-in user.
     *
     * @returns {Promise<void>}
     */
    load() {
        this.loading = true;
        this.errors = [];
        return auditApi.getOperations()
            .then(response => {
                this.operations = response.data.map(resource => OperationLogAssembler.toEntity(resource));
            })
            .catch(message => {
                this.errors.push(message);
            })
            .finally(() => {
                this.loading = false;
            });
    }
});

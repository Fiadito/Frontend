import {ref} from 'vue';
import {useToast} from 'primevue/usetoast';
import {iamStore} from '@/iam/application/iam.store.js';
import {membershipStore} from '@/membership/application/membership.store.js';
import {catalogStore} from '@/catalog/application/catalog.store.js';
import {creditStore} from '@/credit/application/credit.store.js';
import {billingStore} from '@/billing/application/billing.store.js';

/**
 * Loads what the business screens need: members, products, sales, installments and payments
 * of the signed-in business (each query filtered by idNegocio, as the backend will do with the JWT).
 *
 * @returns {{loading: import('vue').Ref<boolean>, reload: () => Promise<void>}}
 */
export const useBusinessData = () => {
    const toast = useToast();
    const loading = ref(false);

    const reload = async () => {
        const businessId = iamStore.currentUser?.businessId;
        if (!businessId) return;
        loading.value = true;
        try {
            await Promise.all([
                membershipStore.load(businessId),
                catalogStore.load(businessId),
                creditStore.load({idNegocio: businessId}),
                billingStore.load({idNegocio: businessId})
            ]);
        } catch (message) {
            toast.add({severity: 'error', summary: 'No se pudieron cargar los datos', detail: String(message), life: 6000});
        } finally {
            loading.value = false;
        }
    };

    return {loading, reload};
};

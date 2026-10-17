import {createRouter, createWebHistory} from 'vue-router';
import {iamStore} from '@/iam/application/iam.store.js';
import {UserRole} from '@/iam/domain/model/user-role.js';
import Layout from '@/shared/presentation/components/layout.vue';

const SignIn = () => import('@/iam/presentation/views/sign-in.vue');
const BusinessSignUp = () => import('@/iam/presentation/views/business-sign-up.vue');
const BusinessPanel = () => import('@/dashboard/presentation/views/business-panel.vue');
const Members = () => import('@/membership/presentation/views/members.vue');
const MemberStatement = () => import('@/dashboard/presentation/views/member-statement.vue');
const Products = () => import('@/catalog/presentation/views/products.vue');
const SaleRegistration = () => import('@/credit/presentation/views/sale-registration.vue');
const CutoffReportView = () => import('@/billing/presentation/views/cutoff-report.vue');
const PaymentRegistration = () => import('@/billing/presentation/views/payment-registration.vue');
const OperationsLog = () => import('@/audit/presentation/views/operations-log.vue');
const MyAccount = () => import('@/dashboard/presentation/views/my-account.vue');
const PageNotFound = () => import('@/shared/presentation/views/page-not-found.vue');

/**
 * Home of a signed-in user according to the role (MostrarMenuNegocio / MostrarEstadoCuenta).
 *
 * @param {import('@/iam/domain/model/user.entity.js').User|null} user
 * @returns {{name: string}}
 */
export const homeRouteFor = user => (user?.isMember() ? {name: 'my-account'} : {name: 'panel'});

const BUSINESS = UserRole.BUSINESS;

const routes = [
    {path: '/iniciar-sesion', name: 'sign-in', component: SignIn, meta: {title: 'Iniciar sesión', public: true}},
    {path: '/registrar-negocio', name: 'business-sign-up', component: BusinessSignUp, meta: {title: 'Registra tu negocio', public: true}},
    {
        path: '/',
        component: Layout,
        children: [
            {path: '', name: 'home', redirect: () => homeRouteFor(iamStore.currentUser)},
            {path: 'panel', name: 'panel', component: BusinessPanel, meta: {title: 'Panel', role: BUSINESS}},
            {path: 'socios', name: 'members', component: Members, meta: {title: 'Socios', role: BUSINESS}},
            {path: 'socios/:memberId/estado-cuenta', name: 'member-statement', component: MemberStatement, props: true, meta: {title: 'Estado de cuenta', role: BUSINESS}},
            {path: 'productos', name: 'products', component: Products, meta: {title: 'Productos', role: BUSINESS}},
            {path: 'ventas/nueva', name: 'sale-registration', component: SaleRegistration, meta: {title: 'Registrar venta', role: BUSINESS}},
            {path: 'reportes/corte', name: 'cutoff-report', component: CutoffReportView, meta: {title: 'Reporte de corte', role: BUSINESS}},
            {path: 'pagos/nuevo', name: 'payment-registration', component: PaymentRegistration, meta: {title: 'Registrar pago', role: BUSINESS}},
            {path: 'bitacora', name: 'operations-log', component: OperationsLog, meta: {title: 'Bitácora', role: BUSINESS}},
            {path: 'mi-estado-de-cuenta', name: 'my-account', component: MyAccount, meta: {title: 'Mi estado de cuenta', role: UserRole.MEMBER}}
        ]
    },
    {path: '/:pathMatch(.*)*', name: 'not-found', component: PageNotFound, meta: {title: 'Página no encontrada', public: true}}
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior: () => ({top: 0})
});

/**
 * Navigation guard (control por rol): private routes need a session (CP03) and each role
 * only opens its own screens (CP04: a member cannot open Registrar venta).
 */
router.beforeEach(to => {
    const user = iamStore.currentUser;
    if (to.meta.public) {
        if (['sign-in', 'business-sign-up'].includes(to.name) && user) return homeRouteFor(user);
        return true;
    }
    if (!user) return {name: 'sign-in', query: {redirect: to.fullPath}};
    if (to.meta.role && to.meta.role !== user.role) return {...homeRouteFor(user), query: {denied: '1'}};
    return true;
});

router.afterEach(to => {
    document.title = `${to.meta.title ?? 'Fiadito'} | Fiadito`;
});

export default router;

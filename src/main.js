import {createApp} from 'vue';
import './style.css';
import App from './App.vue';
import router from '@/router/index.js';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Aura from '@primeuix/themes/aura';
import {definePreset} from '@primeuix/themes';
import 'primeicons/primeicons.css';
import {
    Button, Column, ConfirmDialog, DataTable, DatePicker, Dialog, IconField, InputIcon, InputGroup, InputGroupAddon,
    InputNumber, InputText, Message, Password, Select, SelectButton, Tag, Toast, Tooltip
} from 'primevue';
import {iamStore} from '@/iam/application/iam.store.js';

/**
 * Fiadito theme: Aura preset with the blue of the Figma mockups (#0D6EFD) as primary color.
 */
const FiaditoPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#eef5ff', 100: '#d9e8ff', 200: '#bcd7ff', 300: '#8ebdff', 400: '#5999fe', 500: '#0d6efd',
            600: '#0b5ed7', 700: '#0a4fb3', 800: '#0c4290', 900: '#0f3976', 950: '#0b244b'
        }
    }
});

const primeUiLicenseKey = import.meta.env.VITE_PRIME_UI_LICENSE_KEY;

iamStore.restoreSession();

createApp(App)
    .use(router)
    .use(PrimeVue, {
        ripple: true,
        license: primeUiLicenseKey,
        theme: {preset: FiaditoPreset, options: {darkModeSelector: false}},
        locale: {
            accept: 'Sí', reject: 'No', choose: 'Elegir', cancel: 'Cancelar', clear: 'Limpiar', today: 'Hoy',
            emptyMessage: 'Sin resultados', emptyFilterMessage: 'Sin resultados', firstDayOfWeek: 1, dateFormat: 'dd/mm/yy',
            dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
            dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
            dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
            monthNames: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
            monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
        }
    })
    .use(ToastService)
    .use(ConfirmationService)
    .component('pv-button', Button)
    .component('pv-column', Column)
    .component('pv-confirm-dialog', ConfirmDialog)
    .component('pv-data-table', DataTable)
    .component('pv-date-picker', DatePicker)
    .component('pv-dialog', Dialog)
    .component('pv-icon-field', IconField)
    .component('pv-input-icon', InputIcon)
    .component('pv-input-group', InputGroup)
    .component('pv-input-group-addon', InputGroupAddon)
    .component('pv-input-number', InputNumber)
    .component('pv-input-text', InputText)
    .component('pv-message', Message)
    .component('pv-password', Password)
    .component('pv-select', Select)
    .component('pv-select-button', SelectButton)
    .component('pv-tag', Tag)
    .component('pv-toast', Toast)
    .directive('tooltip', Tooltip)
    .mount('#app');

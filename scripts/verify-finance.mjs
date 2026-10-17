// Verifies the financial model against "Tabla 11. Pruebas del cálculo financiero" of the report.
// Run: npm run test:finance
import './register-alias.mjs';

const {CalendarDate} = await import('@/shared/domain/model/calendar-date.js');
const {EffectiveRate} = await import('@/shared/domain/model/effective-rate.js');
const {PaymentCalendar} = await import('@/credit/domain/model/payment-calendar.js');
const {InstallmentSchedule} = await import('@/credit/domain/model/installment-schedule.js');
const {LateInterest} = await import('@/billing/domain/model/late-interest.js');
const {CreditSale} = await import('@/credit/domain/model/credit-sale.entity.js');
const {Member} = await import('@/membership/domain/model/member.entity.js');
const {Product} = await import('@/catalog/domain/model/product.entity.js');

let failed = 0;
const check = (name, actual, expected) => {
    const ok = String(actual) === String(expected);
    if (!ok) failed++;
    console.log(`${ok ? '✔' : '✘'} ${name}: ${actual}${ok ? '' : `  (esperado ${expected})`}`);
};
const money = value => value.toFixed(2);

console.log('\nJuego 1 – CP07 (100 × X-B Piña S/ 5.00, compra 05/10/2026, 8 cuotas)');
const xb = new Product({id: 1, businessId: 1, description: 'Bebida energizante sabor Piña', brand: 'X-B', unit: 'Botella', cashPrice: 5, listPrice: 5});
const carla = new Member({id: 1, businessId: 1, dni: '72458813', fullName: 'Carla Mendoza Ríos', creditLimit: 1000});
const sim1 = CreditSale.simulate({member: carla, product: xb, quantity: 100, purchaseDateTime: '2026-10-05T10:00', paymentMode: 'CUOTAS',
    installmentCount: 8, memberCapitalDebt: 0, today: CalendarDate.from('2026-10-17')});
check('Sin errores de validación', sim1.errors.length, 0);
check('Monto de la compra', money(sim1.sale.amount), '500.00');
check('Fecha de la primera cuota', sim1.schedule[0].dueDate.format(), '15/10/2026');
check('Cuota fija', money(sim1.sale.installmentAmount), '62.50');
check('Fecha de la última cuota', sim1.schedule[7].dueDate.format(), '30/01/2027');
check('Total a pagar (8 cuotas)', money(sim1.schedule.reduce((s, r) => s + r.amount, 0)), '500.00');
check('Fechas de pago', sim1.schedule.map(r => r.dueDate.format().slice(0, 5)).join(' '), '15/10 30/10 15/11 30/11 15/12 30/12 15/01 30/01');
check('Saldo final de la cuota 8', money(sim1.schedule[7].closingBalance), '0.00');

console.log('\nJuego 2 – CP08/CP09 (cuota 2 pagada el 04/11/2026, TEA moratoria 60 %)');
check('Cuota 2: monto y fecha', `${money(sim1.schedule[1].amount)} ${sim1.schedule[1].dueDate.format()}`, '62.50 30/10/2026');
const tea60 = new EffectiveRate('TEA', 0.60);
check('TED moratoria desde TEA 60 %', tea60.toDaily().toFixed(7), '0.0013064');
const quote = LateInterest.quote({amount: 62.50, dueDate: '2026-10-30', paymentDate: '2026-11-04', lateRate: tea60});
check('Días de mora', quote.lateDays, 5);
check('Interés moratorio (5 días)', money(quote.lateInterest), '0.41');
check('Total pagado de la cuota 2', money(quote.total), '62.91');
check('Imputación mora / capital', `${money(quote.lateImputation)} / ${money(quote.capitalImputation)}`, '0.41 / 62.50');
check('CP10: pago parcial rechazado', LateInterest.isFullPayment(60, quote.total), false);
check('Pago puntual sin mora', LateInterest.quote({amount: 62.5, dueDate: '2026-10-30', paymentDate: '2026-10-30', lateRate: tea60}).lateInterest, 0);
check('TEM equivalente a TEA 60 %', (tea60.toPeriod('TEM') * 100).toFixed(4) + '%', '3.9944%');

console.log('\nJuego 3 – Compra posterior al corte (90 × S/ 5.00, compra 26/10/2026)');
const sim3 = CreditSale.simulate({member: carla, product: xb, quantity: 90, purchaseDateTime: '2026-10-26T18:00', paymentMode: 'CUOTAS',
    installmentCount: 8, memberCapitalDebt: 0, today: CalendarDate.from('2026-10-26')});
check('Monto de la compra', money(sim3.sale.amount), '450.00');
check('Fecha de la primera cuota', sim3.schedule[0].dueDate.format(), '15/11/2026');
check('Cuota fija', money(sim3.sale.installmentAmount), '56.25');
check('Fecha de la última cuota', sim3.schedule[7].dueDate.format(), '28/02/2027');

console.log('\nReglas de corte y validaciones');
check('Compra 10/10 23:59 → paga 15/10', PaymentCalendar.firstPaymentDate('2026-10-10T23:59').format(), '15/10/2026');
check('Compra 11/10 → paga 30/10', PaymentCalendar.firstPaymentDate('2026-10-11T08:00').format(), '30/10/2026');
check('Compra 20/02/2027 → paga 28/02', PaymentCalendar.firstPaymentDate('2027-02-20T08:00').format(), '28/02/2027');
check('Corte 25/10 → pago 30/10', PaymentCalendar.paymentDateOfCutoff('2026-10-25').format(), '30/10/2026');
const sim6 = CreditSale.simulate({member: new Member({id: 2, businessId: 1, dni: '70984512', fullName: 'Luis Ramírez', creditLimit: 500}),
    product: xb, quantity: 100, purchaseDateTime: '2026-10-12T10:00', paymentMode: 'CUOTAS', installmentCount: 8, memberCapitalDebt: 62.5, today: CalendarDate.from('2026-10-17')});
check('CP06: crédito insuficiente', sim6.errors.some(e => e.includes('excede')), true);
check('CP05: límite S/ 1200 rechazado', new Member({businessId: 1, dni: '12345678', fullName: 'Prueba', creditLimit: 1200}).validate().some(e => e.includes('límite')), true);
check('Tasa moratoria 30 % rechazada', new Member({businessId: 1, dni: '12345678', fullName: 'Prueba', lateRateValue: 0.3}).validate().some(e => e.includes('40')), true);
check('Monto 395 rechazado', CreditSale.simulate({member: carla, product: new Product({id: 9, businessId: 1, description: 'Proteína', brand: 'ON', unit: 'Bolsa', cashPrice: 395, listPrice: 395}),
    quantity: 1, purchaseDateTime: '2026-10-12T10:00', paymentMode: 'PAGO_UNICO', installmentCount: 1, memberCapitalDebt: 0, today: CalendarDate.from('2026-10-17')}).errors.some(e => e.includes('400')), true);
check('Redondeo absorbido en la última cuota (S/ 430 en 8)', InstallmentSchedule.build(430, CalendarDate.from('2026-10-15'), 8).map(r => r.amount).join(','), '53.75,53.75,53.75,53.75,53.75,53.75,53.75,53.75');
check('S/ 1000 en 3 cuotas', InstallmentSchedule.build(1000, CalendarDate.from('2026-10-15'), 3).map(r => money(r.amount)).join(','), '333.33,333.33,333.34');

console.log(failed === 0 ? '\nTodas las pruebas pasaron ✔\n' : `\n${failed} prueba(s) fallaron ✘\n`);
process.exit(failed === 0 ? 0 : 1);

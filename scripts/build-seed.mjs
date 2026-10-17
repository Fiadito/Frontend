// Builds server/db.json (Fake API data) with the data of the report: Fuerza Norte Gym, the
// products of Tabla 4 and the test data of section 6 d). Amounts and plans are computed with the
// same domain code the web application uses, so they always match.
// Run: npm run seed   (it overwrites server/db.json)
import './register-alias.mjs';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const {CalendarDate} = await import('@/shared/domain/model/calendar-date.js');
const {EffectiveRate} = await import('@/shared/domain/model/effective-rate.js');
const {PaymentCalendar} = await import('@/credit/domain/model/payment-calendar.js');
const {InstallmentSchedule} = await import('@/credit/domain/model/installment-schedule.js');
const {LateInterest} = await import('@/billing/domain/model/late-interest.js');
const {roundMoney} = await import('@/shared/domain/model/rounding.js');

const hash = password => createHash('sha256').update(`fiadito:${password}`).digest('hex');
const BUSINESS_PASSWORD = 'Fiadito2026!';
const MEMBER_PASSWORD = 'Socio2026!';

const db = {negocios: [], usuarios: [], socios: [], productos: [], ventas: [], cuotas: [], pagos: [], bitacora: []};

// ---------- Negocio y su cuenta ----------
db.negocios.push({id: 1, ruc: '20605478123', nombreComercial: 'Fuerza Norte Gym', giro: 'Gimnasio', direccion: 'Av. Universitaria 4520, Los Olivos', fechaRegistro: '2026-09-01T09:00:00.000Z'});
db.usuarios.push({id: 1, idNegocio: 1, idSocio: null, nombre: 'Josué Flores', correo: 'josue.flores@fuerzanorte.pe', claveHash: hash(BUSINESS_PASSWORD), rol: 'NEGOCIO'});

// ---------- Productos (Tabla 4 del informe) ----------
const catalog = [
    ['Cielo', 'Botella', 'Agua mineral', 2.00, 'agua'],
    ['Cielo', 'Botella', 'Agua mineral 1 litro', 2.50, 'agua'],
    ['Hey Fit', 'Botella', 'Bebida funcional sabor Piña - Coco', 3.00, 'bebida'],
    ['Hey Fit', 'Botella', 'Bebida funcional sabor Toronja - Camu Camu', 3.00, 'bebida'],
    ['Hey Fit', 'Botella', 'Bebida funcional sabor Golden Fizz', 3.00, 'bebida'],
    ['Hey Fit', 'Botella', 'Bebida funcional sabor Black Fizz', 3.00, 'bebida'],
    ['Hey Fit', 'Lata', 'Bebida funcional sabor Piña - Coco', 3.50, 'lata'],
    ['Hey Fit', 'Lata', 'Bebida funcional sabor Toronja - Camu Camu', 3.50, 'lata'],
    ['Hey Fit', 'Lata', 'Bebida funcional sabor Golden Fizz', 3.50, 'lata'],
    ['Hey Fit', 'Lata', 'Bebida funcional sabor Black Fizz', 3.50, 'lata'],
    ['Gatorade', 'Botella', 'Bebida rehidratante sabor Tropical', 2.50, 'bebida'],
    ['Gatorade', 'Botella', 'Bebida rehidratante sabor Ponche de Frutas', 2.50, 'bebida'],
    ['Volt', 'Botella', 'Bebida energizante', 3.00, 'energizante'],
    ['Volt', 'Lata', 'Bebida energizante', 3.50, 'lata'],
    ['X-B', 'Botella', 'Bebida energizante sabor Piña', 5.00, 'energizante'],
    ['X-B', 'Botella', 'Bebida energizante sabor Guaraná', 5.00, 'energizante'],
    ['X-B', 'Botella', 'Bebida energizante sabor Blueberry', 5.00, 'energizante'],
    ['Optimum Nutrition', 'Frasco', 'Proteína whey 1 kg sabor Chocolate', 185.00, 'proteina'],
    ['Optimum Nutrition', 'Frasco', 'Proteína whey 1 kg sabor Vainilla', 185.00, 'proteina'],
    ['Optimum Nutrition', 'Bolsa', 'Proteína whey 2.5 kg sabor Chocolate', 395.00, 'proteina'],
    ['Dymatize ISO100', 'Bolsa', 'Proteína aislada de suero 2.5 kg sabor Vainilla', 420.00, 'proteina'],
    ['MuscleTech Nitro-Tech', 'Frasco', 'Proteína whey con creatina 2 kg sabor Chocolate', 320.00, 'proteina'],
    ['Optimum Nutrition', 'Barra', 'Barra de proteína sabor Chocolate', 11.00, 'barra'],
    ['Quest', 'Barra', 'Barra de proteína sabor Cookies & Cream', 12.00, 'barra'],
    ['Optimum Nutrition', 'Pote', 'Creatina monohidratada 300 g', 110.00, 'creatina'],
    ['Fuerza Norte', 'Unidad', 'Shaker mezclador de 600 ml', 25.00, 'shaker']
];
catalog.forEach(([marca, unidadMedida, descripcion, precio, imagen], index) => db.productos.push({
    id: index + 1, idNegocio: 1, descripcion, marca, proveedor: marca === 'Fuerza Norte' ? 'Fuerza Norte Gym' : 'Distribuidora Deportiva SAC',
    unidadMedida, imagenUrl: `/images/products/${imagen}.svg`, precioContado: precio, precioLista: precio, modalidadVenta: 'AMBAS', estado: 'ACTIVO'
}));
const productId = description => db.productos.find(p => `${p.marca} ${p.descripcion}` === description).id;

// ---------- Socios ----------
const members = [
    {dni: '72458813', nombres: 'Carla Mendoza Ríos', celular: '987451220', direccion: 'Calle Los Pinos 118, Los Olivos', limiteCredito: 1000, valorTasaMora: 0.60, correo: 'carla.mendoza@correo.pe'},
    {dni: '70984512', nombres: 'Luis Ramírez Paredes', celular: '956321478', direccion: 'Jr. Las Gardenias 230, Comas', limiteCredito: 1000, valorTasaMora: 0.60, correo: 'luis.ramirez@correo.pe'},
    {dni: '43125678', nombres: 'Ana Torres Vega', celular: '945112233', direccion: 'Av. Naranjal 845, Independencia', limiteCredito: 800, valorTasaMora: 0.60, correo: 'ana.torres@correo.pe'},
    {dni: '87654321', nombres: 'Diego Salazar Cruz', celular: '912345678', direccion: 'Calle Las Magnolias 77, Los Olivos', limiteCredito: 600, valorTasaMora: 0.60, correo: 'diego.salazar@correo.pe'},
    {dni: '98765432', nombres: 'Jorge Castillo Rojas', celular: '934567812', direccion: 'Av. Carlos Izaguirre 1500, Los Olivos', limiteCredito: 800, valorTasaMora: 0.50, correo: 'jorge.castillo@correo.pe'},
    {dni: '23456789', nombres: 'María López Gómez', celular: '967812345', direccion: 'Jr. Huánuco 410, San Martín de Porres', limiteCredito: 700, valorTasaMora: 0.60, correo: '', estado: 'INACTIVO'},
    {dni: '30567891', nombres: 'Valeria Núñez Soto', celular: '978123456', direccion: 'Calle Los Cedros 59, Los Olivos', limiteCredito: 1000, valorTasaMora: 0.45, correo: ''}
];
members.forEach((m, index) => {
    const id = index + 1;
    db.socios.push({
        id, idNegocio: 1, dni: m.dni, nombres: m.nombres, celular: m.celular, direccion: m.direccion, moneda: 'PEN', periodoTasaMora: 'TEA',
        valorTasaMora: m.valorTasaMora, limiteCredito: m.limiteCredito, maxCuotas: 8, estado: m.estado ?? 'ACTIVO'
    });
    if (m.correo) db.usuarios.push({id: db.usuarios.length + 1, idNegocio: 1, idSocio: id, nombre: m.nombres, correo: m.correo, claveHash: hash(MEMBER_PASSWORD), rol: 'SOCIO'});
});
const memberId = dni => db.socios.find(s => s.dni === dni).id;

// ---------- Ventas, cuotas y pagos ----------
const log = (fechaHora, accion, entidad, idRegistro, detalle) => db.bitacora.push({
    id: db.bitacora.length + 1, idNegocio: 1, idUsuario: 1, usuario: 'Josué Flores', fechaHora, accion, entidad, idRegistro, detalle, ip: 'localhost'
});

const addSale = ({dni, product, quantity, purchase, mode, n}) => {
    const p = db.productos.find(item => item.id === productId(product));
    const monto = roundMoney(p.precioLista * quantity);
    const fechaPago = PaymentCalendar.firstPaymentDate(purchase);
    const count = mode === 'CUOTAS' ? n : 1;
    const venta = {
        id: db.ventas.length + 1, idNegocio: 1, idSocio: memberId(dni), idProducto: p.id, cantidad: quantity, precioLista: p.precioLista, monto,
        fechaHoraCompra: purchase, modalidad: mode, nCuotas: count, fechaPago: fechaPago.toIsoString(),
        cuota: mode === 'CUOTAS' ? InstallmentSchedule.fixedInstallment(monto, n) : monto, totalAPagar: monto, estado: 'PENDIENTE'
    };
    db.ventas.push(venta);
    if (mode === 'CUOTAS') {
        InstallmentSchedule.build(monto, fechaPago, n).forEach(row => db.cuotas.push({
            id: db.cuotas.length + 1, idVenta: venta.id, idNegocio: 1, idSocio: venta.idSocio, numero: row.number, fechaVencimiento: row.dueDate.toIsoString(),
            saldoInicial: row.openingBalance, amortizacion: row.amortization, montoCuota: row.amount, saldoFinal: row.closingBalance, estado: 'PENDIENTE'
        }));
    }
    log(`${purchase}:00.000Z`, 'VENDER', 'VENTA', venta.id, `Venta: ${quantity} × ${product} = S/ ${monto.toFixed(2)} (${mode === 'CUOTAS' ? `${n} cuotas` : 'pago único'})`);
    return venta;
};

const payInstallment = (venta, numero, fechaPagoReal, medioPago) => {
    const cuota = db.cuotas.find(c => c.idVenta === venta.id && c.numero === numero);
    const socio = db.socios.find(s => s.id === venta.idSocio);
    const quote = LateInterest.quote({amount: cuota.montoCuota, dueDate: cuota.fechaVencimiento, paymentDate: fechaPagoReal, lateRate: new EffectiveRate(socio.periodoTasaMora, socio.valorTasaMora)});
    const pago = {
        id: db.pagos.length + 1, idNegocio: 1, idVenta: venta.id, idCuota: cuota.id, idSocio: venta.idSocio, fechaPagoReal, diasMora: quote.lateDays,
        tedMora: quote.dailyRate, interesMora: quote.lateInterest, totalPagado: quote.total, imputacionMora: quote.lateImputation,
        imputacionCapital: quote.capitalImputation, medioPago, fechaRegistro: `${fechaPagoReal}T18:00:00.000Z`
    };
    db.pagos.push(pago);
    cuota.estado = 'PAGADA';
    log(pago.fechaRegistro, 'PAGAR', 'PAGO', pago.id, `Pago de ${socio.nombres} – Cuota ${numero} de ${venta.nCuotas}: S/ ${quote.total.toFixed(2)} (mora S/ ${quote.lateInterest.toFixed(2)}, ${quote.lateDays} días)`);
};

// Jorge: 2 × MuscleTech (S/ 640) en 4 cuotas; pagó la 1 con 2 días de atraso; la 2 (15/10) está vencida.
const jorge = addSale({dni: '98765432', product: 'MuscleTech Nitro-Tech Proteína whey con creatina 2 kg sabor Chocolate', quantity: 2, purchase: '2026-09-20T19:00', mode: 'CUOTAS', n: 4});
payInstallment(jorge, 1, '2026-10-02', 'YAPE');
// Juego 2 (CP08–CP09): Luis, 100 × X-B Piña (S/ 500) en 8 cuotas; pagó la cuota 1 a tiempo. La cuota 2 vence el 30/10/2026.
const luis = addSale({dni: '70984512', product: 'X-B Bebida energizante sabor Piña', quantity: 100, purchase: '2026-10-08T10:30', mode: 'CUOTAS', n: 8});
payInstallment(luis, 1, '2026-10-15', 'EFECTIVO');
// Diego: Dymatize ISO100 (S/ 420) a pago único, compra 12/10 → paga el 30/10.
addSale({dni: '87654321', product: 'Dymatize ISO100 Proteína aislada de suero 2.5 kg sabor Vainilla', quantity: 1, purchase: '2026-10-12T17:15', mode: 'PAGO_UNICO'});

db.bitacora.unshift(
    {id: 0, idNegocio: 1, idUsuario: 1, usuario: 'Josué Flores', fechaHora: '2026-09-01T09:00:00.000Z', accion: 'REGISTRAR', entidad: 'NEGOCIO', idRegistro: 1, detalle: 'Registro del negocio Fuerza Norte Gym (RUC 20605478123)', ip: 'localhost'}
);
db.bitacora = db.bitacora.sort((a, b) => a.fechaHora.localeCompare(b.fechaHora)).map((item, index) => ({...item, id: index + 1}));

const target = fileURLToPath(new URL('../server/db.json', import.meta.url));
writeFileSync(target, `${JSON.stringify(db, null, 2)}\n`);
console.log(`db.json generado: ${db.socios.length} socios, ${db.productos.length} productos, ${db.ventas.length} ventas, ${db.cuotas.length} cuotas, ${db.pagos.length} pagos.`);
console.log(`Negocio: josue.flores@fuerzanorte.pe / ${BUSINESS_PASSWORD}   ·   Socios: carla.mendoza@correo.pe (y otros) / ${MEMBER_PASSWORD}`);

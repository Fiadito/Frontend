# Fiadito Web Application

Frontend de **Fiadito** (SI642 Finanzas e Ingeniería Económica – UPC): control de fiados de un negocio (Fuerza Norte Gym) con
ventas a pago único o en cuotas quincenales iguales, reporte de corte, interés moratorio y estado de cuenta del socio.

Hecho con **Vue 3 + PrimeVue 5 + Vue Router + Axios**. Por ahora consume una **Fake API** (json-server) con las mismas rutas que
la API REST del informe (`/api/v1/...`). Cuando el backend en Spring Boot esté listo solo cambia `VITE_FIADITO_API_URL`.

## Cómo ejecutarlo (WebStorm)

```bash
npm install
npm run fake-api      # terminal 1 → http://localhost:3000/api/v1
npm run dev           # terminal 2 → http://localhost:5173
```

| Rol | Correo | Contraseña |
|---|---|---|
| NEGOCIO | josue.flores@fuerzanorte.pe | Fiadito2026! |
| SOCIO | carla.mendoza@correo.pe · luis.ramirez@correo.pe · jorge.castillo@correo.pe · diego.salazar@correo.pe · ana.torres@correo.pe | Socio2026! |

Otros scripts:

- `npm run seed`: regenera `server/db.json` con los datos iniciales (borra lo que hayas registrado).
- `npm run test:finance`: comprueba el modelo financiero con los valores de la **Tabla 11** del informe (TED 0.0013064, mora S/ 0.41, total S/ 62.91, fechas de cuotas, etc.).
- `npm run build`: compila para producción.

Si usan licencia de PrimeUI, pongan `VITE_PRIME_UI_LICENSE_KEY` en un archivo `.env.local` (no se sube a Git).

## Modelo financiero (informe aceptado)

- Sin interés compensatorio: cuota fija `C = P / n`, de 1 a 8 cuotas quincenales (4 meses); la última cuota absorbe el redondeo.
- Cortes: días 10 y 25 hasta las 23:59. Pagos: días 15 y 30 (o último día del mes).
- Tasa efectiva moratoria pactada (TEA, TES, TET, TEM o TEQ), mínimo 40 % (por defecto TEA 60 %): `TED = (1 + TEP)^(1/N) − 1`.
- Mora: `Imor = D × ((1 + TED)^dm − 1)`; el pago debe ser igual al total (sin pagos parciales) y se imputa mora → capital.
- Límite de crédito y monto de compra entre S/ 400.00 y S/ 1,000.00. Montos a 2 decimales y tasas a 7.

## Estructura (bounded contexts, DDD)

```
src/
  shared/      CalendarDate, EffectiveRate, redondeo, reloj del sistema, BaseApi, layout y componentes comunes
  iam/         Iniciar sesión, Registra tu negocio, sesión y roles (NEGOCIO / SOCIO)
  membership/  Socios y sus condiciones de crédito (+ conversión de la tasa moratoria)
  catalog/     Productos y modalidades de venta
  credit/      Registrar venta, calendario de cortes/pagos y plan de pagos en cuotas
  billing/     Obligaciones, Reporte de corte, Registrar pago (mora e imputación), estado de cuenta
  dashboard/   Panel del negocio y Mi estado de cuenta del socio
  audit/       Bitácora (cada operación publica un evento de dominio que se guarda en /bitacora)
```

Cada contexto tiene `domain` (reglas y fórmulas, sin Vue), `infrastructure` (API + assemblers), `application` (stores) y
`presentation` (vistas). Las fórmulas están en `credit/domain/model` y `billing/domain/model`.

## Datos de prueba (sección 6 d y Tabla 12)

- **CP07**: registra a *Carla Mendoza* 100 × X-B Piña con fecha 05/10/2026 en 8 cuotas → S/ 62.50 del 15/10/2026 al 30/01/2027.
- **CP08**: Reporte de corte del 25/10/2026 → cuota 2 de Luis (y de Carla si ya hiciste CP07) a pagar el 30/10/2026.
- **CP09**: Registrar pago de la cuota 2 de *Luis Ramírez* con fecha real 04/11/2026 → 5 días, mora S/ 0.41, total S/ 62.91.
- **CP10**: con la misma obligación escribe un monto menor → se rechaza el pago parcial.
- **Juego 3** (compra 26/10/2026): como la fecha de compra no puede ser futura, para probarlo antes de esa fecha define
  `VITE_SYSTEM_DATE="2026-10-26"` en `.env.local` (simula el “hoy” del sistema) y reinicia `npm run dev`.
- Jorge Castillo tiene una cuota vencida (aparece “Con mora”) y Diego Salazar una compra a pago único.

## Pendiente para el backend

json-server no tiene seguridad ni transacciones: el login compara un hash SHA-256 en el navegador y la venta guarda sus cuotas
una por una. En Spring Boot serán `POST /auth/login` con JWT + BCrypt, respuestas 401/403 (CP03, CP04) y transacciones.
En el frontend ya existen las guardas de ruta por rol. Los recursos llevan `idNegocio` solo para que la Fake API pueda filtrar.

# Fiadito – Frontend

Frontend de **Fiadito** (SI642 Finanzas e Ingeniería Económica – UPC): control de fiados de un negocio (Fuerza Norte Gym) con
ventas a pago único o en cuotas quincenales iguales, reporte de corte, interés moratorio y estado de cuenta del socio.

**Vue 3 + PrimeVue 5 + Vue Router + Axios**, conectado al backend **Spring Boot** (repositorio `Fiadito/Backend`) en
`http://localhost:8080/api/v1`. El inicio de sesión devuelve un **JWT** que se envía en cada petición
(`Authorization: Bearer <token>`).

## Cómo ejecutarlo (WebStorm)

1. Levanta primero el backend en IntelliJ (ver su README). Crea las tablas y los datos iniciales.
2. En este proyecto:

```bash
npm install
npm run dev      # http://localhost:5173
```

| Rol | Correo | Contraseña |
|---|---|---|
| NEGOCIO | josue.flores@fuerzanorte.pe | Fiadito2026! |
| SOCIO | carla.mendoza@correo.pe · luis.ramirez@correo.pe · jorge.castillo@correo.pe · diego.salazar@correo.pe · ana.torres@correo.pe | Socio2026! |

Si usan licencia de PrimeUI, pongan `VITE_PRIME_UI_LICENSE_KEY` en un archivo `.env.local` (no se sube a Git).

## Qué hace cada lado

- **Backend:** valida y calcula todo (fecha de pago según el corte, plan francés con la TEQ de la venta, TED, interés moratorio,
  imputación, reporte de corte, estado de cuenta) y registra cada operación en la BITACORA.
- **Frontend:** formularios, tablas y resúmenes; guardas de ruta por rol (NEGOCIO / SOCIO). Las conversiones de tasas se muestran
  en vivo (7 decimales en %), pero el backend vuelve a validar.

## Cambios pedidos por el profesor

- **Tasa efectiva en cada venta** (ya no en el socio), con TEA equivalente entre **15 % y 27 %**; se puede cambiar después desde
  el **plan de pagos** (botón *Cambiar tasa*): las cuotas pagadas no cambian y las pendientes se recalculan.
- **Plan de pagos con interés** (columna *Interés*, método francés) y **botón “Plan de pagos”** en Socios, Panel, Registrar venta y Registrar pago.
- **Tasa moratoria solo si está vencido**: aparece en *Registrar pago* cuando la fecha real pasa el vencimiento (TEA 60 % por defecto).
- **Combos** de S/ 100, 200 y 400 en *Productos*; en *Registrar venta* aparecen primero y hay un botón *Usar mínimo* para llegar a S/ 400.
- **Conversión quincenal → diaria corregida**: las tasas se guardan con 7 decimales en porcentaje y los rangos se validan sobre la TEA equivalente.
- No se puede registrar dos veces la misma venta o pago con doble clic / doble Enter, ni un pago con fecha futura.

## Servicios que usa (Tabla 7 del informe)

`POST /auth/login`, `POST /auth/registro-negocio`, `POST /auth/logout`, `GET/POST/PUT /socios`, `PATCH /socios/{id}/estado`,
`GET/POST/PUT /productos`, `PATCH /productos/{id}/estado`, `POST /ventas/simulacion`, `POST /ventas`, `GET /ventas/{id}`,
`PATCH /ventas/{id}/tasa`, `GET /panel`,
`GET /reportes/cortes`, `GET /reportes/corte?fecha=`, `GET /obligaciones?estado=PENDIENTE`, `POST /pagos/cotizacion`,
`POST /pagos`, `GET /pagos`, `GET /socios/me/estado-cuenta`, `GET /socios/{id}/estado-cuenta`, `GET /bitacora`.

## Estructura (bounded contexts, DDD)

```
src/
  shared/      BaseApi (axios + token), formatos, layout y componentes comunes
  iam/         Iniciar sesión, Registra tu negocio, sesión con JWT y roles
  membership/  Socios y sus condiciones de crédito
  catalog/     Productos y modalidades de venta
  credit/      Registrar venta (simulación y plan de pagos)
  billing/     Reporte de corte, Registrar pago, estado de cuenta
  dashboard/   Panel del negocio y Mi estado de cuenta del socio
  audit/       Bitácora
```

## Casos de prueba (Tabla 12)

- **CP07**: Registrar venta a *Carla Mendoza*, 2 × ON Creatina 600 g (S/ 250 c/u), fecha 05/10/2026, 8 cuotas, TEA 20 % → cuota S/ 64.66
  (interés total S/ 17.32) del 15/10/2026 al 30/01/2027.
- **CP08**: Reporte de corte del 25/10/2026 → cuota 2 de Luis y de Carla a pagar el 30/10/2026.
- **CP09**: Registrar pago de la cuota 2 de *Luis Ramírez* con fecha 04/11/2026 → vencida 5 días; con TEA 60 % la mora es S/ 0.42
  y el total S/ 65.08 (mora 0.42 → interés 3.35 → capital 61.31).
- **CP10**: con la misma obligación escribe un monto menor → el backend rechaza el pago parcial.
- **CP03 / CP04**: sin sesión la API responde 401; un socio que intenta registrar una venta recibe 403.
- **Juego 3** (compra 26/10/2026): para ensayarlo antes de esa fecha, pon `SYSTEM_DATE=2026-10-26` en el `.env` del backend
  y `VITE_SYSTEM_DATE="2026-10-26"` en `.env.local` del frontend.

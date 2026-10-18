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

- **Backend:** valida y calcula todo (fecha de pago según el corte, cuota `C = P / n`, TED, interés moratorio, imputación,
  reporte de corte, estado de cuenta) y registra cada operación en la BITACORA.
- **Frontend:** formularios, tablas y resúmenes; guardas de ruta por rol (NEGOCIO / SOCIO). La conversión de la tasa
  moratoria del formulario de socio se muestra en vivo, pero el backend vuelve a validar.

## Servicios que usa (Tabla 7 del informe)

`POST /auth/login`, `POST /auth/registro-negocio`, `POST /auth/logout`, `GET/POST/PUT /socios`, `PATCH /socios/{id}/estado`,
`GET/POST/PUT /productos`, `PATCH /productos/{id}/estado`, `POST /ventas/simulacion`, `POST /ventas`, `GET /panel`,
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

- **CP07**: Registrar venta a *Carla Mendoza*, 100 × X-B Piña, fecha 05/10/2026, 8 cuotas → S/ 62.50 del 15/10/2026 al 30/01/2027.
- **CP08**: Reporte de corte del 25/10/2026 → cuota 2 de Luis y de Carla a pagar el 30/10/2026.
- **CP09**: Registrar pago de la cuota 2 de *Luis Ramírez* con fecha 04/11/2026 → 5 días, mora S/ 0.41, total S/ 62.91.
- **CP10**: con la misma obligación escribe un monto menor → el backend rechaza el pago parcial.
- **CP03 / CP04**: sin sesión la API responde 401; un socio que intenta registrar una venta recibe 403.
- **Juego 3** (compra 26/10/2026): para ensayarlo antes de esa fecha, pon `SYSTEM_DATE=2026-10-26` en el `.env` del backend
  y `VITE_SYSTEM_DATE="2026-10-26"` en `.env.local` del frontend.

# Descripción del Proyecto — Sistema de Gestión de Arrendamiento

## Visión general

**proyecto_modular** es un sistema de gestión integral para el arrendamiento de bienes inmuebles, diseñado específicamente para el mercado mexicano. Incorpora asistencia de inteligencia artificial para anticipar riesgos operativos (morosidad, vacancia, costos de mantenimiento) y automatiza el cumplimiento fiscal ante el SAT bajo el Régimen Simplificado de Confianza (RESICO).

El proyecto nace como una iniciativa *greenfield* con un enfoque **modular desde el inicio**: cada área de dominio (recibos, contratos, facturación, mantenimiento, contabilidad, etc.) está aislada en su propio módulo, tanto en el backend como en el frontend, lo que facilita su evolución, reemplazo y prueba de forma independiente.

---

## Problema que resuelve

Administrar una cartera de inmuebles en renta en México implica coordinar múltiples procesos manuales y dispersos:

- **Generación y seguimiento de recibos** mensuales por inquilino.
- **Vigencia de contratos** y fechas de vencimiento.
- **Facturación CFDI** ante el SAT (vía PAC) y cumplimiento de RESICO.
- **Pagos recurrentes** (luz, internet, predial, honorarios del administrador) y anuales.
- **Gastos de mantenimiento** clasificados por categoría.
- **Contabilidad básica**: registro de ingresos, egresos y estado de resultados.

Este sistema unifica todos esos procesos en una sola plataforma, con un módulo de **IA** que aprende de los datos históricos para apoyar la toma de decisiones.

---

## Dominio de negocio

El modelo de datos y la lógica están directamente derivados del documento [Arrendamiento.md](../Arrendamiento.md) y contemplan los siguientes pilares:

### 1. Arrendamiento
- **Recibos** de pago emitidos periódicamente.
- **Contratos** con fechas de inicio y vencimiento, y registro de pagos mensuales.

### 2. Impuestos y facturación
- **SAT** — generación de CFDI (factura electrónica) para cada cobro.
- **Régimen Simplificado de Confianza (RESICO)** — tratamiento fiscal simplificado, pensado para personas físicas con ingresos por arrendamiento.
- **Catálogos de facturación** requeridos por el SAT.

### 3. Pagos y gastos fijos
- Luz
- Internet
- Predial
- SAT
- Honorarios del administrador

### 4. Contabilidad
- Gastos de mantenimiento
- Registro de gastos (egresos)
- Registro de ingresos
- Estado de resultados

### 5. Mantenimiento
Clasificación estandarizada de los gastos por categoría:
- Electricidad
- Fontanería
- Carpintería
- Albañilería
- Materiales
- Otro

### 6. Periodicidad de pagos
- Mensual
- Bimestral
- Anual

---

## Módulos del sistema

Cada módulo se compone de tres archivos backend (`<modulo>.router.ts`, `<modulo>.service.ts`, `<modulo>.test.ts`) y su contraparte en el frontend.

| Módulo | Responsabilidad |
|---|---|
| `auth` | Login y emisión de JWT (credenciales iniciales `admin/admin123`). |
| `propiedades` | Alta y administración de inmuebles (dirección aplanada: calle, número, colonia). |
| `inquilinos` | Registro y datos de contacto de arrendatarios. |
| `contratos` | Vigencia, monto, periodicidad y asociación propiedad–inquilino. |
| `recibos` | Emisión periódica de cobros y registro de pagos. |
| `facturacion` | Timbra de CFDI ante el SAT (vía FacturAPI) — códigos postales, regímenes fiscales, usos de CFDI. |
| `mantenimientos` | Captura de gastos por categoría y propiedad. |
| `movimientos` | Movimientos contables (ingresos y egresos). |
| `contabilidad` | Estado de resultados y reportes financieros. |
| `inteligencia` | Modelos de ML entrenados con los datos del sistema. |

### Módulo de Inteligencia Artificial

El módulo `inteligencia` aporta capacidades predictivas implementadas en **TypeScript puro** (sin dependencias externas de ML):

| Modelo | Tipo | Predicción |
|---|---|---|
| `morosidad` | Regresión logística | Probabilidad de impago por recibo. |
| `vacancia` | Regresión logística | Riesgo de terminación anticipada por contrato. |
| `mantenimiento` | Regresión lineal (Ridge) | Costo anual de mantenimiento por propiedad. |

Cada modelo expone:
- **Métricas** (accuracy, RMSE, etc.) tras el entrenamiento.
- **Importancia de variables** por permutación.
- **Persistencia** en `data/modelos/` (JSON, no en BD).
- Manejo de **cold start**: si hay menos de 3 muestras, el modelo se marca como `sin-datos` y la UI lo renderiza en gris.

---

## Arquitectura técnica

### Monorepo

```
packages/
├── api/      # Backend Express 5 + Drizzle ORM (única fuente de verdad de la BD)
├── web/      # Frontend React 19 + Vite 6 + Tailwind 4 + TanStack Router/Query
├── shared/   # Tipos TS + esquemas Zod consumidos por ambos paquetes
└── tsconfig/ # Bases tsconfig compartidas
```

- **Orquestador**: pnpm workspaces + Turborepo (`pnpm dev`, `pnpm build`, `pnpm test`).
- **Tipado compartido**: `packages/shared` se consume por subpath (`@proyecto-modular/shared/tipos/...`, `@proyecto-modular/shared/esquemas/...`).
- **Alias frontend**: `@/` → `web/src/`.

### Backend

- **Express 5** con TypeScript en modo ESM puro.
- **Drizzle ORM** sobre PostgreSQL ≥ 15. Las 8 tablas (contratos, facturas, inquilinos, mantenimientos, movimientos_contables, predicciones, propiedades, recibos) viven en `packages/api/src/core/db/esquema.ts`.
- **Validación Zod** en TODA entrada externa (router → schema → service).
- **Auth JWT** stateless vía `jsonwebtoken`. No existe tabla de usuarios; el login usa credenciales hardcoded (admin/admin123) en `modulos/auth/auth.router.ts`.
- **Manejo de errores** centralizado: `ZodError` → 400, resto → 500 con `console.error`.

### Frontend

- **React 19** + **Vite 6** + **Tailwind 4**.
- **TanStack Router** (rutas en `web/src/rutas/arbol.tsx`) y **TanStack Query** para server state.
- **Patrón Selector**: los formularios no piden UUIDs; usan `<Selector>` con hooks `use*ParaSelecto` de `services/hooks.ts` que devuelven `{value, etiqueta, descripcion, deshabilitado}`.
- **Primitivos UI** en `web/src/core/ui/` y layout en `web/src/core/layout/` (BarraLateral, AppLayout).
- **Sin state global** salvo auth.

### Base de datos

- **PostgreSQL** como única fuente de verdad.
- **Migraciones** generadas con `drizzle-kit` en `packages/api/migrations/`.
- **Seed** sintético disponible vía `pnpm --filter @proyecto-modular/api db:seed` (TSX) o `psql $DATABASE_URL -f packages/api/scripts/seed.sql` (SQL puro).

---

## Convenciones del proyecto

- **Idioma**: TODO en español — nombres de funciones, variables, UI, mensajes de error, comentarios de dominio. Comentarios técnicos/logs pueden ser en inglés.
- **Validación**: TODA entrada externa (req.body, req.query, req.params) debe pasar por un esquema Zod en `shared/esquemas`. **Sin validación inline**.
- **Componentes UI**: `<select>` nativo vía `Selector`. Sin librerías pesadas (Material, Chakra, Ant Design) — solo Tailwind 4 + `lucide-react`.
- **Imports**: relativos en backend (`../core/...`), con alias `@/` en frontend.
- **ESM puro**: la raíz tiene `"type": "module"`. No existe `__dirname`; se usa `fileURLToPath(import.meta.url)`.
- **Enums PG**: `categoria_mantenimiento` solo acepta `electricidad, fontaneria, carpinteria, albañileria, materiales, otro`. Verificar antes de añadir valores nuevos.
- **Direcciones**: las columnas de `propiedades` están aplanadas (`calle`, `numero`, `colonia`, etc.), no como sub-objeto.

---

## Comandos clave

```bash
# Desarrollo
pnpm dev          # api (3001) + web (5173) en paralelo
pnpm build        # Compila todos los paquetes
pnpm typecheck    # tsc --noEmit en cada paquete
pnpm lint         # ESLint
pnpm format       # Prettier write

# Base de datos
pnpm db:generate   # drizzle-kit generate
pnpm db:migrate    # drizzle-kit migrate
pnpm db:push       # drizzle-kit push (desarrollo, sin archivos)
pnpm --filter @proyecto-modular/api db:seed

# Tests
pnpm test
pnpm --filter @proyecto-modular/api test -- -t "morosidad"
```

### Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | ✅ | URL de conexión a PostgreSQL. |
| `JWT_SECRET` | ✅ | Secreto para firmar JWT (mín. 32 caracteres). |
| `PORT` | No | Puerto del backend (default: `3001`). |
| `NODE_ENV` | No | `development` (default), `production`, `test`. |
| `FACTURAPI_KEY` | No | API key para timbrado de CFDI (FacturAPI). |

---

## Estado actual del proyecto

El proyecto se encuentra en fase de construcción iterativa. Al día de hoy se han aterrizado:

- ✅ Autenticación JWT y layout base.
- ✅ CRUD completo de **recibos** con UI de lista, detalle y captura.
- ✅ Módulo **inteligencia** entrenable con tres modelos y dashboard.
- ✅ Módulos de propiedades, inquilinos, contratos, facturación, mantenimientos, movimientos y contabilidad en desarrollo activo.
- 🔜 Integración real con FacturAPI para timbrado de CFDI.
- 🔜 Reemplazar credenciales hardcoded por una capa de usuarios.

---

## Referencias

- [Arrendamiento.md](../Arrendamiento.md) — requisitos de dominio originales.
- [CLAUDE.md](../CLAUDE.md) — guía técnica para asistentes y colaboradores.
- [README.md](../README.md) — guía de instalación y arranque.

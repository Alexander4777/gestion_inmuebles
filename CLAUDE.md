# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Monorepo | pnpm workspaces + Turborepo | pnpm 11 / turbo 2.4 |
| Backend | Node.js + Express 5 + TypeScript | Node ≥22, TS 5.7 |
| Frontend | React 19 + Vite 6 + Tailwind 4 + TanStack Router/Query | |
| Base de datos | PostgreSQL + Drizzle ORM | PG ≥15 |
| Validación | Zod (en `packages/shared`) | 3.24 |
| Testing | Vitest | 3.1 |
| Lenguaje del dominio | **Español** — código, UI y datos en español |

---

## Comandos

Todos los scripts son orquestados por Turborepo desde la raíz. En CI/dev basta `pnpm <script>`.

### Diarios

```bash
pnpm dev          # Levanta api (3001) + web (5173) en paralelo
pnpm build        # Compila todos los paquetes
pnpm typecheck    # tsc --noEmit en cada paquete
pnpm lint         # ESLint (config en eslint.config.js raíz)
pnpm format       # Prettier write
```

### Base de datos

```bash
pnpm db:generate   # drizzle-kit generate (crea SQL desde esquema.ts)
pnpm db:migrate    # drizzle-kit migrate  (aplica SQL de migrations/)
pnpm db:push       # drizzle-kit push     (desarrollo, sin archivos)
pnpm --filter @proyecto-modular/api db:seed   # tsx scripts/seed.ts
psql $DATABASE_URL -f packages/api/scripts/seed.sql   # alternativa SQL puro
```

### Tests

```bash
pnpm test                                          # todos los paquetes
pnpm --filter @proyecto-modular/api test           # solo backend
pnpm --filter @proyecto-modular/web test           # solo frontend
pnpm --filter @proyecto-modular/api test -- recibos.test.ts   # un archivo
pnpm --filter @proyecto-modular/api test -- -t "morosidad"    # filtrar por nombre
```

Los tests de **api** que tocan DB usan un esquema separado (ver `vitest.config.ts`); los de **web** montan con `jsdom` y mockean `QueryClient` + `Router` (ver `web/src/__tests__/smoke.test.tsx`).

---

## Arquitectura

### Monorepo

```
packages/
├── api/      # Backend Express — única fuente de verdad de la DB
├── web/      # Frontend React
├── shared/   # Tipos TS + esquemas Zod consumidos por ambos
└── tsconfig/ # Bases tsconfig compartidas
```

`packages/shared` se consume por subpath: `@proyecto-modular/shared/tipos/<archivo>` y `@proyecto-modular/shared/esquemas/<archivo>`. **Nunca** importar `@proyecto-modular/shared` a secas para tipos — usar el subpath.

### Backend — patrón módulo

Cada módulo de dominio vive en `packages/api/src/modulos/<nombre>/` con **tres archivos**:

| Archivo | Responsabilidad |
|---|---|
| `<modulo>.router.ts` | Define rutas Express, valida con Zod, delega al service |
| `<modulo>.service.ts` | Lógica de negocio + queries Drizzle |
| `<modulo>.test.ts` | Tests Vitest del módulo |

El router se monta en `packages/api/src/core/app.ts` bajo `/api/<recurso>`. Toda ruta (excepto `/auth/login`) pasa por `requerirAuth` (en `core/auth.ts`) — JWT firmado con `JWT_SECRET`.

**Módulos actuales:** `auth`, `propiedades`, `inquilinos`, `contratos`, `recibos`, `mantenimientos`, `movimientos`, `facturacion`, `inteligencia`.

Para añadir un módulo: crear los 3 archivos, montar el router en `core/app.ts`, agregar servicio en `shared/src/esquemas/` y exportar tipos en `shared/src/tipos/`.

### Auth

**No existe tabla `usuarios`** — el login usa credenciales hardcoded `admin/admin123` en `modulos/auth/auth.router.ts`. JWT stateless con `jsonwebtoken`. El frontend guarda el token en `localStorage` y `rootRoute.beforeLoad` lo valida antes de cada navegación.

### Esquema Drizzle

`packages/api/src/core/db/esquema.ts` define las 8 tablas (contratos, facturas, inquilinos, mantenimientos, movimientos_contables, predicciones, propiedades, recibos). Las migraciones generadas viven en `packages/api/migrations/`. Listas para producción en `migrations/`, usar `db:push` solo en local.

### Frontend — página por recurso

| Capa | Ubicación |
|---|---|
| Primitivos UI | `web/src/core/ui/` (Selector, cn, etc.) |
| Layout | `web/src/core/layout/` (BarraLateral, AppLayout) |
| Páginas | `web/src/modulos/<recurso>/` (RecibosPage, Detalle, Crear) |
| Rutas | `web/src/rutas/arbol.tsx` (TanStack Router — registrar **antes** del default) |
| API client | `web/src/services/<recurso>.api.ts` |
| Hooks compartidos | `web/src/services/hooks.ts` |
| Query/Mutation | React Query vía `useQuery`/`useMutation` |

**Selector pattern**: los formularios NO piden UUIDs — usan `Selector` con `use*ParaSelecto` de `services/hooks.ts` que devuelve `{value, etiqueta, descripcion, deshabilitado}`. Ejemplo: `useRecibosParaSelecto(true)` filtra los que ya tienen factura.

**Path alias**: `@/` → `web/src/`. Configurado en `vite.config.ts` y `tsconfig.json`.

### Módulo `inteligencia` (ML)

`packages/api/src/modulos/inteligencia/` añade tres modelos en **TypeScript puro** (sin dependencias externas de ML):

| Modelo | Tipo | Predice |
|---|---|---|
| `morosidad` | Regresión logística | Probabilidad de impago por recibo |
| `vacancia` | Regresión logística | Riesgo de terminación anticipada por contrato |
| `mantenimiento` | Regresión lineal (Ridge) | Costo anual de mantenimiento por propiedad |

Estructura:
- `ml/logreg.ts` / `ml/linear.ts` — algoritmos
- `ml/feature-importance.ts` — importancia por permutación
- `ml/features.ts` — extracción de datasets desde DB
- `ml/entrenador.ts` — orquesta extracción → entrenamiento → métrica → persistencia
- `ml/persistencia.ts` — JSON en `data/modelos/` (no BD)
- `inteligencia.service.ts` — orquesta, expone predicciones

**Endpoints IA** (`/api/ia`, todos requieren auth): `/dashboard`, `/modelos`, `POST /modelos/:nombre/entrenar`, `/morosidad`, `/vacancia`, `/mantenimiento` (con y sin `:id`).

**Cold start**: si hay <3 muestras en el dataset, el entrenamiento devuelve `estado: 'sin-datos'` (HTTP 422). El frontend renderiza el modelo en gris con mensaje.

### Drizzle + PostgREST gotchas

- ESM puro: `package.json` raíz tiene `"type": "module"`. **No existe `__dirname`** — usar `fileURLToPath(import.meta.url)` (ver patrón en `ml/persistencia.ts`).
- Enums PG: `categoria_mantenimiento` solo acepta `electricidad, fontaneria, carpinteria, albañileria, materiales, otro`. Verificar antes de añadir valores nuevos.
- Columnas `direccion` en `propiedades` están aplanadas (`calle`, `numero`, `colonia`, etc.) — no es un sub-objeto.

---

## Convenciones del proyecto

- **Idioma**: TODO en español (nombres de funciones, variables, UI, mensajes de error, comentarios de dominio). Comentarios técnicos/logs pueden ser en inglés.
- **Validación**: TODA entrada externa (req.body, req.query, req.params) pasa por un esquema Zod de `shared/esquemas`. Sin validación inline.
- **Errores en routers**: capturar `error?.name === 'ZodError'` → 400; resto → 500 con `console.error`.
- **Componentes UI**: `<select>` nativo vía `Selector` (no Recharts, no combobox libs). TanStack Query para server state. Sin state global salvo auth.
- **Imports**: relativos en backend (`../core/...`), con alias `@/` en frontend.
- **No añadir** librerías de UI pesadas (Material, Chakra, Ant) — mantener Tailwind 4 + lucide-react.

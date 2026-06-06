# Proyecto Modular

Sistema de gestión de arrendamiento de bienes inmuebles para el mercado mexicano. Administra propiedades, inquilinos, contratos, recibos, facturación (SAT/RESICO), mantenimiento y contabilidad.

## Stack

| Capa | Tecnología |
|------|-----------|
| **Backend** | Node.js + Express 5 + TypeScript |
| **Frontend** | React 19 + Vite + Tailwind CSS 4 + TanStack Router |
| **Base de datos** | PostgreSQL + Drizzle ORM |
| **Monorepo** | pnpm workspaces + Turborepo |
| **Validación** | Zod (esquemas compartidos) |
| **Testing** | Vitest |

## Requisitos

- **Node.js** ≥ 22
- **pnpm** ≥ 11 (`corepack enable && corepack prepare pnpm@11 --activate`)
- **PostgreSQL** ≥ 15 (local o Docker)

## Instalación

```bash
# 1. Clonar
git clone <repo-url> proyecto_modular
cd proyecto_modular

# 2. Instalar dependencias
pnpm install

# 3. Variables de entorno
cp .env.example .env
# Editar .env con tus valores:
#   DATABASE_URL=postgresql://usuario:password@localhost:5432/proyecto_modular
#   JWT_SECRET=un-secreto-de-al-menos-32-caracteres

# 4. Crear base de datos
createdb proyecto_modular

# 5. Ejecutar migraciones
pnpm db:push

# 6. Iniciar en desarrollo
pnpm dev
```

El backend corre en `http://localhost:3001` y el frontend en `http://localhost:5173`.

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `NODE_ENV` | No | `development` (default), `production`, `test` |
| `PORT` | No | Puerto del backend (default: `3001`) |
| `DATABASE_URL` | ✅ | URL de conexión a PostgreSQL |
| `JWT_SECRET` | ✅ | Clave para firmar tokens JWT (mín. 32 caracteres) |
| `FACTURAPI_KEY` | No | API key para timbrado de CFDI (FacturAPI) |

## Scripts

```bash
pnpm dev           # Inicia backend + frontend en paralelo
pnpm build         # Compila todos los paquetes
pnpm lint          # ESLint en todos los paquetes
pnpm format        # Prettier en todo el proyecto
pnpm test          # Ejecuta tests en todos los paquetes
pnpm typecheck     # Verifica tipos de TypeScript
pnpm db:push       # Empuja el schema directo a la BD (desarrollo)
pnpm db:generate   # Genera migraciones desde el schema
pnpm db:migrate    # Ejecuta migraciones pendientes
```

## Estructura

```text
proyecto_modular/
├── packages/
│   ├── api/            # Backend Express + Drizzle ORM
│   │   └── src/
│   │       ├── core/       # Config (DB, auth, env, app)
│   │       └── modulos/    # Módulos de dominio (recibos, etc.)
│   ├── web/            # Frontend React + Vite + Tailwind
│   │   └── src/
│   │       ├── core/       # Layout, UI primitives
│   │       ├── modulos/    # Páginas por módulo
│   │       ├── rutas/      # Árbol de rutas TanStack
│   │       └── services/   # Clientes HTTP para la API
│   ├── shared/         # Tipos y esquemas Zod compartidos
│   └── tsconfig/       # Configs de TypeScript base
├── docs/               # Documentación
├── turbo.json          # Pipeline de Turborepo
└── pnpm-workspace.yaml # Config del monorepo
```

## Módulos

| Módulo | Backend | Frontend |
|--------|---------|----------|
| Recibos | ✅ CRUD | ✅ Lista, crear, detalle |
| Propiedades | 🔜 | 🔜 |
| Inquilinos | 🔜 | 🔜 |
| Contratos | 🔜 | 🔜 |
| Facturación | 🔜 | 🔜 |
| Mantenimiento | 🔜 | 🔜 |
| Contabilidad | 🔜 | 🔜 |

## Licencia

Privado — uso interno.

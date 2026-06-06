---
name: scaffold-project
description: Scaffold the initial project structure for this greenfield rental management system. Use when the user has chosen a tech stack and wants to set up the project skeleton.
---

You are scaffolding the initial project structure for **proyecto_modular**, an AI-assisted real-estate rental management system for the Mexican market.

## Before scaffolding

1. Confirm the tech stack with the user if not already decided. Ask:
   - **Backend** language/framework (Python/FastAPI, Node/Express, Go, etc.)
   - **Frontend** framework (React, Vue, Svelte, HTMX, or none if API-only)
   - **Database** (PostgreSQL, SQLite for prototyping, etc.)
   - **Package manager** preference
2. Propose the directory structure as a plan before creating any files.

## Scaffolding checklist

Once the stack is confirmed, set up:

- [ ] Initialize git (`git init`) if not already done
- [ ] Create top-level directory structure (e.g., `backend/`, `frontend/`, `docs/`, `scripts/`)
- [ ] Initialize the project manifest(s) (package.json, pyproject.toml, go.mod, etc.)
- [ ] Set up a formatter and linter for each language chosen
- [ ] Create a basic `.gitignore` (merge with existing if present)
- [ ] Create a minimal CLAUDE.md if one doesn't exist yet
- [ ] Set up a basic test runner and write one smoke test
- [ ] Create a `docs/` folder and move or symlink `Arrendamiento.md` there as the requirements baseline

## Domain modules to plan for

The architecture should accommodate these modules (from Arrendamiento.md):

- **Recibos** (receipts)
- **Contratos** (contracts)
- **Impuestos** (taxes: SAT invoicing, RESICO)
- **Contabilidad** (accounting: expenses, income, P&L)
- **Inquilinos** (tenant registry, payment tracking)
- **Mantenimiento** (maintenance tracking)
- **Pagos** (monthly, bimonthly, annual payments)

## After scaffolding

- Run the formatter and linter to verify they work.
- Run the smoke test to confirm the setup.
- Remind the user to run `/init` again to update CLAUDE.md with the actual build/test/lint commands.

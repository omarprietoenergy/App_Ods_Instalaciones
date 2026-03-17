# ODS Energy — Arquitectura de la Aplicación

## Stack Tecnológico

| Componente | Tecnología | Entorno |
|---|---|---|
| Frontend | React + Vite → Static Site (DO) | staging / prod |
| Backend | Express + tRPC → Web Service (DO) | staging / prod |
| Base de datos | Managed PostgreSQL (DO) | staging / prod |
| Storage | DigitalOcean Spaces (S3) | staging / prod |
| Auth | Passport Local + JWT cookies | todos |
| ORM | Drizzle (pg-core) | todos |
| Build backend | esbuild → CJS bundle | todos |

## Reglas de Arquitectura

1. **Backend NO sirve el frontend** en staging/prod (diseño final).
   - Transitoriamente sí, hasta que el Static Site esté configurado.
2. **No MySQL** — ningún import de `mysql2` ni `drizzle-orm/mysql2` en runtime.
3. **Migraciones controladas** — nunca en boot del servidor.
   - Se ejecutan con `npm run db:migrate` manualmente o desde CI/CD.
4. **Seed solo por entorno** — controlado por `STAGING_BOOTSTRAP_ADMIN=true`.
   - Se ejecuta con `npm run db:seed:staging`.
5. **No `/uploads` local** en staging/prod — solo Spaces.
6. **PostgreSQL como única DB** — `DATABASE_URL` como fuente única de conexión.

## Estructura del Repositorio

```
client/          → Frontend React/Vite
server/          → Backend Express/tRPC
  _core/         → Bootstrap, auth, SDK, context, vite serving
  db.ts          → Conexión PostgreSQL (pg + drizzle)
  routers.ts     → Rutas tRPC
  storage.ts     → Adapter S3/Spaces
drizzle/         → Schema pg-core + migraciones SQL
shared/          → Tipos y constantes compartidas
scripts/         → Comandos DB (migrate, seed)
ods_backend/     → Bundle CJS generado por esbuild
```

## Entornos

| Entorno | URL | DB | Spaces |
|---|---|---|---|
| staging | staging.odsenergy.net | postgres-staging | ods-staging |
| prod | app.odsenergy.net | postgres-prod | ods-prod |
| local | localhost:3000 | local PG o SQLite | uploads/ local |

## Scripts Principales

```bash
npm run build          # Build completo (client + server)
npm run build:client   # Solo frontend (vite build)
npm run build:server   # Solo backend (esbuild)
npm run start          # Arrancar backend en producción
npm run db:migrate     # Ejecutar migraciones Drizzle
npm run db:seed:staging # Seed admin para staging
```

## Variables de Entorno Requeridas

| Variable | Descripción | Requerida |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL | ✅ |
| `NODE_ENV` | `production` / `development` | ✅ |
| `PORT` | Puerto del servidor (default 3000) | ✅ DO |
| `JWT_SECRET` | Secret para firmar JWT cookies | ✅ |
| `SESSION_SECRET` | Secret para express-session | ✅ |
| `S3_ENDPOINT` | Endpoint Spaces | staging/prod |
| `S3_ACCESS_KEY` | Access key Spaces | staging/prod |
| `S3_SECRET_KEY` | Secret key Spaces | staging/prod |
| `S3_BUCKET_NAME` | Bucket name | staging/prod |
| `S3_REGION` | Region (fra1) | staging/prod |
| `STAGING_BOOTSTRAP_ADMIN` | `true` para seed admin | staging |
| `ADMIN_EMAIL` | Email del admin seed | staging |
| `ADMIN_PASSWORD` | Password del admin seed | staging |
| `RUN_MIGRATIONS` | `true` para migrar en boot (deprecated) | — |

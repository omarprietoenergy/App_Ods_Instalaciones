# Kit de Contexto para Asistente IA - ODS Energy

Este archivo (zip) contiene toda la información necesaria para que un Agente IA entienda, opere y mejore la aplicación ODS Energy.

## Contenido del Kit

### 1. Documentación Clave
*   `README-DEPLOY-PRODUCTION.md` (P0): La fuente de verdad sobre cómo está desplegado esto AHORA. Léelo antes de sugerir cambios de infra.
*   `DEPLOYMENT_LUCUSHOST.md`: Guía detallada original (útil para contexto de servidor).
*   `ROLES_AND_PERMISSIONS.md` (P1): Quién puede hacer qué.
*   `DATABASE_STRUCTURE.md` (P1): Mapa de tablas y relaciones.
*   `docs/task.md`: Roadmap actual, qué se ha hecho y qué falta.
*   `docs/walkthrough.md`: Historial de los últimos cambios y despliegues.

### 2. Configuración
*   `.env.example` (P0): Todas las variables de entorno necesarias (sin secretos reales).
*   `package.json` / `package.prod.json`: Dependencias.

### 3. Código Fuente (Snapshot)
*   `server/`: Código backend (Express, tRPC, Drizzle).
    *   `server/routers.ts`: Definición de API.
    *   `server/drizzle/schema.ts`: Definición de BD.
*   `ods_backend/`: **STUB/Placeholder** en este kit. En producción contiene el código compilado (`npm run build`). Para entender la lógica, lee `server/`.
*   `client/`: Código frontend (React, Vite).
*   `drizzle/`: Migraciones SQL.
*   `init_database.sql`: SQL Semilla.
*   `start.cjs`: Wrapper de arranque para producción.

## Instrucciones para el Asistente IA

1.  **Antes de codificar**: Revisa `server/drizzle/schema.ts` y `DATABASE_STRUCTURE.md` para no inventar tablas que no existen.
2.  **Antes de sugerir comandos**: Lee `README-DEPLOY-PRODUCTION.md`. No sugieras `pnpm` en producción, usa `npm`. No sugieras Docker si estamos en cPanel estricto.
3.  **Para nuevas features**:
    *   Verifica permisos en `ROLES_AND_PERMISSIONS.md`.
    *   Crea la migración SQL si hace falta.
    *   Actualiza el router tRPC.
    *   Actualiza el Frontend.
4.  **Para desplegar**: Sigue los pasos de generación de bundle en `README-DEPLOY-PRODUCTION.md`.

## Errores Comunes a Evitar
*   No sobrescribir `.env` de producción.
*   No asumir que `node` tiene permisos de root/sudo.
*   El frontend se sirve estático desde `public/`, no desde `dist/` en el zip final.

# ODS Energy - Guía de Despliegue en Producción (v15.3+)

Este documento describe el procedimiento ACTUAL y VALIDADO para desplegar en LucusHost (cPanel + Passenger).

## 1. Arquitectura de Despliegue
*   **Hosting**: LucusHost (cPanel).
*   **Gestor**: CloudLinux Phusion Passenger (NodeJS Selector).
*   **Node Version**: v22.x (Recomendado) o v20.x.
*   **Entry Point**: `start.cjs` (Wrapper para Passenger).
*   **Build**: Pre-compilado. No se ejecuta build en el servidor.
*   **Gestor de Paquetes**: `npm` (Se eliminó `pnpm` en v15.3 para compatibilidad).

## 2. Estructura de Archivos en Servidor
Directorio raíz de la app (`/home/usuario/nodejs/app_ods`):

```
/
├── .env                  <-- CONFIGURACIÓN (NO SOBRESCRIBIR)
├── start.cjs             <-- ENTRY POINT (Configurar en cPanel)
├── app.js                <-- Fallback entry point
├── package.json          <-- Versión production (sin devDependencies)
├── migration_*.sql       <-- Scripts SQL manuales
├── ods_backend/          <-- Código servidor compilado/transpilado (Javscript)
│   └── index.cjs         <-- Real server entry
├── public/               <-- Frontend estático (extraído de dist/public)
│   ├── index.html
│   └── assets/
└── node_modules/         <-- Dependencias instaladas
```

## 3. Pasos de Despliegue (Update)

1.  **Generar Bundle**: Localmente, ejecutar `npm run bundle`. Genera un zip (ej: `ods-energy-v15.3-beta.0.4.zip`).
2.  **Subir**: File Manager cPanel -> Upload Zip -> Extract (Overwrite).
    *   ⚠️ **CUIDADO**: No marques "delete existing files" si eso borra tu `.env`. La extracción normal suele mezclar/sobrescribir, respetando lo no tocado.
3.  **Instalar Dependencias**:
    *   Si el `package.json` cambió: Botón "Run NPM Install" en cPanel.
    *   O por consola: `cd ruta && npm install --omit=dev`.
4.  **Base de Datos**:
    *   Si hay nuevos SQL (ej: `migration_v15_3_expenses.sql`), ejecutarlos manualmente en phpMyAdmin.
    *   *Nota*: Las migraciones automáticas están desactivadas en PROD por seguridad (`RUN_MIGRATIONS!=true`).
5.  **Reiniciar**:
    *   Botón "Restart Application" en cPanel Node.js Selector.

## 4. Solución de Problemas Comunes

*   **Error 500 / "App not started"**:
    *   Mirar `Application URL` en cPanel.
    *   Verificar que "Application Startup File" sea `start.cjs`.
    *   Revisar logs: `stderr.log` (en la raíz).
*   **Error "pnpm not found"**:
    *   Asegúrate de no usar scripts de `pnpm` en `package.json` productivo. El bundle v15.3+ ya corrige esto.
*   **Frontend 404 / Pantalla Blanca**:
    *   Verificar que existe la carpeta `public` en la raíz (no solo `dist`).
    *   Passenger sirve estáticos desde `public/` automáticamente si no hay ruta de express que coincida.

## 5. Variables de Entorno (.env)
Ver `.env.example`. Claves críticas:
*   `DATABASE_URL`: Conexión MySQL.
*   `NODE_ENV`: `production`.
*   `JWT_SECRET`: Para sesiones.

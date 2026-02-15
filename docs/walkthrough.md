# ODS Energy - Walkthrough V15.2 (Epic A - Backend)

## Resumen Ejecutivo (Epic A - Backend)
Se ha implementado la capa de backend completa para el seguimiento de técnicos, incluyendo fichaje (Shifts), asignación diaria de tareas (Assignments) y lógica de control de actividad (Start/Pause/End).

### 1. Base de Datos (Schema)
- **`technicianShifts`**: Nueva tabla para registrar jornadas completas (Start/Pause/Resume/End).
- **`technicianDailyAssignments`**: Extendida con lógica de estado (`working`/`paused`), tiempos (`activeStartTime`, `totalMinutes`) y aprobación (`approvalStatus`, `assignmentSource`).
- **`notifications`**: Nueva tabla para comunicación asíncrona (alertas a PM).
- **Indices Únicos**: Se garantiza integridad (1 turno por día, 1 asignación por instalación/día).

### 2. API Shifts (tRPC)
- **`shifts.start`**: Inicia jornada.
- **`shifts.pause/resume`**: Control intermedio.
- **`shifts.end`**: Finaliza jornada y **auto-pausa** cualquier actividad que estuviera en curso ("Single Active Rule").

### 3. API Daily Assignments (tRPC)
- **`listForTechnician`**:
  - Implementa lógica **Ensure Plan**: Si no existe plan para la fecha solicitada (hoy/mañana), intenta copiar la estructura del día anterior (si existía) o devuelve vacío.
- **`startWork`**:
  - **Auto-pause**: Pausa cualquier otra tarea activa del técnico.
  - **Unassigned Logic**: Si el técnico inicia una obra no asignada, crea una asignación en vuelo con estado `pending` y genera una alerta al PM.
- **`pauseWork / resumeWork`**:
  - Calcula deltas de tiempo en tiempo real usando `activeStartTime`.
- **`completeWork`**:
  - Cierra la tarea y suma los últimos minutos trabajados.
- **`approvePending / rejectPending`**:
  - Endpoints para que el PM valide trabajos no planificados iniciados por técnicos.

### 4. Helpers (db.ts)
- `autoPauseTechnicianActivities`: Función core transaccional para garantizar la regla de "una sola actividad activa".
- `ensureDailyPlan`: Lógica de clonado de planes diarios (lookback 5 días).

---
**Estado Backend**: ✅ COMPLETADO (A-01 a A-07)
# Walkthrough - Epic B Deployment (v15.3-beta.0.4)

## Overview
Status: **Ready for Deployment**
Target Environment: **Comet (cPanel/Passenger)**
Version: `v15.3-beta.0.4`

## Changes Summary
- **Backend:**
    - New `expenses` table and `materials` updates.
    - **Fail-Fast Login**: Returns 500 DB_NOT_CONFIGURED.
    - **No Migrations in Prod**: Migrations skipped by default (`RUN_MIGRATIONS!=true`).
- **Frontend:**
    - Three-tab interface (Requests, Received, Expenses).
    - **Zip Download** for expenses.
- **Infrastructure (Hotfix):**
    - **No PNPM**: Dependencies cleanup.
    - **Public Path Fix**: Frontend served from root `public/` to fix ENOENT.
    - **Startup**: `start.cjs` included and mandated.

---

## Deployment Steps (Comet - cPanel)

> [!IMPORTANT]
> Follow this order strictly.

### 1. Database Migration (phpMyAdmin)
1.  Log in to **cPanel** > **phpMyAdmin**.
2.  Select the production database.
3.  **Backup:** Export current state.
4.  **SQL Execution:**
    - Open `migration_v15_3_expenses.sql` (found in the zip root).
    - Copy its content and execute it in the SQL tab.
    - *This creates the `expenses` table and updates `materials`.*

### 2. Application Deployment (File Manager)
1.  Go to **cPanel** > **File Manager**.
2.  Navigate to application root.
3.  **Upload:** Upload `ods-energy-v15.3.0-beta.0.3.zip`.
4.  **Extract:** Extract contents, **overwriting** existing files.
    > [!CRITICAL]
    > **DO NOT OVERWRITE THE `.env` FILE**.
    - Ensure `start.cjs` is present in root.
    - Ensure `public` folder is present in root (was `dist`).
5.  **Dependencies:**
    - Run "NodeJS App" > "Run NPM Install".

### 3. Restart Application & Configure Startup File (CRITICAL)
1.  Go to **cPanel** > **Setup Node.js App**.
2.  **Application Startup File**: **MUST BE** `start.cjs`.
    - Do NOT use `server.cjs` or `index.js`.
3.  Click **Restart Application**.

### 4. Smoke Test
1.  Access `https://app.odsenergy.net/api/trpc/users.me` -> JSON response.
2.  Access `https://app.odsenergy.net` -> Login Page (Verify v15.3-beta.0.3).
3.  Login -> Should work (DB fail-fast active).

---
**Siguiente paso**: Frontend (Technician Home)

### 5. Frontend: Technician Home (Oracle-style)
Se ha implementado una interfaz móvil-first para el técnico (`TechnicianHome.tsx`) que sustituye al dashboard genérico.

#### Componentes Clave:
- **Shift Control (Fichaje)**:
  - Header fijo con estado en tiempo real (Activo/Pausado/Finalizado).
  - Botones grandes para iniciar/pausar jornada.
  - Al finalizar jornada: **Alerta de seguridad** + Auto-check de todas las actividades activas.
- **Agenda Diaria (Daily Plan)**:
  - **Toggle HOY / MAÑANA**: Permite consultar la planificación del día siguiente sin activarla.
  - **Single Active Item**:
    - La tarea "EN CURSO" aparece destacada en la parte superior con tarjeta verde animada.
    - Acciones rápidas: Navegar (Maps), Llamar, Completar.
  - **Listado Pendiente**:
    - Tarjetas para el resto de tareas asignadas.
    - Botón "Iniciar": Pide confirmación si ya hay otra tarea activa ("Switch de obra").

#### Pre-Frontend Backend Fixes:
- **Standard Local Date**: Se ha unificado el manejo de fechas con `getLocalDateStr('Europe/Madrid')` tanto en Front como en Back para evitar desincronización por UTC/cPanel.
- **Deduplicación**: Script de limpieza previo a la creación del índice único `(technicianId, installationId, date)`.
- **Restauración Tab PM**: Se han reactivado los endpoints `assign`, `delete` y `updateStatus` para que el PM pueda seguir gestionando asignaciones desde la vista de Instalación.

---

## Entrega V15.2-beta (Technician Home)

**Archivo**: `ods-energy-v15.2-beta.zip`
**Fecha**: 23 Enero 2026

### ⚠️ HOTFIX (v15.2-beta) - Final UI & SQL
**Archivo**: `ods-energy-v15.2-beta.zip` (Incluye Bump Visual a v15.2-beta).
**Fecha**: 23 Enero 2026

### Cómo desplegar (Secuencia CRÍTICA):

#### 1. Migración SQL Manual (phpMyAdmin)
Ejecutar el script `migration_v15_2.sql` (en la raíz).
- Es **idempotente**: Si ya corriste algo, no romperá nada.
- Limpia duplicados primero -> Crea columnas tables -> Crea Unique Index.

#### 2. Actualizar Código (cPanel)
1. Subir `ods-energy-v15.2-beta.zip` y descomprimir (Overwrite).
2. Asegurar dependencias: `npm install --omit=dev`.
3. **Reiniciar**: `touch tmp/restart.txt`.

#### 3. Verificación
- Acceder como Técnico.
- Sidebar debe decir: **v15.2-beta.1** (arriba y abajo).
- Probar flujo: Fichaje -> Hoy/Mañana -> Activity.

---

## Entrega V15.2-beta.1 (React Hook Fix)

**Archivo**: `ods-energy-v15.2-beta.1.zip`
**Fecha**: 25 Enero 2026

### Cambios:
- **Hotfix React #300**: Se ha corregido una violación de las reglas de hooks en `Home.tsx`. Anteriormente, el rol técnico provocaba un `return` temprano antes de declarar hooks de tRPC, rompiendo el renderizado.
- **Versión Visual**: Sidebar actualizado a v15.2-beta.1.

### Pasos de Despliegue:
1. Subir `ods-energy-v15.2-beta.1.zip` (Overwrite).
2. `npm install` (opcional si ya se hizo para v15.2).
3. Reiniciar Passenger (`touch tmp/restart.txt`).

---

## Entrega V15.2-beta.2 (Sincronización & Auth)

**Archivo**: `ods-energy-v15.2-beta.2.zip`
**Fecha**: 25 Enero 2026 (19:30)

### Cambios:
- **Sincronización con Calendario**: `ensureDailyPlan` ahora prioriza las fechas de instalaciones (`startDate`/`endDate`) asignadas al técnico antes de clonar días anteriores.
- **Corrección de Autorización**: Los técnicos ahora pueden abrir el detalle de cualquier instalación asignada para su jornada (Hoy o Mañana), incluso si no están asignados de forma permanente en la ficha general.
- **Logs de Diagnóstico**: Se han añadido logs con el prefijo `[DailyPlan]` y `[Auth]` para facilitar la depuración en producción.
- **Versión Visual**: Sidebar actualizado a v15.2-beta.2.

### Pasos de Despliegue:
1. Subir `ods-energy-v15.2-beta.2.zip` (Overwrite).
2. Reiniciar Passenger (`touch tmp/restart.txt`).
3. **Validación**: Verificar que el técnico vea las tareas correctas del calendario en HOY/MAÑANA y pueda abrirlas.

---

## Entrega V15.2-beta.3 (Reconciliación Robusta)

**Archivo**: `ods-energy-v15.2-beta.3.zip`
**Fecha**: 25 Enero 2026 (20:00)

### Cambios:
- **Corregido Bug de Early Return**: `ensureDailyPlan` ya no se detiene si encuentra un plan antiguo. Ahora **reconcilia** activamente: quita lo que no debe estar (si es origen 'system') y añade lo que falta de calendario.
- **Trazabilidad Extendida**: Logs en `listForTechnician` ahora muestran los IDs de las instalaciones devueltas (`instIds=[5,9,...]`).
- **Lógica de Limpieza**: Se eliminan automáticamente las asignaciones automáticas obsoletas si el calendario maestro ha cambiado.
- **Versión Visual**: Sidebar actualizado a v15.2-beta.3.

### Pasos de Despliegue:
1. Subir `ods-energy-v15.2-beta.3.zip` (Overwrite).
2. Reiniciar Passenger (`touch tmp/restart.txt`).
3. **Validación**: Recargar Home del técnico 3367 y verificar HOY (Prueba 5) y MAÑANA (Prueba 3).

---

## Entrega V15.2-beta.4 (Control Actividad & UX Móvil)

**Archivo**: `ods-energy-v15.2-beta.4.zip`
**Fecha**: 25 Enero 2026 (20:15)

### Cambios:
- **Resuelta Fallo en "Iniciar"**: Se han añadido logs de trazabilidad y se ha corregido el flujo de inicio de actividad para asegurar que el estado cambie correctamente.
- **Dependencia de Jornada**: Si la jornada está en pausa, al pulsar "Iniciar" tarea, el sistema reanuda automáticamente la jornada y activa la tarea (previo aviso vía Toast).
- **UX Mobile-First**:
    - Sidebar colapsable (hamburguesa) con cabecera fija en móviles.
    - Tarjetas de actividad a ancho completo con botones grandes (hit-area optimizada).
    - Márgenes reducidos para máximo aprovechamiento de pantalla en dispositivos pequeños.
- **Feedback Visual**: Todas las acciones (Start/Pause/Resume/Complete) ahora tienen feedback explícito vía Toasts (Éxito/Error).
- **Versión Visual**: Sidebar actualizado a v15.2-beta.4.

### Pasos de Despliegue:
1. Subir `ods-energy-v15.2-beta.4.zip` (Overwrite).
2. Reiniciar Passenger (`touch tmp/restart.txt`).
3. **Validación**: Probar el botón "Iniciar" en un móvil y verificar que la tarjeta sube a "EN CURSO".

---

## Hotfix V15.2-beta.4.1 (Arreglo Crítico Botón Iniciar)

**Archivo**: `ods-energy-v15.2-beta.4.1.zip`
**Fecha**: 26 Enero 2026 (09:10)

### Cambios:
- **Corregida Referencia Indefinida**: Se ha arreglado el acceso a `installationId` en la función `handleStart` del frontend. Anteriormente se intentaba acceder a una propiedad inexistente, lo que bloqueaba la ejecución sin avisar.
- **Robustez en Frontend**: Se ha envuelto el inicio de actividad en un bloque `try/catch` con logs en consola y Toasts de error explícitos.
- **Traceabilidad**: Se ha añadido un `console.log` preventivo en el frontend para confirmar que el click llega a la lógica de negocio antes de llamar a la API.
- **Versión**: Actualizado a v15.2-beta.4.1.

### Pasos de Despliegue:
1. Subir `ods-energy-v15.2-beta.4.1.zip` (Overwrite).
2. Reiniciar App.
3. El botón "Iniciar" ahora debe funcionar correctamente y mostrar feedback inmediato.

---
**Estado Frontend**: ✅ COMPLETADO (Hotfix Aplicado)
**Siguiente paso**: Verificación Final & PM Alerts (A-10)

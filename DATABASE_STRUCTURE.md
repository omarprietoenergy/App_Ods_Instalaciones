# Estructura de Base de Datos (Drizzle ORM)

La base de datos es MySQL gestionada con Drizzle ORM. El archivo fuente de verdad es `server/drizzle/schema.ts`.

## Tablas Principales

### 1. Usuarios y Auth (`users`)
*   `id`: PK
*   `email`: Identificador único (Login).
*   `role`: Enum (`admin`, `project_manager`, `technician`, `admin_manager`).
*   `password`: Hashed (bcrypt).

### 2. Instalaciones (`installations`)
*   Núcleo de la gestión.
*   `assignedTechnicianIds`: JSON Array con IDs de técnicos asignados.
*   `status`: `pending`, `in_progress`, `completed`, `cancelled`.
*   Relacionada con cliente, dirección, y datos económicos (`laborPrice`, etc).

### 3. Actividad Técnica
*   **`technicianDailyAssignments`**: Asignación diaria de un técnico a una obra. Controla el "Plan del día".
*   **`technicianShifts`**: Fichajes reales (Start/Stop). Controla el tiempo trabajado efectivo.
*   **`dailyReports`**: Parte de trabajo diario (físico/digital) rellenado por el técnico.

### 4. Costes y Materiales (Epic B)
*   **`materials`**: Materiales pedidos o recibidos.
    *   `type`: `requested` (solicitud) o `received` (albarán llegada).
    *   `status`: Flujo de aprobación (`pending` -> `approved` -> `ordered`...).
*   **`expenses`**: Gastos y dietas.
    *   `category`: Combustible, Hotel, Comida, etc.
    *   `vendor`, `amount`, `receiptPhotoUrl` (Foto ticket).
    *   `status`: Aprobación simple (`pending`, `approved`, `rejected`).

### 5. Documentación
*   **`documents`**: Archivos generales de la instalación (Planos, permisos).
*   **`photos`**: Fotos adjuntas a los partes diarios (`dailyReports`).

### 6. Sistema
*   **`emailTemplates`**: Plantillas HTML para correos automáticos.
*   **`notifications`**: Alertas para usuarios.
*   **`installationStatusHistory`**: Auditoría de cambios de estado.
*   **`installationAuditLogs`**: Auditoría general de acciones.

## Relaciones Clave
*   Casi todo orbita alrededor de `installationId`.
*   `users.id` es la FK para `userId` (creador, técnico, o solicitante).

## Notas para IA
*   Al crear migraciones, usa SQL plano si es posible o Drizzle `mysql-core`.
*   **PRECAUCIÓN**: En producción, no ejecutar DDL destructivo sin backup.
*   Las fechas se guardan típicamente como `date` (YYYY-MM-DD) para días lógicos o `timestamp` para momentos exactos.

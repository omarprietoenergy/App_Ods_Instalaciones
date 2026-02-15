# Roles y Permisos (Esquema de Seguridad)

La aplicación maneja 4 roles de usuario (definidos en `users` table, column `role` enum):

## 1. Roles
*   **admin**: Superusuario. Acceso total a todas las funcionalidades.
*   **project_manager**: Jefe de Proyecto. Gestión operativa completa.
*   **admin_manager**: Gestor Administrativo. Visibilidad de costes, facturas y personal, pero limitado en configuración técnica profunda.
*   **technician**: Técnico de campo. Acceso limitado a sus asignaciones y registro de actividad/gastos.

## 2. Matriz de Permisos (Resumen)

| Funcionalidad | admin | project_manager | admin_manager | technician |
| :--- | :---: | :---: | :---: | :---: |
| **Usuarios** | | | | |
| Crear Usuario | ✅ | ✅ | ❌ | ❌ |
| Listar Usuarios | ✅ | ✅ | ✅ | ❌ |
| Editar/Borrar | ✅ | ❌ | ❌ | ❌ |
| **Instalaciones** | | | | |
| Ver Todas | ✅ | ✅ | ✅ | ❌ (Solo asignadas) |
| Crear/Editar | ✅ | ✅ | ❌ | ❌ |
| Asignar Técnicos| ✅ | ✅ | ❌ | ❌ |
| **Materiales/Gastos**| | | | |
| Ver Lista | ✅ | ✅ | ✅ | ✅ (Propios/Inst) |
| Solicitar/Crear | ✅ | ✅ | ❌ | ✅ |
| Aprobar/Rechazar| ✅ | ✅ | ❌ | ❌ |
| Descargar ZIP | ✅ | ✅ | ❌ | ❌ |
| **Configuración** | | | | |
| Plantillas Email| ✅ | ❌ | ❌ | ❌ |

## 3. Implementación Técnica

*   **Middleware**: TRPC `protectedProcedure` verifica autenticación.
*   **Checks**: Se realizan comprobaciones explícitas dentro de las mutaciones.
    *   Ejemplo: `if (!['admin', 'project_manager'].includes(ctx.user.role)) throw FORBIDDEN`
*   **Frontend**: La UI oculta botones según `user.role` (ver `DashboardLayout` y componentes específicos).

## 4. Notas Adicionales
*   Los técnicos solo ven las instalaciones donde su ID está en `assignedTechnicianIds` o tienen fichajes activos.
*   El registro público está deshabilitado. Solo Admin/PM pueden crear usuarios desde el panel.

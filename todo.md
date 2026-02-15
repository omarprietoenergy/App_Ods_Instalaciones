# TODO - ODS Energy App

## Fase 1: Configurar modelo de datos y estructura del proyecto
- [x] Definir esquema completo de base de datos en drizzle/schema.ts
- [x] Crear tablas: roles, installations, documents, daily_reports, photos
- [x] Configurar relaciones entre tablas
- [x] Ejecutar migraciones con pnpm db:push
- [x] Configurar tema visual profesional para entorno industrial

## Fase 2: Implementar sistema de autenticación con roles y permisos
- [x] Extender tabla users con 4 roles: admin, project_manager, technician, admin_manager
- [x] Crear procedimientos protegidos por rol en server/routers.ts
- [x] Implementar middleware de autorización por rol
- [x] Crear helpers de verificación de permisos

## Fase 3: Desarrollar gestión de instalaciones y asignación a técnicos
- [x] Crear CRUD completo de instalaciones
- [x] Implementar formulario de creación de instalación
- [x] Sistema de asignación de técnicos a instalaciones
- [x] Vista de lista de instalaciones con filtros
- [x] Vista de detalle de instalación

## Fase 4: Implementar sistema de carga y gestión de documentos con S3
- [x] Configurar integración con S3 para almacenamiento
- [x] Crear endpoint de carga de documentos
- [x] Implementar tabla documents con referencias a S3
- [x] Sistema de visualización y descarga de documentos
- [x] Organización de documentos por tipo (planos, contratos, permisos, etc.)

## Fase 5: Crear módulo de partes diarios con firma digital y fotos
- [x] Crear formulario de parte diario
- [x] Implementar captura de firma digital con canvas
- [x] Sistema de carga múltiple de fotos
- [x] Almacenar fotos en S3 con referencias en BD
- [x] Vista de historial de partes diarios por instalación

## Fase 6: Desarrollar generación automática de reportes PDF
- [x] Instalar librería de generación de PDF
- [x] Crear plantilla de reporte de parte diario
- [x] Incluir información completa: datos, descripción, horas, firma
- [x] Incluir fotos adjuntas en el PDF
- [x] Endpoint de descarga de PDF generado

## Fase 7: Implementar importación desde sistemas externos y OneDrive
- [ ] Crear endpoint de importación de instalaciones
- [ ] Implementar parser de archivos CSV/Excel
- [ ] Sistema de validación de datos importados
- [ ] Interfaz de carga de archivos para importación
- [ ] Documentar formato de importación

## Fase 8: Crear dashboards específicos por rol y optimizar para móviles
- [x] Dashboard para Administrador: vista completa de instalaciones
- [x] Dashboard para Jefe de proyecto: seguimiento de proyectos
- [x] Dashboard para Técnicos: instalaciones asignadas y documentación
- [x] Dashboard para Jefe de administración: reportes y estadísticas
- [x] Optimizar interfaz para dispositivos móviles y tablets
- [x] Implementar navegación responsive

## Fase 9: Realizar pruebas, crear checkpoint y documentación de despliegue
- [x] Escribir tests unitarios con vitest
- [x] Probar flujos completos de usuario
- [x] Verificar funcionamiento en móviles
- [x] Crear checkpoint del proyecto
- [x] Documentar proceso de despliegue en LucusHost

## Fase 10: Entregar aplicación completa con instrucciones para LucusHost
- [x] Crear guía de despliegue para LucusHost con Node.js
- [x] Documentar configuración de MySQL en cPanel
- [x] Documentar variables de entorno necesarias
- [x] Crear manual de usuario básico
- [x] Entregar proyecto completo al usuario


## Bugs Reportados
- [x] Corregir error de SelectItem con valor vacío en página de instalaciones


## Nuevas Funcionalidades Solicitadas
- [x] Implementar creación de usuarios desde la interfaz
- [x] Formulario de creación de usuario con asignación de rol
- [x] Validación de datos de usuario
- [x] Endpoint tRPC para crear usuarios

## Funcionalidad de Eliminación de Usuarios
- [x] Crear endpoint tRPC para eliminar usuarios
- [x] Agregar botón de eliminar en la tabla de usuarios
- [x] Implementar diálogo de confirmación antes de eliminar
- [x] Validar permisos (admin y project_manager)
- [x] Crear tests unitarios para eliminación de usuarios

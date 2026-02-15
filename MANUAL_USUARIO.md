# Manual de Usuario - ODS Energy App

## Índice

1. [Introducción](#introducción)
2. [Roles y Permisos](#roles-y-permisos)
3. [Inicio de Sesión](#inicio-de-sesión)
4. [Gestión de Instalaciones](#gestión-de-instalaciones)
5. [Partes Diarios](#partes-diarios)
6. [Documentos](#documentos)
7. [Gestión de Usuarios](#gestión-de-usuarios)
8. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

ODS Energy App es una aplicación web diseñada para gestionar instalaciones fotovoltaicas, permitiendo el seguimiento completo desde la planificación hasta la ejecución en campo.

### Características Principales

- ✅ Gestión completa de instalaciones fotovoltaicas
- ✅ Asignación de técnicos a proyectos
- ✅ Partes diarios con firma digital
- ✅ Carga de fotos de avance
- ✅ Gestión de documentos (planos, contratos, permisos)
- ✅ Generación automática de reportes PDF
- ✅ Dashboard personalizado por rol
- ✅ Interfaz responsive para móviles y tablets

---

## Roles y Permisos

La aplicación cuenta con 4 roles diferenciados:

### 👑 Administrador

**Permisos:**
- Acceso completo a todas las funcionalidades
- Crear, editar y eliminar instalaciones
- Gestionar usuarios y asignar roles
- Ver todos los partes diarios y documentos
- Acceso a estadísticas globales

**Casos de uso:**
- Supervisión general del sistema
- Configuración y mantenimiento
- Gestión de usuarios

### 📋 Jefe de Proyecto

**Permisos:**
- Crear y gestionar instalaciones
- Asignar técnicos a instalaciones
- Ver partes diarios de sus proyectos
- Subir y gestionar documentos
- Generar reportes

**Casos de uso:**
- Planificación de proyectos
- Asignación de recursos
- Seguimiento de avances

### 🔧 Técnico

**Permisos:**
- Ver instalaciones asignadas
- Crear partes diarios
- Subir fotos de avance
- Firmar partes digitalmente
- Consultar documentación de sus proyectos

**Casos de uso:**
- Trabajo en campo
- Registro diario de actividades
- Consulta de planos y especificaciones

### 💼 Jefe de Administración

**Permisos:**
- Ver todas las instalaciones
- Acceso a reportes y estadísticas
- Consultar partes diarios
- Generar informes administrativos

**Casos de uso:**
- Análisis de datos
- Reportes financieros
- Auditorías

---

## Inicio de Sesión

### Acceso a la Aplicación

1. Abre tu navegador web (Chrome, Firefox, Safari, Edge)
2. Navega a: `https://odsenergy.net`
3. Haz clic en **Iniciar Sesión**
4. Utiliza tus credenciales de Manus OAuth

### Primera Vez

Si es tu primera vez:
1. El administrador debe haberte dado acceso
2. Recibirás un correo con instrucciones
3. Sigue el enlace para activar tu cuenta
4. Inicia sesión con tus credenciales

---

## Gestión de Instalaciones

### Ver Instalaciones

1. Haz clic en **Instalaciones** en el menú lateral
2. Verás una lista de todas las instalaciones (según tu rol)
3. Usa los filtros para buscar instalaciones específicas

### Crear Nueva Instalación

*Disponible para: Administrador, Jefe de Proyecto*

1. Ve a **Instalaciones**
2. Haz clic en **Nueva Instalación**
3. Completa el formulario:
   - **Dirección**: Ubicación completa de la instalación
   - **Cliente**: Nombre del cliente
   - **Email del Cliente**: Correo electrónico (opcional)
   - **Tipo de Instalación**: Ej. "Residencial 5kW", "Comercial 10kW"
   - **Presupuesto**: Presupuesto estimado (opcional)
   - **Fecha de Inicio**: Fecha planificada de inicio
   - **Fecha de Fin**: Fecha estimada de finalización
   - **Estado**: Pendiente, En Progreso, Completada
   - **Técnico Asignado**: Selecciona el técnico responsable
4. Haz clic en **Guardar Instalación**

### Ver Detalle de Instalación

1. En la lista de instalaciones, haz clic en cualquier instalación
2. Verás:
   - Información completa del proyecto
   - Documentos adjuntos
   - Partes diarios registrados
   - Fotos de avance

### Editar Instalación

*Disponible para: Administrador, Jefe de Proyecto*

1. Abre el detalle de la instalación
2. Haz clic en **Editar**
3. Modifica los campos necesarios
4. Haz clic en **Guardar Cambios**

---

## Partes Diarios

### Ver Partes Diarios

1. Haz clic en **Partes Diarios** en el menú
2. Verás los partes organizados por instalación
3. Haz clic en cualquier parte para ver el detalle

### Crear Nuevo Parte Diario

*Disponible para: Todos los usuarios*

1. Ve a **Partes Diarios**
2. Haz clic en **Nuevo Parte Diario**
3. Completa el formulario:

#### Información General
- **Instalación**: Selecciona la instalación
- **Fecha**: Fecha del trabajo realizado
- **Horas Trabajadas**: Número de horas (puede incluir decimales)
- **Descripción del Trabajo**: Detalla las actividades realizadas

#### Fotos de Avance
1. Haz clic en **Agregar Fotos**
2. Selecciona una o varias fotos desde tu dispositivo
3. Opcionalmente, agrega una descripción a cada foto
4. Puedes eliminar fotos haciendo clic en la ❌

#### Firma Digital
1. Usa el mouse o tu dedo (en tablet/móvil) para firmar en el recuadro
2. Si te equivocas, haz clic en **Limpiar Firma**
3. La firma es **obligatoria** para guardar el parte

4. Haz clic en **Guardar Parte Diario**

### Ver Detalle de Parte Diario

1. Haz clic en cualquier parte diario de la lista
2. Verás:
   - Información de la instalación
   - Fecha y horas trabajadas
   - Descripción completa del trabajo
   - Galería de fotos (haz clic para ampliar)
   - Firma digital del técnico

### Generar PDF del Parte Diario

1. Abre el detalle del parte diario
2. Haz clic en **Generar PDF**
3. El PDF se abrirá en una nueva pestaña
4. Puedes descargarlo o imprimirlo

El PDF incluye:
- Información de la instalación
- Detalles del trabajo realizado
- Lista de fotos adjuntas
- Firma digital

---

## Documentos

### Subir Documentos

*Desde el detalle de una instalación*

1. Abre la instalación
2. Ve a la sección **Documentos**
3. Haz clic en **Subir Documento**
4. Completa:
   - **Tipo de Documento**: Planos, Proyecto, Plan de Seguridad, Contrato, Permiso, Otro
   - **Nombre**: Nombre descriptivo del documento
   - **Archivo**: Selecciona el archivo (PDF, imágenes, documentos)
5. Haz clic en **Subir**

**Tipos de documentos soportados:**
- PDF
- Imágenes (JPG, PNG, GIF)
- Documentos de Word (DOC, DOCX)
- Hojas de cálculo (XLS, XLSX)
- AutoCAD (DWG, DXF)

**No hay límite de tamaño** para los archivos.

### Ver y Descargar Documentos

1. En el detalle de la instalación, ve a **Documentos**
2. Verás todos los documentos organizados por tipo
3. Haz clic en **Ver** para abrir el documento
4. Haz clic en **Descargar** para guardarlo en tu dispositivo

### Eliminar Documentos

*Disponible para: Administrador, Jefe de Proyecto*

1. En la lista de documentos, haz clic en el icono de eliminar (🗑️)
2. Confirma la eliminación

---

## Gestión de Usuarios

*Disponible para: Administrador, Jefe de Proyecto*

### Ver Lista de Usuarios

1. Haz clic en **Usuarios** en el menú
2. Verás la lista completa de usuarios con:
   - Nombre
   - Email
   - Rol
   - Último acceso

### Información de Roles

En la página de usuarios encontrarás una descripción detallada de cada rol y sus permisos.

---

## Uso en Dispositivos Móviles

La aplicación está completamente optimizada para móviles y tablets.

### Recomendaciones

- **Navegador**: Usa Chrome, Safari o Firefox actualizado
- **Conexión**: Asegúrate de tener conexión estable para subir fotos
- **Fotos**: Puedes tomar fotos directamente desde la cámara del dispositivo
- **Firma**: Usa tu dedo para firmar en la pantalla táctil

### Agregar a Pantalla de Inicio (iOS/Android)

#### iOS (iPhone/iPad)
1. Abre Safari y ve a `https://odsenergy.net`
2. Toca el botón de compartir
3. Selecciona **Añadir a pantalla de inicio**
4. La app aparecerá como un icono en tu pantalla

#### Android
1. Abre Chrome y ve a `https://odsenergy.net`
2. Toca el menú (⋮)
3. Selecciona **Añadir a pantalla de inicio**
4. La app aparecerá como un icono

---

## Preguntas Frecuentes

### ¿Puedo usar la aplicación sin conexión a Internet?

No, la aplicación requiere conexión a Internet para funcionar. Sin embargo, puedes preparar fotos offline y subirlas cuando recuperes la conexión.

### ¿Cuántas fotos puedo subir por parte diario?

No hay límite en el número de fotos. Sin embargo, se recomienda subir fotos relevantes y de calidad razonable para no saturar el almacenamiento.

### ¿Puedo editar un parte diario después de crearlo?

Actualmente no se pueden editar partes diarios una vez creados para mantener la integridad de los registros. Si necesitas corregir algo, contacta con tu administrador.

### ¿Qué hago si olvidé mi contraseña?

Usa la opción **¿Olvidaste tu contraseña?** en la pantalla de inicio de sesión. Recibirás un correo con instrucciones para restablecerla.

### ¿Puedo ver instalaciones de otros técnicos?

Los técnicos solo pueden ver sus instalaciones asignadas. Los jefes de proyecto y administradores pueden ver todas las instalaciones.

### ¿Los documentos están seguros?

Sí, todos los documentos se almacenan en servidores seguros con cifrado. Solo los usuarios autorizados pueden acceder a ellos.

### ¿Cómo importo instalaciones desde mi ERP?

Contacta con el administrador para configurar la importación automática desde tu sistema ERP o CRM.

### ¿Puedo cambiar el idioma de la aplicación?

Actualmente la aplicación está disponible solo en español.

### ¿Hay una aplicación móvil nativa?

No es necesaria. La aplicación web está completamente optimizada para móviles y funciona como una app nativa cuando la agregas a la pantalla de inicio.

---

## Soporte Técnico

Si tienes problemas o preguntas:

1. **Administrador del sistema**: Contacta primero con tu administrador interno
2. **Soporte ODS Energy**: [email de soporte]
3. **Documentación**: Consulta este manual y la guía de despliegue

---

## Consejos y Mejores Prácticas

### Para Técnicos

- ✅ Completa los partes diarios al final de cada jornada
- ✅ Toma fotos claras y bien iluminadas
- ✅ Describe detalladamente el trabajo realizado
- ✅ Revisa la documentación antes de ir a la obra

### Para Jefes de Proyecto

- ✅ Asigna técnicos tan pronto como se confirme la instalación
- ✅ Sube toda la documentación necesaria antes del inicio
- ✅ Revisa los partes diarios regularmente
- ✅ Mantén actualizadas las fechas y estados de las instalaciones

### Para Administradores

- ✅ Asigna roles apropiados a cada usuario
- ✅ Realiza backups periódicos de la base de datos
- ✅ Monitorea el uso de almacenamiento
- ✅ Capacita a los nuevos usuarios

---

**Versión del Manual**: 1.0  
**Última Actualización**: Diciembre 2025  
**ODS Energy** - Instalaciones Fotovoltaicas

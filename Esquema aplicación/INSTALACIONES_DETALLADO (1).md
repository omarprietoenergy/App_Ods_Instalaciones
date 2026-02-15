# 🏗️ Pestaña de Instalaciones - Guía Completa y Detallada

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Página Principal de Instalaciones](#página-principal-de-instalaciones)
3. [Crear Nueva Instalación](#crear-nueva-instalación)
4. [Detalle de Instalación](#detalle-de-instalación)
5. [Gestión de Documentos](#gestión-de-documentos)
6. [Partes Diarios](#partes-diarios)
7. [Gestión de Materiales](#gestión-de-materiales)
8. [Sistema de Notas](#sistema-de-notas)
9. [Contactos Auxiliares](#contactos-auxiliares)
10. [Historial de Cambios](#historial-de-cambios)
11. [Firma del Cliente](#firma-del-cliente)
12. [Flujos y Procesos](#flujos-y-procesos)

---

## 🎯 Visión General

La pestaña de **Instalaciones** es el corazón de la aplicación ODS Energy. Permite gestionar proyectos fotovoltaicos desde su creación hasta su finalización, incluyendo documentos, partes diarios, materiales, notas colaborativas e historial de cambios.

### Componentes Principales

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| Listado de Instalaciones | `Installations.tsx` | Página principal con búsqueda y filtros |
| Detalle de Instalación | `InstallationDetail.tsx` | Vista completa con 6 pestañas |
| Notas | `NotesTab.tsx` | Sistema de comentarios en hilo |
| Historial | `HistoryTab.tsx` | Auditoría de cambios de estado |
| Contactos | `AuxiliaryContactsTab.tsx` | Contactos adicionales del cliente |

---

## 📄 Página Principal de Instalaciones

**URL:** `/installations`

**Propósito:** Mostrar listado de todas las instalaciones con búsqueda, filtros y opción de crear nuevas.

### 1. Estructura Visual

```
┌─────────────────────────────────────────────────────────┐
│  Instalaciones                                          │
│  Gestión de proyectos fotovoltaicos                    │
│                                    [Exportar] [Nueva]   │
├─────────────────────────────────────────────────────────┤
│  Filtros:                                               │
│  [Buscar] [Tipo] [Estado] [Desde] [Hasta]              │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Cliente A    │  │ Cliente B    │  │ Cliente C    │  │
│  │ Instalación  │  │ Avería       │  │ Mantenimiento│  │
│  │ 📍 Dirección │  │ 📍 Dirección │  │ 📍 Dirección │  │
│  │ 📅 Fecha     │  │ 📅 Fecha     │  │ 📅 Fecha     │  │
│  │ 🔧 ID        │  │ 🔧 ID        │  │ 🔧 ID        │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2. Componentes de la Página

#### 2.1 Encabezado
```typescript
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold text-foreground">Instalaciones</h1>
    <p className="text-muted-foreground mt-2">
      Gestión de proyectos fotovoltaicos
    </p>
  </div>
  <div className="flex gap-2">
    <ExportToExcel data={...} />  {/* Exportar a Excel */}
    {canCreateInstallations && (
      <Button onClick={() => setIsCreateDialogOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Nueva Instalación
      </Button>
    )}
  </div>
</div>
```

**Funcionalidades:**
- Título y descripción clara
- Botón "Exportar a Excel" (visible para todos)
- Botón "Nueva Instalación" (solo admin y project_manager)

#### 2.2 Panel de Filtros
```typescript
<Card>
  <CardContent className="pt-6">
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
      {/* 5 campos de filtro */}
    </div>
  </CardContent>
</Card>
```

**Filtros Disponibles:**

| Filtro | Tipo | Descripción |
|--------|------|-------------|
| **Buscar** | Text Input | Busca por ID Cliente o Nombre del Cliente (búsqueda case-insensitive) |
| **Tipo de Orden** | Select | Filtra por: Todos, Instalación, Avería, Mantenimiento |
| **Estado** | Select | Filtra por: Todos, Pendiente, En Progreso, Completada |
| **Fecha Inicio Desde** | Date Input | Filtra instalaciones con fecha >= a la seleccionada |
| **Fecha Inicio Hasta** | Date Input | Filtra instalaciones con fecha <= a la seleccionada |

**Lógica de Filtrado:**
```typescript
const filteredInstallations = installationsQuery.data?.filter((installation) => {
  // 1. Búsqueda por texto (ID Cliente o Nombre)
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    const matchesClientId = installation.clientId.toLowerCase().includes(query);
    const matchesClientName = installation.clientName.toLowerCase().includes(query);
    if (!matchesClientId && !matchesClientName) return false;
  }

  // 2. Filtro por tipo de orden
  if (filterWorkOrderType !== "all" && 
      installation.workOrderType !== filterWorkOrderType) {
    return false;
  }

  // 3. Filtro por estado
  if (filterStatus !== "all" && 
      installation.status !== filterStatus) {
    return false;
  }
  
  // 4. Filtro por rango de fechas (fecha inicio)
  if (filterStartDate) {
    const instStartDate = new Date(installation.startDate);
    const filterStart = new Date(filterStartDate);
    if (instStartDate < filterStart) return false;
  }
  
  if (filterEndDate) {
    const instStartDate = new Date(installation.startDate);
    const filterEnd = new Date(filterEndDate);
    if (instStartDate > filterEnd) return false;
  }

  return true;
}) || [];
```

#### 2.3 Tarjetas de Instalaciones
```typescript
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {filteredInstallations.map((installation) => (
    <Card
      key={installation.id}
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => setLocation(`/installations/${installation.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{installation.clientName}</CardTitle>
            <CardDescription className="mt-1">
              {getWorkOrderTypeLabel(installation.workOrderType)}
            </CardDescription>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full border 
            ${getStatusBadgeColor(installation.status)}`}>
            {getStatusLabel(installation.status)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Información de la instalación */}
      </CardContent>
    </Card>
  ))}
</div>
```

**Información en Cada Tarjeta:**
- **Nombre del Cliente**: Título principal
- **Tipo de Orden**: Subtítulo (Instalación, Avería, Mantenimiento)
- **Badge de Estado**: Color según estado
  - 🟡 Pendiente (amarillo)
  - 🔵 En Progreso (azul)
  - 🟢 Completada (verde)
- **Dirección**: Con icono de ubicación
- **Fecha de Inicio**: Con icono de calendario
- **ID Cliente**: Con icono de herramienta

**Interactividad:**
- Hacer clic en la tarjeta → Abre detalle de instalación
- Efecto hover: Aumenta sombra para feedback visual

#### 2.4 Exportación a Excel

**Funcionalidad:** Exporta todas las instalaciones filtradas a archivo Excel

**Columnas Exportadas:**
- ID Cliente
- Cliente
- Dirección
- Orden de Trabajo
- Estado
- Fecha Inicio
- Fecha Fin

**Datos Transformados:**
```typescript
data={filteredInstallations.map(inst => ({
  'ID Cliente': inst.clientId,
  'Cliente': inst.clientName,
  'Dirección': inst.address,
  'Orden de Trabajo': inst.workOrderType === 'installation' ? 'Instalación' 
                     : inst.workOrderType === 'breakdown' ? 'Avería' 
                     : 'Mantenimiento',
  'Estado': inst.status === 'pending' ? 'Pendiente' 
           : inst.status === 'in_progress' ? 'En Progreso' 
           : 'Completada',
  'Fecha Inicio': new Date(inst.startDate).toLocaleDateString('es-ES'),
  'Fecha Fin': inst.endDate ? new Date(inst.endDate).toLocaleDateString('es-ES') : '-',
}))}
```

#### 2.5 Estado Vacío

Si no hay instalaciones o ninguna coincide con los filtros:
```
🔧
No hay instalaciones registradas
Crea tu primera instalación para comenzar
```

### 3. Permisos y Roles

| Acción | Admin | Project Manager | Technician | Admin Manager |
|--------|-------|-----------------|-----------|---------------|
| Ver instalaciones | ✅ | ✅ | ✅ (solo asignadas) | ✅ |
| Crear instalación | ✅ | ✅ | ❌ | ❌ |
| Exportar a Excel | ✅ | ✅ | ✅ | ✅ |
| Buscar y filtrar | ✅ | ✅ | ✅ | ✅ |

### 4. Queries tRPC Utilizadas

```typescript
// Obtiene lista de todas las instalaciones
const installationsQuery = trpc.installations.list.useQuery();

// Obtiene lista de técnicos (solo si es admin o project_manager)
const techniciansQuery = trpc.users.listTechnicians.useQuery(undefined, {
  enabled: ['admin', 'project_manager'].includes(user?.role || ''),
});
```

---

## ➕ Crear Nueva Instalación

**Acceso:** Solo Admin y Project Manager

**Trigger:** Botón "Nueva Instalación" en la página principal

### 1. Diálogo Modal

```
┌─────────────────────────────────────────┐
│ Nueva Instalación                       │
│ Crear un nuevo proyecto de instalación  │
│ fotovoltaica                            │
├─────────────────────────────────────────┤
│ [Formulario con 8 secciones]            │
├─────────────────────────────────────────┤
│              [Cancelar] [Crear]         │
└─────────────────────────────────────────┘
```

### 2. Campos del Formulario

#### Sección 1: Identificación del Cliente (2 columnas)

**Campo 1: ID Cliente** ⭐
- Tipo: Text Input
- Requerido: Sí
- Placeholder: "Ej: CLI-001"
- Validación: No vacío
- Descripción: Identificador único del cliente

**Campo 2: Nombre del Cliente** ⭐
- Tipo: Text Input
- Requerido: Sí
- Validación: No vacío
- Descripción: Nombre completo o razón social

#### Sección 2: Contacto del Cliente (2 columnas)

**Campo 3: Email del Cliente**
- Tipo: Email Input
- Requerido: No
- Placeholder: "cliente@ejemplo.com"
- Validación: Formato email válido (si se completa)
- Descripción: Para envío de PDFs y notificaciones

**Campo 4: Teléfono del Cliente**
- Tipo: Tel Input
- Requerido: No
- Placeholder: "+34 600 000 000"
- Descripción: Contacto principal del cliente

#### Sección 3: Ubicación

**Campo 5: Dirección** ⭐
- Tipo: Textarea
- Requerido: Sí
- Validación: No vacío
- Descripción: Dirección completa de la instalación

#### Sección 4: Tipo de Trabajo (2 columnas)

**Campo 6: Orden de Trabajo** ⭐
- Tipo: Select
- Requerido: Sí
- Opciones:
  - Instalación (nueva instalación de paneles)
  - Avería (reparación de sistema existente)
  - Mantenimiento (mantenimiento preventivo)
- Validación: Debe seleccionar uno

**Campo 7: Fecha de Inicio** ⭐
- Tipo: Date Input
- Requerido: Sí
- Validación: No vacío
- Descripción: Fecha de inicio del proyecto

#### Sección 5: Descripción del Trabajo

**Campo 8: Descripción del Trabajo** ⭐
- Tipo: Textarea (4 filas)
- Requerido: Sí
- Placeholder: "Describe el trabajo a realizar..."
- Validación: No vacío
- Descripción: Detalles completos del trabajo

#### Sección 6: Asignación de Técnicos

**Técnicos Asignados**
- Tipo: Checkboxes (lista scrollable)
- Requerido: No
- Altura máxima: 192px (scrollable)
- Descripción: Seleccionar técnicos que trabajarán en el proyecto

**Lógica de Selección:**
```typescript
const handleTechnicianToggle = (techId: number, checked: boolean) => {
  if (checked) {
    // Agregar técnico
    setFormData({
      ...formData,
      assignedTechnicianIds: [...formData.assignedTechnicianIds, techId],
    });
  } else {
    // Remover técnico
    setFormData({
      ...formData,
      assignedTechnicianIds: formData.assignedTechnicianIds.filter(id => id !== techId),
    });
  }
};
```

### 3. Validación del Formulario

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validación: Tipo de orden obligatorio
  if (!formData.workOrderType) {
    toast.error("Debes seleccionar un tipo de orden de trabajo");
    return;
  }
  
  // Si todas las validaciones pasan, enviar
  createMutation.mutate({
    clientId: formData.clientId,
    clientName: formData.clientName,
    clientEmail: formData.clientEmail || undefined,
    clientPhone: formData.clientPhone || undefined,
    address: formData.address,
    workOrderType: formData.workOrderType as "installation" | "breakdown" | "maintenance",
    workDescription: formData.workDescription,
    startDate: new Date(formData.startDate),
    assignedTechnicianIds: formData.assignedTechnicianIds.length > 0 
      ? formData.assignedTechnicianIds 
      : undefined,
  });
};
```

### 4. Proceso de Creación

```
1. Usuario completa formulario
   ↓
2. Hace clic en "Crear Instalación"
   ↓
3. Se valida el formulario
   ↓
4. Se envía mutation tRPC
   ↓
5. Servidor crea registro en BD
   ↓
6. Se invalida caché de instalaciones
   ↓
7. Se cierra diálogo
   ↓
8. Se muestra toast de éxito
   ↓
9. Se resetea formulario
   ↓
10. Lista se actualiza automáticamente
```

### 5. Estado Inicial de Instalación

Cuando se crea una instalación:
- **Estado:** "pending" (Pendiente)
- **Fecha Inicio:** La especificada en el formulario
- **Fecha Fin:** null (se establece al completar)
- **Firma del Cliente:** null (se captura después)

---

## 🔍 Detalle de Instalación

**URL:** `/installations/:id`

**Propósito:** Vista completa de una instalación con todas sus funcionalidades

### 1. Estructura General

```
┌─────────────────────────────────────────────────────────┐
│ [← Volver]                                              │
│                                                          │
│ Cliente A                                  [Botones]    │
│ Instalación                                             │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │ Información Proyecto │  │ Información Cliente  │    │
│  │ - Dirección          │  │ - Nombre             │    │
│  │ - Estado             │  │ - ID Cliente         │    │
│  │ - Fechas             │  │ - Orden de Trabajo   │    │
│  │                      │  │ - Descripción        │    │
│  └──────────────────────┘  └──────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Firma de Conformidad del Cliente                 │  │
│  │ [Capturar Firma del Cliente]                     │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│ [Documentos] [Partes Diarios] [Materiales] ...         │
│                                                          │
│ Contenido de la pestaña seleccionada                   │
└─────────────────────────────────────────────────────────┘
```

### 2. Sección Superior: Información Rápida

#### 2.1 Encabezado
```typescript
<div className="flex items-center gap-4">
  <Button variant="ghost" onClick={() => setLocation("/installations")}>
    <ArrowLeft className="w-4 h-4 mr-2" />
    Volver
  </Button>
</div>
```

#### 2.2 Título y Botones de Acción
```typescript
<div className="flex items-start justify-between">
  <div>
    <h1 className="text-3xl font-bold text-foreground">{installation.clientName}</h1>
    <p className="text-muted-foreground mt-2">
      {installation.workOrderType === 'installation' && 'Instalación'}
      {installation.workOrderType === 'breakdown' && 'Avería'}
      {installation.workOrderType === 'maintenance' && 'Mantenimiento'}
    </p>
  </div>
  
  {user?.role !== 'technician' && (
    <div className="flex gap-2">
      {/* Botones de cambio de estado */}
    </div>
  )}
</div>
```

### 3. Botones de Cambio de Estado

**Solo visible para:** Admin, Project Manager, Admin Manager

**Lógica de Transición de Estados:**

```
PENDIENTE
   ↓
   └─→ [Iniciar Trabajo] → EN PROGRESO
                              ↓
                              ├─→ [Completar Instalación] → COMPLETADA
                              │   (requiere firma del cliente)
                              │
                              └─→ [Reabrir] → PENDIENTE

COMPLETADA
   ↓
   └─→ [Reabrir Instalación] → EN PROGRESO
```

#### Estado: Pendiente
```typescript
{installation.status === 'pending' && (
  <Button 
    onClick={() => updateStatusMutation.mutate({ 
      id: installationId, 
      status: 'in_progress' 
    })}
    disabled={updateStatusMutation.isPending}
  >
    Iniciar Trabajo
  </Button>
)}
```

**Acción:** Cambia estado a "En Progreso"
**Efecto:** Se envía email de inicio a info@odsenergy.es

#### Estado: En Progreso
```typescript
{installation.status === 'in_progress' && (
  <div className="flex flex-col items-end gap-2">
    <Button 
      onClick={() => {
        if (!installation.clientSignatureUrl) {
          toast.error('Debe capturar la firma del cliente antes de completar');
          return;
        }
        updateStatusMutation.mutate({ 
          id: installationId, 
          status: 'completed' 
        });
      }}
      disabled={updateStatusMutation.isPending || !installation.clientSignatureUrl}
      className="bg-green-600 hover:bg-green-700"
    >
      Completar Instalación
    </Button>
    {!installation.clientSignatureUrl && (
      <p className="text-xs text-muted-foreground">
        Requiere firma del cliente
      </p>
    )}
  </div>
)}
```

**Acción:** Cambia estado a "Completada"
**Validación:** Requiere que exista firma del cliente
**Efecto:** Se envía email de finalización a info@odsenergy.es

#### Estado: Completada
```typescript
{installation.status === 'completed' && (
  <Button 
    variant="outline"
    onClick={() => updateStatusMutation.mutate({ 
      id: installationId, 
      status: 'in_progress' 
    })}
    disabled={updateStatusMutation.isPending}
  >
    Reabrir Instalación
  </Button>
)}
```

**Acción:** Cambia estado a "En Progreso"
**Uso:** Si se necesita hacer cambios después de completar

### 4. Tarjetas de Información

#### Tarjeta 1: Información del Proyecto

```
┌─────────────────────────────────┐
│ Información del Proyecto        │
├─────────────────────────────────┤
│ 📍 Dirección                    │
│    Calle Principal 123, Madrid  │
│                                 │
│ Estado                          │
│ [En Progreso]                   │
│                                 │
│ 📅 Fechas                       │
│    01/01/2025 - 15/01/2025      │
└─────────────────────────────────┘
```

**Información Mostrada:**
- **Dirección:** Ubicación de la instalación
- **Estado:** Badge con color según estado
- **Fechas:** Rango de inicio a fin (si existe)

#### Tarjeta 2: Información del Cliente

```
┌─────────────────────────────────┐
│ Información del Cliente         │
├─────────────────────────────────┤
│ Nombre                          │
│ Juan García López               │
│                                 │
│ ID Cliente                      │
│ CLI-001                         │
│                                 │
│ Orden de Trabajo                │
│ Instalación                     │
│                                 │
│ Descripción del Trabajo         │
│ Instalación de 10 paneles...    │
└─────────────────────────────────┘
```

**Información Mostrada:**
- **Nombre:** Nombre del cliente
- **ID Cliente:** Identificador único
- **Orden de Trabajo:** Tipo de trabajo
- **Descripción:** Detalles del trabajo (con saltos de línea preservados)

#### Tarjeta 3: Firma de Conformidad del Cliente

**Visible cuando:** Estado es "En Progreso" o "Completada"

```
┌─────────────────────────────────┐
│ Firma de Conformidad del Cliente│
│ El cliente ha firmado...        │
├─────────────────────────────────┤
│ Firma capturada:                │
│ [Imagen de firma]               │
│                                 │
│ Fecha: 15/01/2025 14:30:00      │
└─────────────────────────────────┘
```

**Si no hay firma:**
```
┌─────────────────────────────────┐
│ Firma de Conformidad del Cliente│
│ Captura la firma del cliente... │
├─────────────────────────────────┤
│ [Capturar Firma del Cliente]    │
└─────────────────────────────────┘
```

### 5. Sistema de Pestañas

**6 Pestañas Disponibles:**

```
[Documentos] [Partes Diarios] [Materiales] [Notas] [Contactos] [Historial]
```

---

## 📁 Gestión de Documentos

**Pestaña:** Documents

**Propósito:** Almacenar y gestionar documentos asociados a la instalación

### 1. Interfaz

```
┌─────────────────────────────────────────────────┐
│ Documentos de la Instalación                    │
│                            [Subir Documento]    │
├─────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐             │
│ │ 📄 Plano.pdf │  │ 📄 Proyecto  │             │
│ │ Plano        │  │ Proyecto     │             │
│ │ [Descargar]  │  │ [Descargar]  │             │
│ │ [Eliminar]   │  │ [Eliminar]   │             │
│ └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────┘
```

### 2. Tipos de Documentos

| Tipo | Código | Descripción |
|------|--------|-------------|
| Plano | `plan` | Planos técnicos de la instalación |
| Proyecto | `project` | Documentación del proyecto |
| Plan de Seguridad | `safety_plan` | Plan de seguridad y salud |
| Contrato | `contract` | Contrato con el cliente |
| Permiso | `permit` | Permisos y autorizaciones |
| Especificación | `specification` | Especificaciones técnicas |
| Conformidad | `conformity` | PDF de conformidad del cliente |
| Otro | `other` | Otros documentos |

### 3. Subir Documento

**Diálogo Modal:**

```
┌─────────────────────────────────┐
│ Subir Documento                 │
│ Agregar un nuevo documento      │
├─────────────────────────────────┤
│ Tipo de Documento *             │
│ [Seleccionar tipo ▼]            │
│                                 │
│ Archivo *                       │
│ [Seleccionar archivo]           │
│                                 │
│ Nombre del Documento            │
│ [Nombre automático]             │
├─────────────────────────────────┤
│           [Cancelar] [Subir]    │
└─────────────────────────────────┘
```

**Campos:**
- **Tipo de Documento:** Select con 8 opciones
- **Archivo:** Input file (con `capture="environment"` en móvil)
- **Nombre:** Se auto-completa con el nombre del archivo

**Proceso de Carga:**

```typescript
const handleUpload = async () => {
  if (!uploadFile || !documentType) {
    toast.error("Selecciona un archivo y tipo de documento");
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    // Convertir archivo a base64
    const base64 = e.target?.result as string;
    const base64Data = base64.split(',')[1];

    // Enviar al servidor
    uploadMutation.mutate({
      installationId,
      name: uploadFile.name,
      documentType: documentType as any,
      fileData: base64Data,
      mimeType: uploadFile.type,
    });
  };
  reader.readAsDataURL(uploadFile);
};
```

**Servidor:**
1. Recibe base64 del archivo
2. Sube a S3 con key: `installations/{installationId}/documents/{documentId}-{filename}`
3. Obtiene URL pública de S3
4. Crea registro en BD con metadata
5. Retorna URL

### 4. Tarjetas de Documentos

**Información por Documento:**
- Nombre del documento
- Tipo de documento
- Botón Descargar (abre en nueva pestaña)
- Botón Eliminar (solo para admin/project_manager)

**Descarga:**
```typescript
<a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
  <Download className="w-4 h-4 mr-2" />
  Descargar
</a>
```

**Eliminación:**
```typescript
if (confirm('¿Eliminar este documento?')) {
  deleteMutation.mutate({ id: doc.id });
}
```

### 5. Permisos

| Acción | Admin | Project Manager | Technician |
|--------|-------|-----------------|-----------|
| Ver documentos | ✅ | ✅ | ✅ |
| Subir documentos | ✅ | ✅ | ❌ |
| Descargar documentos | ✅ | ✅ | ✅ |
| Eliminar documentos | ✅ | ✅ | ❌ |

---

## 📊 Partes Diarios

**Pestaña:** Reports

**Propósito:** Mostrar todos los partes diarios registrados en la instalación

### 1. Interfaz

```
┌─────────────────────────────────────────────────┐
│ Partes Diarios                                  │
│                [Exportar PDF] [Nuevo Parte]     │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Lunes, 29 de diciembre de 2025              │ │
│ │ 8 horas trabajadas                          │ │
│ │                                             │ │
│ │ Instalación de paneles solares en...        │ │
│ │ [Ver detalles]                              │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Martes, 30 de diciembre de 2025             │ │
│ │ 6 horas trabajadas                          │ │
│ │                                             │ │
│ │ Conexión de inversores y pruebas...         │ │
│ │ [Ver detalles]                              │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 2. Información por Parte Diario

**Tarjeta de Parte:**
- **Fecha:** Formato completo en español (Lunes, 29 de diciembre de 2025)
- **Horas Trabajadas:** "X horas trabajadas"
- **Descripción:** Primeras 2 líneas (truncadas)
- **Botón "Ver detalles":** Link a `/daily-reports/{reportId}`

### 3. Botones de Acción

#### Botón: Exportar PDF Consolidado
**Visible:** Solo si hay partes diarios y usuario es admin/project_manager

**Funcionalidad:**
```typescript
onClick={() => generateConsolidatedPDFMutation.mutate({ installationId })}
```

**Proceso:**
1. Obtiene todos los partes diarios de la instalación
2. Obtiene todas las fotos de cada parte
3. Obtiene firma del cliente (si existe)
4. Genera PDF consolidado
5. Sube a S3
6. Abre descarga automática

**PDF Consolidado Incluye:**
- Portada con datos de la instalación
- Cada parte diario con:
  - Fecha
  - Descripción
  - Horas trabajadas
  - Técnico
  - Fotos con captions
- Firma del cliente al final

#### Botón: Nuevo Parte
**Visible:** Para todos

**Acción:**
```typescript
onClick={() => setLocation(`/daily-reports/new?installationId=${installationId}`)}
```

Redirige a `/daily-reports/new` con parámetro `installationId` pre-rellenado

### 4. Estado Vacío

Si no hay partes diarios:
```
📄
No hay partes diarios registrados
[Nuevo Parte]
```

---

## 🛠️ Gestión de Materiales

**Pestaña:** Materials

**Propósito:** Gestionar materiales llegados y solicitudes de materiales

### 1. Interfaz

```
┌─────────────────────────────────────────────────┐
│ Materiales                                      │
│                    [Gestionar Materiales]       │
├─────────────────────────────────────────────────┤
│ Haz clic en "Gestionar Materiales" para         │
│ registrar llegadas de material o solicitar      │
│ materiales necesarios                           │
└─────────────────────────────────────────────────┘
```

### 2. Acceso a Gestión de Materiales

**Botón:**
```typescript
<Button onClick={() => setLocation(`/installations/${installationId}/materials`)}>
  <Plus className="w-4 h-4 mr-2" />
  Gestionar Materiales
</Button>
```

**Redirige a:** `/installations/{installationId}/materials`

**Página Separada:** Tiene su propia interfaz con:
- Pestaña: Materiales Llegados
- Pestaña: Solicitudes de Materiales

---

## 💬 Sistema de Notas

**Pestaña:** Notes

**Propósito:** Sistema de comentarios colaborativos en hilo

### 1. Interfaz

```
┌─────────────────────────────────────────────────┐
│ Notas de la Instalación                         │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Juan García - Hace 2 horas                  │ │
│ │                                             │ │
│ │ Se ha completado la instalación de los      │ │
│ │ primeros 5 paneles. El cliente está         │ │
│ │ satisfecho con el progreso.                 │ │
│ │                                             │ │
│ │ [Responder] [Eliminar]                      │ │
│ │                                             │ │
│ │ ↳ María López - Hace 1 hora                 │ │
│ │   Excelente. ¿Cuándo se instalan los       │ │
│ │   inversores?                               │ │
│ │   [Eliminar]                                │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Escribir nueva nota...]                    │ │
│ │                                             │ │
│ │                        [Enviar]             │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 2. Estructura de Notas

**Notas Principales:**
- Autor (nombre del usuario)
- Timestamp relativo ("Hace 2 horas")
- Contenido de la nota
- Botones: Responder, Eliminar

**Respuestas (Replies):**
- Indentadas con flecha (↳)
- Misma estructura que notas principales
- Se agrupan bajo su nota padre

### 3. Crear Nota

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!newNote.trim()) {
    toast.error("La nota no puede estar vacía");
    return;
  }
  
  createMutation.mutate({
    installationId,
    noteText: newNote.trim(),
  });
};
```

**Validación:**
- No puede estar vacía
- Se trimea el contenido

### 4. Responder a Nota

```typescript
const handleReply = (parentNoteId: number) => {
  if (!replyText.trim()) {
    toast.error("La respuesta no puede estar vacía");
    return;
  }
  
  createMutation.mutate({
    installationId,
    noteText: replyText.trim(),
    parentNoteId,  // Vincula respuesta a nota padre
  });
};
```

### 5. Eliminar Nota

**Permisos:**
- Autor de la nota: Siempre puede eliminar
- Admin/Project Manager/Admin Manager: Pueden eliminar cualquier nota
- Técnicos: Solo pueden eliminar sus propias notas

```typescript
const canDelete = userId === note.userId || canManage;
```

### 6. Organización de Notas

**Algoritmo:**
```typescript
const organizeNotes = () => {
  if (!notesQuery.data) return [];
  
  // Separar notas principales (sin padre) de respuestas
  const parentNotes = notesQuery.data.filter(note => !note.parentNoteId);
  const childNotes = notesQuery.data.filter(note => note.parentNoteId);
  
  // Agrupar respuestas bajo sus notas padre
  return parentNotes.map(parent => ({
    ...parent,
    replies: childNotes
      .filter(child => child.parentNoteId === parent.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  }))
  // Ordenar notas principales por más recientes primero
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
```

---

## 👥 Contactos Auxiliares

**Pestaña:** Contacts

**Propósito:** Gestionar contactos adicionales del cliente

### 1. Interfaz

```
┌─────────────────────────────────────────────────┐
│ Contactos Auxiliares                            │
│                            [Agregar Contacto]   │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Nombre: Juan Pérez                          │ │
│ │ Teléfono: +34 600 111 222                   │ │
│ │ Rol: Jefe de Mantenimiento                  │ │
│ │                    [Editar] [Eliminar]      │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Nombre: María García                        │ │
│ │ Teléfono: +34 600 333 444                   │ │
│ │ Rol: Responsable de Obra                    │ │
│ │                    [Editar] [Eliminar]      │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 2. Información por Contacto

- **Nombre:** Nombre completo del contacto
- **Teléfono:** Número de teléfono
- **Rol:** Función del contacto en la obra

### 3. Agregar Contacto

**Diálogo Modal:**

```
┌─────────────────────────────────┐
│ Agregar Contacto                │
├─────────────────────────────────┤
│ Nombre del Contacto *           │
│ [Nombre]                        │
│                                 │
│ Teléfono *                      │
│ [+34 600 000 000]               │
│                                 │
│ Rol *                           │
│ [Jefe de Mantenimiento]         │
├─────────────────────────────────┤
│           [Cancelar] [Agregar]  │
└─────────────────────────────────┘
```

### 4. Permisos

| Acción | Admin | Project Manager | Technician |
|--------|-------|-----------------|-----------|
| Ver contactos | ✅ | ✅ | ✅ |
| Agregar contactos | ✅ | ✅ | ❌ |
| Editar contactos | ✅ | ✅ | ❌ |
| Eliminar contactos | ✅ | ✅ | ❌ |

---

## 📜 Historial de Cambios

**Pestaña:** History

**Propósito:** Auditoría de todos los cambios de estado de la instalación

### 1. Interfaz

```
┌─────────────────────────────────────────────────┐
│ Historial de Cambios de Estado                  │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ [Pendiente] → [En Progreso]                 │ │
│ │                      Juan García            │ │
│ │                      15/01/2025 14:30:00    │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ [En Progreso] → [Completada]                │ │
│ │                      Juan García            │ │
│ │                      20/01/2025 16:45:30    │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 2. Información por Entrada

**Cada entrada muestra:**
- **Estado Anterior:** Badge con color
- **Flecha:** Indicador de transición
- **Estado Nuevo:** Badge con color
- **Usuario:** Quién realizó el cambio
- **Timestamp:** Fecha y hora exacta

### 3. Colores de Estados

| Estado | Color | Código |
|--------|-------|--------|
| Pendiente | Amarillo | `text-yellow-600 bg-yellow-50 border-yellow-200` |
| En Progreso | Azul | `text-blue-600 bg-blue-50 border-blue-200` |
| Completada | Verde | `text-green-600 bg-green-50 border-green-200` |

### 4. Orden de Visualización

- Más recientes primero (orden inverso cronológico)
- Cada cambio registra:
  - ID del usuario que hizo el cambio
  - Estado anterior
  - Estado nuevo
  - Timestamp exacto

---

## 🖊️ Firma del Cliente

**Ubicación:** Tarjeta separada en la sección superior + Pestaña "Firma del Cliente"

**Propósito:** Capturar firma digital del cliente para conformidad

### 1. Diálogo Modal

```
┌─────────────────────────────────┐
│ Capturar Firma del Cliente      │
│ Dibuja la firma en el área      │
│ de abajo                        │
├─────────────────────────────────┤
│ ┌───────────────────────────┐   │
│ │                           │   │
│ │    [Área de Canvas]       │   │
│ │    (para dibujar firma)   │   │
│ │                           │   │
│ └───────────────────────────┘   │
│                                 │
│ Email del Cliente *             │
│ [cliente@ejemplo.com]           │
│                                 │
│ Observaciones del Técnico       │
│ [Textarea]                      │
│                                 │
│ [Limpiar] [Cancelar] [Guardar]  │
└─────────────────────────────────┘
```

### 2. Campos del Diálogo

#### Canvas de Firma
- **Componente:** `SignatureCanvas` (react-signature-canvas)
- **Tamaño:** Área amplia para dibujar
- **Validación:** No puede estar vacío

#### Email del Cliente
- **Tipo:** Email Input
- **Requerido:** Sí
- **Pre-rellenado:** Con email de la instalación (si existe)
- **Validación:** Formato email válido
- **Descripción:** Para envío de PDF de conformidad

#### Observaciones del Técnico
- **Tipo:** Textarea
- **Requerido:** No
- **Descripción:** Notas adicionales antes de firmar

### 3. Validación

```typescript
const handleSaveSignature = () => {
  if (!signatureCanvasRef.current) return;
  
  // Validar que hay firma
  if (signatureCanvasRef.current.isEmpty()) {
    toast.error("Por favor, capture la firma del cliente");
    return;
  }
  
  // Validar email
  if (!clientEmail.trim()) {
    toast.error("El email del cliente es obligatorio");
    return;
  }
  
  // Validar formato email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clientEmail.trim())) {
    toast.error("Por favor, introduce un email válido");
    return;
  }
  
  // Si todo es válido, guardar
  const signatureData = signatureCanvasRef.current
    .toDataURL('image/png')
    .split(',')[1];  // Obtener base64
  
  signatureMutation.mutate({
    installationId,
    signatureData,
    technicianObservations: technicianObservations.trim() || undefined,
    clientEmail: clientEmail.trim(),
  });
};
```

### 4. Proceso de Guardado

```
1. Usuario dibuja firma en canvas
   ↓
2. Ingresa email del cliente
   ↓
3. Ingresa observaciones (opcional)
   ↓
4. Hace clic en "Guardar"
   ↓
5. Se validan todos los campos
   ↓
6. Se convierte firma a base64
   ↓
7. Se envía al servidor
   ↓
8. Servidor sube firma a S3
   ↓
9. Servidor genera PDF de conformidad
   ↓
10. Servidor envía emails a:
    - info@odsenergy.es
    - francisco.oliver@odsenergy.es
    - Email especificado (si es diferente)
   ↓
11. Se crea documento de tipo "conformity"
   ↓
12. Se actualiza instalación con:
    - clientSignatureUrl
    - clientSignatureDate
    - conformityPdfUrl
    - conformityPdfKey
   ↓
13. Se cierra diálogo
   ↓
14. Se muestra toast de éxito
   ↓
15. Tarjeta se actualiza mostrando firma
```

### 5. Después de Guardar

**Tarjeta Actualizada:**
```
┌─────────────────────────────────┐
│ Firma de Conformidad del Cliente│
│ El cliente ha firmado...        │
├─────────────────────────────────┤
│ Firma capturada:                │
│ [Imagen de firma]               │
│                                 │
│ Fecha: 15/01/2025 14:30:00      │
└─────────────────────────────────┘
```

### 6. PDF de Conformidad

**Contenido del PDF:**
- Logo de la empresa
- Título: "CONFORMIDAD DEL CLIENTE"
- Datos de la instalación
- Descripción del trabajo
- Observaciones del técnico
- Firma digital del cliente
- Fecha de firma
- Pie de página con datos de contacto

**Almacenamiento:**
- En S3: `installations/{installationId}/conformity/{installationId}-conformity.pdf`
- En BD: Registro en tabla `documents` con tipo "conformity"

**Emails Enviados:**
- **A:** info@odsenergy.es, francisco.oliver@odsenergy.es, email del cliente
- **Asunto:** "Conformidad del Cliente - [Cliente Name]"
- **Adjunto:** PDF de conformidad

---

## 🔄 Flujos y Procesos

### Flujo 1: Crear y Completar Instalación

```
1. Admin/Project Manager en página de instalaciones
   └─ Hace clic en "Nueva Instalación"

2. Se abre diálogo modal
   └─ Completa todos los campos requeridos
   └─ Selecciona técnicos (opcional)

3. Hace clic en "Crear Instalación"
   └─ Validación del formulario
   └─ Envío de mutation tRPC

4. Servidor crea instalación
   └─ Estado: "pending"
   └─ Se registra en BD
   └─ Se invalida caché

5. Usuario es redirigido a detalle
   └─ Ve instalación con estado "Pendiente"
   └─ Botón "Iniciar Trabajo" disponible

6. Admin/Project Manager hace clic en "Iniciar Trabajo"
   └─ Estado cambia a "in_progress"
   └─ Se registra en historial
   └─ Se envía email de inicio

7. Técnicos crean partes diarios
   └─ Registran trabajo diario
   └─ Capturan fotos
   └─ Firman digitalmente

8. Técnico captura firma del cliente
   └─ Dibuja firma en canvas
   └─ Ingresa email del cliente
   └─ Se genera PDF de conformidad
   └─ Se envían emails

9. Admin/Project Manager completa instalación
   └─ Hace clic en "Completar Instalación"
   └─ Validación: Requiere firma del cliente
   └─ Estado cambia a "completed"
   └─ Se registra en historial
   └─ Se envía email de finalización
   └─ Se establece fecha de fin

10. Instalación está completada
    └─ Botón "Reabrir Instalación" disponible
    └─ Todos los documentos accesibles
    └─ PDF consolidado disponible
```

### Flujo 2: Gestión de Documentos

```
1. Usuario en detalle de instalación
   └─ Pestaña "Documentos"
   └─ Hace clic en "Subir Documento"

2. Se abre diálogo de carga
   └─ Selecciona tipo de documento
   └─ Selecciona archivo
   └─ Se auto-completa nombre

3. Hace clic en "Subir"
   └─ Se convierte archivo a base64
   └─ Se envía al servidor

4. Servidor procesa documento
   └─ Sube a S3
   └─ Crea registro en BD
   └─ Retorna URL pública

5. Documento aparece en lista
   └─ Muestra nombre y tipo
   └─ Botones: Descargar, Eliminar

6. Usuario puede descargar
   └─ Hace clic en "Descargar"
   └─ Se abre en nueva pestaña

7. Usuario puede eliminar (si permisos)
   └─ Hace clic en "Eliminar"
   └─ Confirmación
   └─ Se elimina de BD y S3
```

### Flujo 3: Crear Parte Diario

```
1. Usuario en detalle de instalación
   └─ Pestaña "Partes Diarios"
   └─ Hace clic en "Nuevo Parte"

2. Redirigido a /daily-reports/new
   └─ installationId pre-rellenado

3. Usuario completa formulario
   └─ Selecciona instalación
   └─ Ingresa descripción
   └─ Ingresa horas trabajadas

4. Usuario captura fotos
   └─ Hace clic en "Agregar Foto"
   └─ En móvil: Abre cámara
   └─ Captura foto
   └─ Ingresa caption (opcional)
   └─ Puede agregar más fotos

5. Usuario firma digitalmente
   └─ Dibuja firma en canvas
   └─ Validación: No puede estar vacía

6. Usuario hace clic en "Guardar"
   └─ Validación de campos
   └─ Conversión de fotos a base64
   └─ Conversión de firma a base64

7. Servidor procesa parte
   └─ Sube fotos a S3
   └─ Sube firma a S3
   └─ Crea registros en BD
   └─ Envía notificación

8. Usuario redirigido a detalle del parte
   └─ Puede ver todas las fotos
   └─ Puede descargar PDF
```

---

## 📊 Resumen de Queries tRPC

### Instalaciones

```typescript
// Obtener lista de instalaciones
trpc.installations.list.useQuery()

// Obtener detalle de instalación
trpc.installations.getById.useQuery({ id: installationId })

// Crear instalación
trpc.installations.create.useMutation()

// Actualizar estado
trpc.installations.updateStatus.useMutation()

// Agregar firma del cliente
trpc.installations.addClientSignature.useMutation()
```

### Documentos

```typescript
// Obtener documentos de instalación
trpc.documents.listByInstallation.useQuery({ installationId })

// Subir documento
trpc.documents.upload.useMutation()

// Eliminar documento
trpc.documents.delete.useMutation()
```

### Partes Diarios

```typescript
// Obtener partes de instalación
trpc.dailyReports.listByInstallation.useQuery({ installationId })

// Generar PDF consolidado
trpc.dailyReports.generateConsolidatedPDF.useMutation()
```

### Notas

```typescript
// Obtener notas
trpc.installationNotes.list.useQuery({ installationId })

// Crear nota
trpc.installationNotes.create.useMutation()

// Eliminar nota
trpc.installationNotes.delete.useMutation()
```

### Historial

```typescript
// Obtener historial de cambios
trpc.installationStatusHistory.list.useQuery({ installationId })
```

### Usuarios

```typescript
// Obtener lista de técnicos
trpc.users.listTechnicians.useQuery()

// Obtener todos los usuarios
trpc.users.list.useQuery()
```

---

## 🎨 Estilos y Colores

### Estados de Instalación

| Estado | Color | Badge | Uso |
|--------|-------|-------|-----|
| Pendiente | Amarillo | `bg-yellow-100 text-yellow-800 border-yellow-300` | Instalación no iniciada |
| En Progreso | Azul | `bg-blue-100 text-blue-800 border-blue-300` | Trabajo en curso |
| Completada | Verde | `bg-green-100 text-green-800 border-green-300` | Trabajo finalizado |

### Componentes UI

- **Tarjetas:** `Card` de shadcn/ui
- **Botones:** `Button` con variantes (default, outline, destructive, ghost)
- **Inputs:** `Input`, `Textarea`, `Select`
- **Diálogos:** `Dialog` de shadcn/ui
- **Iconos:** Lucide React

---

## 🔐 Permisos Resumidos

| Acción | Admin | PM | Tech | AM |
|--------|-------|----|----|-----|
| Ver instalaciones | ✅ | ✅ | ✅* | ✅ |
| Crear instalación | ✅ | ✅ | ❌ | ❌ |
| Cambiar estado | ✅ | ✅ | ❌ | ❌ |
| Subir documentos | ✅ | ✅ | ❌ | ❌ |
| Crear partes | ✅ | ✅ | ✅ | ✅ |
| Capturar firma | ✅ | ✅ | ✅ | ✅ |
| Crear notas | ✅ | ✅ | ✅ | ✅ |
| Gestionar contactos | ✅ | ✅ | ❌ | ❌ |
| Ver historial | ✅ | ✅ | ✅ | ✅ |

**Leyenda:**
- ✅ = Permitido
- ❌ = No permitido
- ✅* = Solo las asignadas
- Admin = Administrador
- PM = Project Manager
- Tech = Technician
- AM = Admin Manager

---

## 📝 Conclusión

La pestaña de **Instalaciones** es un sistema completo y robusto para gestionar proyectos fotovoltaicos. Proporciona:

✅ **Gestión completa del ciclo de vida** de instalaciones
✅ **Colaboración en equipo** mediante notas y comentarios
✅ **Documentación centralizada** de todos los archivos
✅ **Auditoría completa** de cambios
✅ **Captura digital de firmas** con PDF automático
✅ **Permisos granulares** por rol
✅ **Interfaz intuitiva** y responsive
✅ **Integración con S3** para almacenamiento seguro


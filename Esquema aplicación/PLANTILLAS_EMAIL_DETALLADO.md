# 📧 Pestaña de Plantillas de Email - Guía Completa y Detallada

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Interfaz de Usuario](#interfaz-de-usuario)
4. [Tipos de Plantillas](#tipos-de-plantillas)
5. [Sistema de Variables](#sistema-de-variables)
6. [Lógica de Funcionamiento](#lógica-de-funcionamiento)
7. [Base de Datos](#base-de-datos)
8. [Dependencias y Alternativas](#dependencias-y-alternativas)
9. [Migración a LucusHost](#migración-a-lucushost)
10. [Implementación Recomendada](#implementación-recomendada)

---

## 🎯 Visión General

La pestaña de **Plantillas de Email** permite a los administradores personalizar los mensajes automáticos del sistema. Cada vez que ocurre un evento importante (instalación iniciada, completada, conformidad firmada), el sistema envía un email usando la plantilla configurada.

### Características Principales

✅ **3 Tipos de Plantillas**: Instalación iniciada, completada, conformidad
✅ **Variables Dinámicas**: Reemplazo automático de datos reales
✅ **Editor HTML**: Personalización completa del contenido
✅ **Logo Personalizado**: URL configurable del logo de empresa
✅ **Firma Personalizada**: Firma HTML personalizable
✅ **Control de Acceso**: Solo administradores pueden editar
✅ **Plantillas por Defecto**: Se crean automáticamente si no existen
✅ **Activación/Desactivación**: Habilitar o deshabilitar plantillas

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico Actual

```
Frontend:
├── React 19.2.1
├── shadcn/ui (Componentes UI)
├── Tailwind CSS 4.1.14 (Estilos)
└── Tabs, Textarea, Input (Componentes)

Backend:
├── Express 4.21.2
├── tRPC 11.6.0 (API type-safe)
├── Drizzle ORM (Base de datos)
└── MySQL (Almacenamiento)

Email:
├── SendGrid / Nodemailer (Será configurado)
└── Email Template Renderer (Motor de plantillas)
```

### Estructura de Archivos

```
client/src/pages/
├── EmailTemplates.tsx       ← Componente principal

server/
├── routers.ts               ← Endpoints tRPC
├── email-template-renderer.ts ← Motor de plantillas
├── email-notifications.ts   ← Envío de emails
└── db.ts                    ← Funciones de BD

drizzle/
└── schema.ts                ← Tabla emailTemplates
```

### Flujo de Datos

```
Usuario (Admin)
    ↓
[EmailTemplates.tsx] - Interfaz UI
    ↓
[trpc.emailTemplates.*] - Endpoints tRPC
    ├─ list: Obtener todas las plantillas
    ├─ getByType: Obtener una plantilla específica
    ├─ create: Crear nueva plantilla
    ├─ update: Actualizar plantilla
    └─ delete: Eliminar plantilla
    ↓
[db.emailTemplates] - Base de datos
    ↓
[email-template-renderer.ts] - Motor de renderizado
    ├─ renderTemplate: Reemplazar variables
    └─ getRenderedEmailTemplate: Obtener plantilla renderizada
    ↓
[Email Service] - SendGrid / Nodemailer
    ↓
[Cliente] - Email recibido
```

---

## 🎨 Interfaz de Usuario

### Layout General

```
┌─────────────────────────────────────────────────────┐
│ DashboardLayout (Sidebar + Contenido)               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Plantillas de Email                                │
│  Personaliza los mensajes automáticos del sistema   │
│                                                      │
│  ℹ️ Las plantillas utilizan variables dinámicas     │
│     en formato {{nombreVariable}}                   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ [Instalación Iniciada] [Completada] [Conf.] │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Instalación Iniciada                         │   │
│  │ Email enviado cuando instalación inicia      │   │
│  │                                              │   │
│  │ Asunto:                                      │   │
│  │ Instalación Iniciada - {{clientId}}...       │   │
│  │                                              │   │
│  │ Cuerpo del mensaje:                          │   │
│  │ [Vista previa HTML truncada...]              │   │
│  │                                              │   │
│  │ Variables disponibles:                       │   │
│  │ • {{clientId}} - ID del cliente              │   │
│  │ • {{clientName}} - Nombre del cliente        │   │
│  │ • {{address}} - Dirección                    │   │
│  │ • ... (más variables)                        │   │
│  │                                              │   │
│  │ [Editar Plantilla]                           │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Componentes Principales

#### 1. Encabezado

```typescript
<div>
  <h1 className="text-3xl font-bold">Plantillas de Email</h1>
  <p className="text-muted-foreground mt-2">
    Personaliza los mensajes automáticos del sistema
  </p>
</div>
```

**Elementos:**
- Título: "Plantillas de Email"
- Descripción: Explicación breve

#### 2. Alerta Informativa

```typescript
<Alert>
  <Info className="h-4 w-4" />
  <AlertDescription>
    Las plantillas utilizan variables dinámicas en formato <code>{'{{nombreVariable}}'}</code>.
    Estas variables se reemplazan automáticamente con los datos reales al enviar el email.
  </AlertDescription>
</Alert>
```

**Propósito:**
- Informar sobre el sistema de variables
- Mostrar formato de variables
- Ayuda al usuario

#### 3. Tabs de Plantillas

```typescript
<Tabs defaultValue="installation_started" className="space-y-4">
  <TabsList>
    <TabsTrigger value="installation_started">Instalación Iniciada</TabsTrigger>
    <TabsTrigger value="installation_completed">Instalación Completada</TabsTrigger>
    <TabsTrigger value="client_conformity">Conformidad del Cliente</TabsTrigger>
  </TabsList>

  {/* Contenido de cada tab */}
</Tabs>
```

**Funcionalidad:**
- 3 tabs para cada tipo de plantilla
- Navegación entre plantillas
- Contenido específico por tab

#### 4. Vista de Lectura (No Editando)

```typescript
{!isEditing ? (
  <>
    {/* Asunto */}
    <div>
      <Label className="text-sm font-semibold">Asunto</Label>
      <p className="text-sm text-muted-foreground mt-1">
        {template?.subject || 'No configurado'}
      </p>
    </div>

    {/* Cuerpo del mensaje */}
    <div>
      <Label className="text-sm font-semibold">Cuerpo del mensaje</Label>
      <div className="mt-1 p-3 bg-muted rounded-md text-sm max-h-40 overflow-y-auto">
        {template?.body ? (
          <div dangerouslySetInnerHTML={{ __html: template.body.substring(0, 200) + '...' }} />
        ) : (
          'No configurado'
        )}
      </div>
    </div>

    {/* Variables disponibles */}
    <div>
      <Label className="text-sm font-semibold">Variables disponibles</Label>
      <ul className="mt-2 space-y-1">
        {info.variables.map((variable, idx) => (
          <li key={idx} className="text-sm text-muted-foreground">
            <code className="bg-muted px-1 py-0.5 rounded">{variable.split(' - ')[0]}</code>
            {' - '}
            {variable.split(' - ')[1]}
          </li>
        ))}
      </ul>
    </div>

    {/* Botón editar */}
    <Button onClick={() => handleEdit(key as any)}>
      Editar Plantilla
    </Button>
  </>
) : (
  /* Modo edición */
)}
```

**Elementos:**
- Asunto (solo lectura)
- Vista previa del cuerpo (primeros 200 caracteres)
- Lista de variables disponibles
- Botón para editar

#### 5. Vista de Edición

```typescript
{isEditing ? (
  <>
    {/* Asunto */}
    <div className="space-y-2">
      <Label htmlFor="subject">Asunto</Label>
      <Input
        id="subject"
        value={editingTemplate.subject}
        onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
        placeholder="Asunto del email"
      />
    </div>

    {/* Cuerpo (HTML) */}
    <div className="space-y-2">
      <Label htmlFor="body">Cuerpo del mensaje (HTML)</Label>
      <Textarea
        id="body"
        value={editingTemplate.body}
        onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
        placeholder="Contenido HTML del email"
        rows={10}
        className="font-mono text-sm"
      />
    </div>

    {/* Firma (HTML) */}
    <div className="space-y-2">
      <Label htmlFor="signature">Firma (HTML)</Label>
      <Textarea
        id="signature"
        value={editingTemplate.signature}
        onChange={(e) => setEditingTemplate({ ...editingTemplate, signature: e.target.value })}
        placeholder="Firma HTML del email"
        rows={3}
        className="font-mono text-sm"
      />
    </div>

    {/* URL del Logo */}
    <div className="space-y-2">
      <Label htmlFor="logoUrl">URL del Logo</Label>
      <Input
        id="logoUrl"
        value={editingTemplate.logoUrl}
        onChange={(e) => setEditingTemplate({ ...editingTemplate, logoUrl: e.target.value })}
        placeholder="https://..."
      />
      {editingTemplate.logoUrl && (
        <img src={editingTemplate.logoUrl} alt="Logo preview" className="max-w-xs mt-2" />
      )}
    </div>

    {/* Variables disponibles */}
    <div>
      <Label className="text-sm font-semibold">Variables disponibles</Label>
      <ul className="mt-2 space-y-1">
        {info.variables.map((variable, idx) => (
          <li key={idx} className="text-sm text-muted-foreground">
            <code className="bg-muted px-1 py-0.5 rounded">{variable.split(' - ')[0]}</code>
            {' - '}
            {variable.split(' - ')[1]}
          </li>
        ))}
      </ul>
    </div>

    {/* Botones */}
    <div className="flex gap-2">
      <Button onClick={handleSave} disabled={updateMutation.isPending || createMutation.isPending}>
        {(updateMutation.isPending || createMutation.isPending) && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        <Save className="mr-2 h-4 w-4" />
        Guardar
      </Button>
      <Button variant="outline" onClick={() => setEditingTemplate(null)}>
        Cancelar
      </Button>
    </div>
  </>
) : null}
```

**Elementos:**
- Input para asunto
- Textarea para cuerpo HTML (10 líneas)
- Textarea para firma HTML (3 líneas)
- Input para URL del logo
- Preview del logo
- Lista de variables
- Botones Guardar y Cancelar

---

## 📧 Tipos de Plantillas

### 1. Instalación Iniciada

**Tipo:** `installation_started`

**Descripción:** Email enviado cuando una instalación cambia a estado "En Progreso"

**Variables Disponibles:**
```
{{clientId}}        - ID del cliente
{{clientName}}      - Nombre del cliente
{{address}}         - Dirección de la instalación
{{workOrderType}}   - Tipo de trabajo (Instalación/Avería/Mantenimiento)
{{startDate}}       - Fecha de inicio
{{installationId}}  - ID de la instalación
{{workDescription}} - Descripción del trabajo
{{logoUrl}}         - URL del logo de la empresa
```

**Plantilla por Defecto:**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; padding: 20px;">
    <img src="{{logoUrl}}" alt="ODS Energy" style="max-width: 300px;" />
  </div>
  <h2 style="color: #333;">Instalación Iniciada</h2>
  <p>Se ha iniciado una nueva instalación que requiere facturación del hito correspondiente.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>ID Cliente:</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">{{clientId}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Cliente:</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">{{clientName}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Dirección:</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">{{address}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Tipo de Trabajo:</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">{{workOrderType}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Fecha de Inicio:</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">{{startDate}}</td>
    </tr>
  </table>
  <p style="color: #d9534f; font-weight: bold;">⚠️ Acción requerida: Facturar el hito correspondiente</p>
</div>
```

**Asunto por Defecto:**
```
Instalación Iniciada - {{clientId}} - {{clientName}}
```

**Casos de Uso:**
- Notificar a gestores de proyectos
- Recordar facturación de hito
- Información de cliente y dirección

### 2. Instalación Completada

**Tipo:** `installation_completed`

**Descripción:** Email enviado cuando una instalación se marca como completada

**Variables Disponibles:**
```
{{clientId}}        - ID del cliente
{{clientName}}      - Nombre del cliente
{{address}}         - Dirección de la instalación
{{endDate}}         - Fecha de finalización
{{installationId}}  - ID de la instalación
{{logoUrl}}         - URL del logo de la empresa
```

**Plantilla por Defecto:**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; padding: 20px;">
    <img src="{{logoUrl}}" alt="ODS Energy" style="max-width: 300px;" />
  </div>
  <h2 style="color: #5cb85c;">✓ Instalación Completada</h2>
  <p>Se ha completado una instalación exitosamente.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>ID Cliente:</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">{{clientId}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Cliente:</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">{{clientName}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Dirección:</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">{{address}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Fecha de Finalización:</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">{{endDate}}</td>
    </tr>
  </table>
</div>
```

**Asunto por Defecto:**
```
Instalación Completada - {{clientId}} - {{clientName}}
```

**Casos de Uso:**
- Notificar finalización exitosa
- Información de cliente
- Fecha de finalización

### 3. Conformidad del Cliente

**Tipo:** `client_conformity`

**Descripción:** Email enviado con el PDF de conformidad firmado por el cliente

**Variables Disponibles:**
```
{{clientId}}        - ID del cliente
{{clientName}}      - Nombre del cliente
{{signatureDate}}   - Fecha de la firma
{{installationId}}  - ID de la instalación
{{logoUrl}}         - URL del logo de la empresa
```

**Plantilla por Defecto:**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; padding: 20px;">
    <img src="{{logoUrl}}" alt="ODS Energy" style="max-width: 300px;" />
  </div>
  <h2 style="color: #333;">Documento de Conformidad del Cliente</h2>
  <p>Adjunto encontrará el documento de conformidad firmado por el cliente.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>ID Cliente:</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">{{clientId}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Cliente:</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">{{clientName}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Fecha de Firma:</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">{{signatureDate}}</td>
    </tr>
  </table>
  <p>El documento PDF firmado está adjunto a este correo.</p>
</div>
```

**Asunto por Defecto:**
```
Documento de Conformidad - {{clientId}} - {{clientName}}
```

**Casos de Uso:**
- Enviar PDF de conformidad
- Confirmación de firma
- Información de cliente

---

## 🔄 Sistema de Variables

### Mecanismo de Reemplazo

**Formato:** `{{nombreVariable}}`

**Ejemplo:**
```html
Hola {{clientName}},

Se ha iniciado la instalación en {{address}}.
Fecha de inicio: {{startDate}}

Saludos,
ODS Energy
```

**Después del Reemplazo:**
```html
Hola Cliente A,

Se ha iniciado la instalación en Calle Principal 123.
Fecha de inicio: 15/01/2025

Saludos,
ODS Energy
```

### Función de Renderizado

```typescript
export function renderTemplate(template: string, variables: TemplateVariables): string {
  let rendered = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(regex, String(value || ''));
  }
  
  return rendered;
}
```

**Proceso:**
1. Recibe plantilla HTML y variables
2. Para cada variable, crea regex: `{{nombreVariable}}`
3. Reemplaza todas las ocurrencias con el valor
4. Retorna HTML renderizado

### Validación de Variables

```typescript
interface TemplateVariables {
  [key: string]: string | number | undefined;
}
```

**Reglas:**
- Las variables pueden ser strings o números
- Las variables undefined se reemplazan por string vacío
- Las variables no usadas se ignoran
- Las variables faltantes en el objeto no se reemplazan

---

## ⚙️ Lógica de Funcionamiento

### Flujo de Edición

```
1. Usuario hace clic en "Editar Plantilla"
   ↓
2. Sistema busca plantilla existente por tipo
   ├─ Si existe: Cargar datos en formulario
   └─ Si no existe: Crear plantilla vacía
   ↓
3. Usuario edita campos
   ├─ Asunto
   ├─ Cuerpo (HTML)
   ├─ Firma (HTML)
   └─ URL del Logo
   ↓
4. Usuario hace clic en "Guardar"
   ↓
5. Validación
   ├─ ¿Asunto no vacío?
   ├─ ¿Cuerpo no vacío?
   └─ Si alguno vacío → Error
   ↓
6. Si es nueva plantilla → Crear
   Si es existente → Actualizar
   ↓
7. Refrescar lista de plantillas
   ↓
8. Mostrar toast de éxito
   ↓
9. Cerrar formulario de edición
```

### Flujo de Envío de Email

```
1. Evento dispara envío de email
   ├─ Instalación iniciada
   ├─ Instalación completada
   └─ Conformidad firmada
   ↓
2. Obtener plantilla por tipo
   ↓
3. Verificar si plantilla está activa
   ├─ Si no activa → No enviar
   └─ Si activa → Continuar
   ↓
4. Preparar variables
   ├─ clientId, clientName, address, etc.
   └─ Según tipo de plantilla
   ↓
5. Renderizar plantilla
   ├─ Asunto
   ├─ Cuerpo
   ├─ Firma
   └─ Logo
   ↓
6. Enviar email
   ├─ A través de SendGrid / Nodemailer
   └─ Con PDF adjunto (si aplica)
   ↓
7. Registrar en logs
```

### Flujo de Lectura

```typescript
const { data: templates, isLoading, refetch } = trpc.emailTemplates.list.useQuery();

// 1. Al cargar la página
// → Ejecuta query trpc.emailTemplates.list
// → Obtiene todas las plantillas de BD
// → Renderiza tabs

// 2. Usuario selecciona tab
// → Busca plantilla del tipo en array
// → Muestra información en vista de lectura

// 3. Usuario hace clic en "Editar"
// → Copia datos de plantilla a estado de edición
// → Cambia a vista de edición

// 4. Usuario hace clic en "Cancelar"
// → Limpia estado de edición
// → Vuelve a vista de lectura
```

### Flujo de Guardado

```typescript
const handleSave = async () => {
  if (!editingTemplate) return;

  try {
    if (editingTemplate.id) {
      // Actualizar plantilla existente
      await updateMutation.mutateAsync({
        id: editingTemplate.id,
        subject: editingTemplate.subject,
        body: editingTemplate.body,
        signature: editingTemplate.signature,
        logoUrl: editingTemplate.logoUrl,
      });
      toast.success('Plantilla actualizada correctamente');
    } else {
      // Crear nueva plantilla
      await createMutation.mutateAsync({
        templateType: editingTemplate.templateType,
        subject: editingTemplate.subject,
        body: editingTemplate.body,
        signature: editingTemplate.signature,
        logoUrl: editingTemplate.logoUrl,
        isActive: 1,
      });
      toast.success('Plantilla creada correctamente');
    }
    
    // Refrescar lista
    refetch();
    
    // Cerrar formulario
    setEditingTemplate(null);
  } catch (error) {
    toast.error('Error al guardar la plantilla');
    console.error(error);
  }
};
```

---

## 💾 Base de Datos

### Tabla emailTemplates

```sql
CREATE TABLE emailTemplates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  templateType ENUM('installation_started', 'installation_completed', 'client_conformity') NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  body LONGTEXT NOT NULL,
  signature LONGTEXT,
  logoUrl LONGTEXT,
  isActive TINYINT UNSIGNED DEFAULT 1 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
```

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | ID único de la plantilla |
| `templateType` | ENUM | Tipo de plantilla (única por tipo) |
| `subject` | VARCHAR(255) | Asunto del email |
| `body` | LONGTEXT | Cuerpo HTML del email |
| `signature` | LONGTEXT | Firma HTML personalizada |
| `logoUrl` | LONGTEXT | URL del logo de empresa |
| `isActive` | TINYINT | 1 = activa, 0 = inactiva |
| `createdAt` | TIMESTAMP | Fecha de creación |
| `updatedAt` | TIMESTAMP | Fecha de última actualización |

### Funciones de BD (db.ts)

```typescript
// Obtener todas las plantillas
async function getAllEmailTemplates() {
  return await db.query.emailTemplates.findMany();
}

// Obtener plantilla por tipo
async function getEmailTemplateByType(templateType: string) {
  return await db.query.emailTemplates.findFirst({
    where: eq(emailTemplates.templateType, templateType),
  });
}

// Crear plantilla
async function createEmailTemplate(data: InsertEmailTemplate) {
  return await db.insert(emailTemplates).values(data);
}

// Actualizar plantilla
async function updateEmailTemplate(id: number, data: Partial<InsertEmailTemplate>) {
  return await db.update(emailTemplates)
    .set(data)
    .where(eq(emailTemplates.id, id));
}

// Eliminar plantilla
async function deleteEmailTemplate(id: number) {
  return await db.delete(emailTemplates)
    .where(eq(emailTemplates.id, id));
}
```

---

## 📦 Dependencias y Alternativas

### Dependencias Actuales

#### 1. **Manus Notification System** (Fallback)

**Propósito:** Sistema de notificaciones de Manus como fallback

**Uso:**
```typescript
const { notifyOwner } = await import('./_core/notification');
await notifyOwner({
  title: subject,
  content: notificationContent,
});
```

**Problema:** Dependencia de Manus, no funcionará en LucusHost

**Alternativas:**
- **SendGrid** (Recomendado)
- **Nodemailer** (SMTP)
- **AWS SES**

#### 2. **React Hooks** (Estado)

**Propósito:** Gestión de estado del componente

**Uso:**
```typescript
const [editingTemplate, setEditingTemplate] = useState<{...} | null>(null);
```

**Características:**
- ✅ Nativo de React
- ✅ Sin dependencias externas
- ✅ Suficiente para este caso

#### 3. **tRPC** (API)

**Propósito:** Llamadas al backend type-safe

**Uso:**
```typescript
const { data: templates } = trpc.emailTemplates.list.useQuery();
const updateMutation = trpc.emailTemplates.update.useMutation();
```

**Características:**
- ✅ Type-safe
- ✅ Caching automático
- ✅ Manejo de errores

**Recomendación:** Mantener tRPC

---

## 🚀 Migración a LucusHost

### Cambios Necesarios

| Componente | Actual | Recomendado | Prioridad |
|-----------|--------|------------|-----------|
| Email Service | Manus Notify | SendGrid | 🔴 Alta |
| Base de Datos | MySQL Manus | MySQL Local | 🟢 Baja |
| Frontend | React | Mantener | 🟢 Baja |
| Backend | tRPC | Mantener | 🟢 Baja |

### Plan de Migración

#### Fase 1: Configurar Email Service (Día 1)

**Cambio:** Manus Notify → SendGrid

```typescript
// Antes (Manus)
const { notifyOwner } = await import('./_core/notification');
await notifyOwner({
  title: subject,
  content: notificationContent,
});

// Después (SendGrid)
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmailNotification(
  to: string,
  subject: string,
  htmlContent: string,
  signature?: string
) {
  try {
    const finalHtml = signature 
      ? `${htmlContent}<br/>${signature}`
      : htmlContent;

    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject,
      html: finalHtml,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
```

**Variables de Entorno:**
```env
SENDGRID_API_KEY=tu-api-key
SENDGRID_FROM_EMAIL=noreply@odsenergy.es
```

#### Fase 2: Actualizar Email Notifications (Día 2)

**Archivo:** `server/email-notifications.ts`

```typescript
// Reemplazar notifyOwner con sendEmailNotification
import { sendEmailNotification } from './email-service';

export async function notifyInstallationStart(data: InstallationStartData) {
  try {
    const template = await getRenderedEmailTemplate('installation_started', {
      clientId: data.installation.clientId,
      clientName: data.installation.clientName,
      address: data.installation.address,
      workOrderType: data.installation.workOrderType,
      startDate: new Date(data.installation.startDate).toLocaleDateString('es-ES'),
      installationId: data.installation.id.toString(),
      workDescription: data.installation.workDescription,
      logoUrl: template?.logoUrl || '',
    });

    if (!template) {
      console.log('[Email] Template not active for installation_started');
      return false;
    }

    // Enviar a gestores de proyecto
    const projectManagers = await db.getAllUsers();
    const pmEmails = projectManagers
      .filter(user => user.role === 'project_manager' && user.email)
      .map(user => user.email);

    for (const email of pmEmails) {
      await sendEmailNotification(
        email,
        template.subject,
        template.body,
        template.signature
      );
    }

    return true;
  } catch (error) {
    console.error('[Email] Failed to send installation start notification:', error);
    return false;
  }
}
```

#### Fase 3: Testing (Día 3)

```bash
# 1. Tests unitarios
npm run test

# 2. Probar envío de email
# - Cambiar estado de instalación
# - Verificar email recibido
# - Verificar variables reemplazadas

# 3. Probar plantillas personalizadas
# - Editar plantilla
# - Cambiar variables
# - Verificar en email
```

#### Fase 4: Deployment (Día 4)

```bash
# 1. Configurar variables de entorno
# .env
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=...

# 2. Build
npm run build

# 3. Deploy a LucusHost
# Seguir guía de LucusHost

# 4. Verificar
# - Plantillas cargadas
# - Emails enviándose correctamente
```

### Checklist de Migración

```markdown
## Email Service
- [ ] Crear cuenta SendGrid
- [ ] Obtener API key
- [ ] Instalar @sendgrid/mail
- [ ] Crear función sendEmailNotification
- [ ] Actualizar email-notifications.ts
- [ ] Probar envío de emails
- [ ] Verificar variables reemplazadas

## Base de Datos
- [ ] Verificar tabla emailTemplates existe
- [ ] Verificar datos de plantillas
- [ ] Probar queries de BD

## Testing
- [ ] Tests unitarios pasan
- [ ] Emails se envían correctamente
- [ ] Variables se reemplazan correctamente
- [ ] Plantillas personalizadas funcionan

## Deployment
- [ ] Configurar variables de entorno
- [ ] Build exitoso
- [ ] Deploy a LucusHost
- [ ] Verificar funcionamiento en producción
```

---

## 📝 Conclusión

La pestaña de **Plantillas de Email** es un componente robusto que permite personalizar los mensajes automáticos del sistema. La migración a LucusHost requiere principalmente reemplazar el sistema de notificaciones de Manus con SendGrid.

### Recomendaciones Finales

✅ **Email Service:** SendGrid (más confiable y fácil de usar)
✅ **Base de Datos:** Mantener MySQL local
✅ **Frontend:** Mantener React + tRPC
✅ **Plantillas:** Mantener sistema de variables actual

### Estimación de Esfuerzo

- **Email Service:** 2-3 horas
- **Actualizar Notificaciones:** 2 horas
- **Testing:** 2 horas
- **Deployment:** 1 hora
- **Total:** 7-8 horas de desarrollo

### Beneficios de la Migración

✅ Independencia de Manus
✅ Mejor confiabilidad de emails
✅ Mejor deliverability
✅ Más opciones de personalización
✅ Mejor soporte y documentación


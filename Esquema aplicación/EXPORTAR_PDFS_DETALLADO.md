# 📄 Pestaña de Exportar PDFs (Bulk Export) - Guía Completa y Detallada

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Interfaz de Usuario](#interfaz-de-usuario)
4. [Flujo de Exportación](#flujo-de-exportación)
5. [Generadores de PDFs](#generadores-de-pdfs)
6. [Estructura del ZIP](#estructura-del-zip)
7. [Lógica de Funcionamiento](#lógica-de-funcionamiento)
8. [Dependencias y Alternativas](#dependencias-y-alternativas)
9. [Migración a LucusHost](#migración-a-lucushost)
10. [Implementación Recomendada](#implementación-recomendada)

---

## 🎯 Visión General

La pestaña de **Exportar PDFs** (Bulk Export) permite a los administradores generar y descargar múltiples PDFs de instalaciones completadas en un único archivo ZIP. Es una herramienta de reportería masiva que facilita la gestión de documentación.

### Características Principales

✅ **Filtrado Avanzado**: Por rango de fechas y cliente
✅ **Múltiples Tipos de Documentos**: Certificados de conformidad y partes diarios
✅ **Compresión ZIP**: Archivo comprimido con máxima compresión
✅ **Organización Automática**: PDFs organizados por carpetas de instalación
✅ **Resumen Incluido**: Archivo de resumen con detalles de exportación
✅ **Descarga Directa**: URL pública para descargar el ZIP
✅ **Control de Acceso**: Solo administradores pueden exportar
✅ **Procesamiento Asincrónico**: Manejo de grandes volúmenes

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico Actual

```
Frontend:
├── React 19.2.1
├── shadcn/ui (Componentes UI)
├── Tailwind CSS 4.1.14 (Estilos)
└── sonner (Notificaciones toast)

Backend:
├── Express 4.21.2
├── tRPC 11.6.0 (API type-safe)
├── archiver 7.0.1 (Compresión ZIP)
├── jsPDF 3.0.4 (Generación de PDFs)
├── pdfkit 0.17.2 (Generación de PDFs)
├── axios 1.12.0 (Descargas de imágenes)
└── Drizzle ORM (Base de datos)

Almacenamiento:
└── S3 Manus (Será reemplazado)
```

### Estructura de Archivos

```
client/src/pages/
├── BulkExport.tsx          ← Componente principal

server/
├── routers.ts              ← Endpoint tRPC
├── bulk-pdf-export.ts      ← Generador de ZIP
├── pdf-generator.ts        ← Generador de partes diarios
├── conformity-pdf-generator.ts  ← Generador de conformidad
├── consolidated-pdf-generator.ts ← Generador consolidado
└── db.ts                   ← Funciones de BD
```

### Flujo de Datos

```
Usuario (Admin)
    ↓
[BulkExport.tsx] - Interfaz UI
    ↓
[trpc.dailyReports.exportBulkPDFs] - Endpoint tRPC
    ↓
[bulk-pdf-export.ts] - Generador de ZIP
    ├─ [pdf-generator.ts] - Partes diarios
    └─ [conformity-pdf-generator.ts] - Conformidad
    ↓
[archiver] - Compresión ZIP
    ↓
[S3 Manus] - Almacenamiento
    ↓
[URL pública] - Descarga
```

---

## 🎨 Interfaz de Usuario

### Layout General

```
┌─────────────────────────────────────────────────────┐
│ DashboardLayout (Sidebar + Contenido)               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Exportación Masiva de PDFs                         │
│  Genere y descargue múltiples PDFs en un ZIP        │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 📁 Configurar Exportación                    │   │
│  │                                              │   │
│  │ ID Cliente (opcional)                        │   │
│  │ [Ej: CLI-001________________]                │   │
│  │ Filtrar por ID de cliente específico         │   │
│  │                                              │   │
│  │ Fecha Inicio (opcional)  Fecha Fin (opt.)   │   │
│  │ [____________]           [____________]     │   │
│  │ Desde el inicio           Hasta hoy          │   │
│  │                                              │   │
│  │ Tipos de Documentos                          │   │
│  │ ☑ Certificados de Conformidad               │   │
│  │ ☑ Partes Diarios de Trabajo                 │   │
│  │                                              │   │
│  │ [⬇ Generar y Descargar ZIP]                 │   │
│  │                                              │   │
│  │ ℹ Información:                               │   │
│  │ • Solo instalaciones completadas             │   │
│  │ • PDFs organizados por carpetas              │   │
│  │ • ZIP incluye resumen de exportación         │   │
│  │ • Puede tardar varios minutos                │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Componentes Principales

#### 1. Encabezado

```typescript
<div>
  <h1 className="text-3xl font-bold text-foreground">
    Exportación Masiva de PDFs
  </h1>
  <p className="text-muted-foreground mt-2">
    Genere y descargue múltiples PDFs de instalaciones completadas en un archivo ZIP
  </p>
</div>
```

**Elementos:**
- Título principal: "Exportación Masiva de PDFs"
- Descripción: Explicación breve de la funcionalidad

#### 2. Tarjeta de Configuración

```typescript
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <FileArchive className="w-5 h-5" />
      Configurar Exportación
    </CardTitle>
    <CardDescription>
      Seleccione el rango de fechas y los tipos de documentos a incluir
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Formulario */}
  </CardContent>
</Card>
```

**Estructura:**
- Icono de archivo
- Título: "Configurar Exportación"
- Descripción: Instrucciones

#### 3. Filtro de Cliente

```typescript
<div>
  <Label htmlFor="clientId">ID Cliente (opcional)</Label>
  <Input
    id="clientId"
    type="text"
    placeholder="Ej: CLI-001"
    value={clientId}
    onChange={(e) => setClientId(e.target.value)}
    disabled={exportMutation.isPending}
  />
  <p className="text-sm text-muted-foreground mt-1">
    Filtrar por ID de cliente específico
  </p>
</div>
```

**Funcionalidad:**
- Input de texto para ID de cliente
- Placeholder: "Ej: CLI-001"
- Deshabilitado durante exportación
- Texto de ayuda

#### 4. Filtro de Rango de Fechas

```typescript
<div className="grid gap-4 md:grid-cols-2">
  <div>
    <Label htmlFor="startDate">Fecha Inicio (opcional)</Label>
    <Input
      id="startDate"
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      disabled={exportMutation.isPending}
    />
    <p className="text-sm text-muted-foreground mt-1">
      Dejar vacío para incluir desde el inicio
    </p>
  </div>
  <div>
    <Label htmlFor="endDate">Fecha Fin (opcional)</Label>
    <Input
      id="endDate"
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      disabled={exportMutation.isPending}
    />
    <p className="text-sm text-muted-foreground mt-1">
      Dejar vacío para incluir hasta hoy
    </p>
  </div>
</div>
```

**Funcionalidad:**
- Dos inputs de fecha (inicio y fin)
- Grid responsivo (2 columnas en desktop)
- Ambos campos opcionales
- Deshabilitados durante exportación

#### 5. Selección de Tipos de Documentos

```typescript
<div className="space-y-4">
  <Label>Tipos de Documentos</Label>
  <div className="space-y-3">
    <div className="flex items-center space-x-2">
      <Checkbox
        id="conformity"
        checked={includeConformity}
        onCheckedChange={(checked) => setIncludeConformity(checked as boolean)}
        disabled={exportMutation.isPending}
      />
      <label htmlFor="conformity" className="text-sm font-medium">
        Certificados de Conformidad del Cliente
      </label>
    </div>
    <div className="flex items-center space-x-2">
      <Checkbox
        id="dailyReports"
        checked={includeDailyReports}
        onCheckedChange={(checked) => setIncludeDailyReports(checked as boolean)}
        disabled={exportMutation.isPending}
      />
      <label htmlFor="dailyReports" className="text-sm font-medium">
        Partes Diarios de Trabajo
      </label>
    </div>
  </div>
</div>
```

**Funcionalidad:**
- Dos checkboxes: Conformidad y Partes Diarios
- Ambos seleccionados por defecto
- Deshabilitados durante exportación
- Validación: Al menos uno debe estar seleccionado

#### 6. Botón de Exportación

```typescript
<Button
  onClick={handleExport}
  disabled={exportMutation.isPending || (!includeConformity && !includeDailyReports)}
  className="w-full md:w-auto"
  size="lg"
>
  {exportMutation.isPending ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Generando ZIP...
    </>
  ) : (
    <>
      <Download className="w-4 h-4 mr-2" />
      Generar y Descargar ZIP
    </>
  )}
</Button>
```

**Estados:**
- **Normal**: Icono de descarga + "Generar y Descargar ZIP"
- **Cargando**: Spinner + "Generando ZIP..."
- **Deshabilitado**: Si no hay documentos seleccionados

#### 7. Sección de Información

```typescript
<div className="bg-muted p-4 rounded-lg">
  <h4 className="font-semibold text-sm mb-2">Información:</h4>
  <ul className="text-sm text-muted-foreground space-y-1">
    <li>• Solo se incluirán instalaciones completadas</li>
    <li>• Los PDFs se organizarán por carpetas de instalación</li>
    <li>• El archivo ZIP incluirá un resumen de la exportación</li>
    <li>• El proceso puede tardar varios minutos para grandes volúmenes</li>
  </ul>
</div>
```

**Información:**
- Fondo gris claro
- Puntos de información importantes
- Expectativas del usuario

---

## 🔄 Flujo de Exportación

### Flujo Completo

```
1. Usuario hace clic en "Generar y Descargar ZIP"
   ↓
2. Validación
   ├─ ¿Al menos un tipo de documento seleccionado?
   └─ Si no → Mostrar error "Debe seleccionar al menos un tipo"
   ↓
3. Llamada a tRPC: exportBulkPDFs
   ├─ startDate: Date | undefined
   ├─ endDate: Date | undefined
   ├─ clientId: string | undefined
   ├─ includeConformity: boolean
   └─ includeDailyReports: boolean
   ↓
4. Validación en Backend
   ├─ ¿Usuario es admin?
   └─ Si no → Error FORBIDDEN
   ↓
5. Generación de ZIP
   ├─ Obtener todas las instalaciones
   ├─ Filtrar por estado (completed)
   ├─ Filtrar por fecha y cliente
   ├─ Para cada instalación:
   │  ├─ Generar PDF de conformidad (si aplica)
   │  ├─ Generar PDFs de partes diarios (si aplica)
   │  └─ Agregar al ZIP
   └─ Crear archivo RESUMEN.txt
   ↓
6. Compresión ZIP
   ├─ Nivel de compresión: 9 (máximo)
   └─ Crear buffer del ZIP
   ↓
7. Subir ZIP a S3
   ├─ Generar nombre: bulk-exports/export-{dateRange}-{timestamp}.zip
   ├─ Subir a S3
   └─ Obtener URL pública
   ↓
8. Retornar URL al cliente
   ↓
9. Cliente descarga ZIP
   ├─ Mostrar toast: "Exportación completada"
   └─ Abrir URL en nueva pestaña
```

### Manejo de Errores

```
Errores Posibles:
├─ No hay documentos seleccionados
│  └─ Toast: "Debe seleccionar al menos un tipo de documento"
│
├─ Usuario no es admin
│  └─ Error tRPC: "No tienes permiso para exportar PDFs masivamente"
│
├─ No hay instalaciones completadas
│  └─ ZIP vacío con README.txt
│
├─ Error generando PDF
│  └─ Se salta la instalación, continúa con la siguiente
│
└─ Error subiendo a S3
   └─ Error tRPC general
```

---

## 📄 Generadores de PDFs

### 1. Generador de Partes Diarios (pdf-generator.ts)

**Propósito:** Generar PDF individual de un parte diario

**Estructura del PDF:**

```
┌─────────────────────────────────────────┐
│                                         │
│              [LOGO ODS]                 │
│                                         │
│      PARTE DIARIO DE TRABAJO            │
│                                         │
├─────────────────────────────────────────┤
│ INFORMACIÓN DE LA INSTALACIÓN           │
│ Cliente: Cliente A                      │
│ Dirección: Calle Principal 123          │
│ Tipo: Instalación                       │
│                                         │
│ INFORMACIÓN DEL PARTE                   │
│ Fecha: 15/01/2025                       │
│ Técnico: Juan García                    │
│ Horas trabajadas: 8                     │
│                                         │
│ DESCRIPCIÓN DEL TRABAJO                 │
│ Se realizó la instalación del sistema   │
│ fotovoltaico de 5kW...                  │
│                                         │
│ FOTOS DE AVANCE                         │
│ Total de fotos adjuntas: 5              │
│ • Foto inicial                          │
│ • Instalación de paneles                │
│ • Conexión de inversores                │
│ • Pruebas de funcionamiento             │
│ • Foto final                            │
│                                         │
│ FIRMA DEL TÉCNICO                       │
│ (Firma digital registrada)              │
│                                         │
├─────────────────────────────────────────┤
│ Generado: 15/01/2025 14:30              │
└─────────────────────────────────────────┘
```

**Código Principal:**

```typescript
export async function generateDailyReportPDF(reportId: number): Promise<Buffer> {
  // 1. Obtener datos
  const report = await db.getDailyReportById(reportId);
  const photos = await db.getPhotosByDailyReport(reportId);
  const installation = await db.getInstallationById(report.installationId);
  const user = await db.getUserById(report.userId);

  // 2. Crear documento PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // 3. Agregar logo
  try {
    const logoUrl = 'https://files.manuscdn.com/...';
    doc.addImage(logoUrl, 'JPEG', pageWidth / 2 - 30, yPosition - 5, 60, 15);
    yPosition += 15;
  } catch (error) {
    // Fallback: Texto en lugar de logo
    doc.setFontSize(20);
    doc.text("ODS Energy", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;
  }

  // 4. Título
  doc.setFontSize(16);
  doc.text("PARTE DIARIO DE TRABAJO", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // 5. Información de instalación
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Información de la Instalación", 20, yPosition);
  yPosition += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Cliente: ${installation.clientName}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Dirección: ${installation.address}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Tipo: ${workOrderTypeLabel}`, 20, yPosition);
  yPosition += 10;

  // 6. Información del parte
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Información del Parte", 20, yPosition);
  yPosition += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date(report.reportDate).toLocaleDateString("es-ES")}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Técnico: ${user?.name || "N/A"}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Horas trabajadas: ${report.hoursWorked}`, 20, yPosition);
  yPosition += 10;

  // 7. Descripción del trabajo
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Descripción del Trabajo", 20, yPosition);
  yPosition += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const descriptionLines = doc.splitTextToSize(report.workDescription, pageWidth - 40);
  doc.text(descriptionLines, 20, yPosition);
  yPosition += descriptionLines.length * 6 + 10;

  // 8. Fotos (si existen)
  if (photos.length > 0) {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Fotos de Avance", 20, yPosition);
    yPosition += 8;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total de fotos adjuntas: ${photos.length}`, 20, yPosition);
    yPosition += 8;

    photos.forEach((photo, index) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      const caption = photo.caption || `Foto ${index + 1}`;
      doc.text(`• ${caption}`, 25, yPosition);
      yPosition += 6;
    });
    yPosition += 5;
  }

  // 9. Firma (si existe)
  if (report.signatureUrl) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Firma del Técnico", 20, yPosition);
    yPosition += 8;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("(Firma digital registrada)", 20, yPosition);
    yPosition += 15;
  }

  // 10. Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generado el ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES")}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  // 11. Convertir a buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}
```

**Características:**
- Usa jsPDF para generación
- Logo desde URL (con fallback a texto)
- Manejo de saltos de página automáticos
- Información de instalación, técnico, horas
- Descripción del trabajo con ajuste de texto
- Listado de fotos
- Firma digital
- Footer con fecha y hora

### 2. Generador de Certificado de Conformidad (conformity-pdf-generator.ts)

**Propósito:** Generar PDF de conformidad firmado por cliente

**Estructura del PDF:**

```
┌─────────────────────────────────────────┐
│                                         │
│              [LOGO ODS]                 │
│                                         │
│   Certificado de Conformidad del        │
│          Cliente                        │
│                                         │
├─────────────────────────────────────────┤
│ INFORMACIÓN DE LA INSTALACIÓN           │
│ ID Cliente: CLI-001                     │
│ Cliente: Cliente A                      │
│ Email: cliente@example.com              │
│ Teléfono: +34 912 345 678               │
│ Dirección: Calle Principal 123          │
│ Tipo de Orden: Instalación              │
│ Fecha de Inicio: 10/01/2025             │
│ Fecha de Finalización: 15/01/2025       │
│                                         │
│ DESCRIPCIÓN DEL TRABAJO REALIZADO       │
│ Se realizó la instalación del sistema   │
│ fotovoltaico de 5kW con baterías...     │
│                                         │
│ OBSERVACIONES DEL TÉCNICO               │
│ El cliente está satisfecho con el       │
│ trabajo realizado. Sistema funcionando  │
│ correctamente.                          │
│                                         │
│ FIRMA DE CONFORMIDAD DEL CLIENTE        │
│ El cliente abajo firmante certifica     │
│ que el trabajo ha sido realizado        │
│ satisfactoriamente...                   │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │                                 │    │
│ │      [FIRMA DEL CLIENTE]        │    │
│ │                                 │    │
│ └─────────────────────────────────┘    │
│ Firma del Cliente                       │
│ Fecha: 15/01/2025                       │
│                                         │
├─────────────────────────────────────────┤
│ ODS Energy - Instalaciones Fotovoltaicas│
│ info@odsenergy.es                       │
└─────────────────────────────────────────┘
```

**Código Principal:**

```typescript
export async function generateConformityPDF(data: ConformityPDFData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // 1. Logo
      try {
        const logoResponse = await axios.get('https://files.manuscdn.com/...', {
          responseType: 'arraybuffer'
        });
        const logoBuffer = Buffer.from(logoResponse.data);
        doc.image(logoBuffer, { fit: [150, 50], align: 'center' });
        doc.moveDown(1);
      } catch (error) {
        doc.fontSize(20).font('Helvetica-Bold').text('ODS ENERGY', { align: 'center' });
      }

      // 2. Título
      doc.fontSize(16).font('Helvetica-Bold').text('Certificado de Conformidad del Cliente', { align: 'center' });
      doc.moveDown(2);

      // 3. Información de instalación
      doc.fontSize(14).font('Helvetica-Bold').text('Información de la Instalación');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`ID Cliente: ${data.installation.clientId}`);
      doc.text(`Cliente: ${data.installation.clientName}`);
      if (data.installation.clientEmail) {
        doc.text(`Email: ${data.installation.clientEmail}`);
      }
      if (data.installation.clientPhone) {
        doc.text(`Teléfono: ${data.installation.clientPhone}`);
      }
      doc.text(`Dirección: ${data.installation.address}`);
      doc.moveDown(0.5);

      // 4. Tipo de orden
      const workOrderTypeLabel = 
        data.installation.workOrderType === 'installation' ? 'Instalación' :
        data.installation.workOrderType === 'breakdown' ? 'Avería' :
        'Mantenimiento';
      doc.text(`Tipo de Orden: ${workOrderTypeLabel}`);

      // 5. Fechas
      if (data.installation.startDate) {
        doc.text(`Fecha de Inicio: ${new Date(data.installation.startDate).toLocaleDateString('es-ES')}`);
      }
      if (data.installation.endDate) {
        doc.text(`Fecha de Finalización: ${new Date(data.installation.endDate).toLocaleDateString('es-ES')}`);
      }
      doc.moveDown(1.5);

      // 6. Descripción del trabajo
      doc.fontSize(14).font('Helvetica-Bold').text('Descripción del Trabajo Realizado');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica').text(data.installation.workDescription, {
        align: 'justify',
      });
      doc.moveDown(1.5);

      // 7. Observaciones del técnico
      doc.fontSize(14).font('Helvetica-Bold').text('Observaciones del Técnico');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica').text(data.technicianObservations || 'Sin observaciones', {
        align: 'justify',
      });
      doc.moveDown(2);

      // 8. Firma del cliente
      doc.fontSize(14).font('Helvetica-Bold').text('Firma de Conformidad del Cliente');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(
        'El cliente abajo firmante certifica que el trabajo ha sido realizado satisfactoriamente y conforme a lo acordado.',
        { align: 'justify' }
      );
      doc.moveDown(1);

      // 9. Imagen de firma
      if (data.clientSignatureUrl) {
        try {
          const response = await axios.get(data.clientSignatureUrl, { responseType: 'arraybuffer' });
          const imageBuffer = Buffer.from(response.data);
          const signatureY = doc.y;
          doc.image(imageBuffer, 50, signatureY, { width: 200, height: 80, fit: [200, 80] });
          doc.fontSize(9).text('Firma del Cliente', 50, signatureY + 85, { width: 200, align: 'center' });
          
          if (data.installation.clientSignatureDate) {
            doc.text(
              `Fecha: ${new Date(data.installation.clientSignatureDate).toLocaleDateString('es-ES')}`,
              50,
              signatureY + 100,
              { width: 200, align: 'center' }
            );
          }
        } catch (error) {
          // Fallback: Caja de firma
          const signatureY = doc.y;
          doc.rect(50, signatureY, 200, 80).stroke();
          doc.fontSize(9).text('Firma del Cliente', 50, signatureY + 85, { width: 200, align: 'center' });
        }
      }

      // 10. Footer
      doc.fontSize(8).font('Helvetica').text(
        'ODS Energy - Instalaciones Fotovoltaicas',
        50,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 100 }
      );
      doc.text(
        'info@odsenergy.es',
        50,
        doc.page.height - 35,
        { align: 'center', width: doc.page.width - 100 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
```

**Características:**
- Usa PDFKit para generación
- Logo desde URL con fallback
- Información completa del cliente
- Descripción del trabajo
- Observaciones del técnico
- Firma digital del cliente
- Fecha de firma
- Footer con información de contacto

### 3. Generador de Reporte Consolidado (consolidated-pdf-generator.ts)

**Propósito:** Generar PDF consolidado de múltiples partes diarios

**Estructura del PDF:**

```
┌─────────────────────────────────────────┐
│                                         │
│              [LOGO ODS]                 │
│                                         │
│   Reporte Consolidado de Partes         │
│              Diarios                    │
│                                         │
│ Generado: 15/01/2025                    │
│                                         │
├─────────────────────────────────────────┤
│ INSTALACIÓN: Cliente A                  │
│ Dirección: Calle Principal 123          │
│ ID Cliente: CLI-001                     │
│ Orden de Trabajo: Instalación           │
│                                         │
│ RESUMEN                                 │
│ Total de Partes: 5                      │
│ Total de Horas Trabajadas: 40h          │
│ Período: 10/01/2025 - 15/01/2025        │
│                                         │
│ DETALLE DE PARTES DIARIOS                │
│                                         │
│ Parte #1 - 10/01/2025                   │
│ Cliente: Cliente A                      │
│ Técnico: Juan García                    │
│ Horas Trabajadas: 8h                    │
│ Descripción del Trabajo:                │
│ Se realizó la excavación y preparación  │
│ del terreno para la instalación...      │
│ Fotos adjuntas: 3                       │
│                                         │
│ Parte #2 - 11/01/2025                   │
│ Cliente: Cliente A                      │
│ Técnico: Juan García                    │
│ Horas Trabajadas: 8h                    │
│ Descripción del Trabajo:                │
│ Se instalaron los soportes y paneles    │
│ solares...                              │
│ Fotos adjuntas: 4                       │
│                                         │
│ ... (más partes)                        │
│                                         │
└─────────────────────────────────────────┘
```

**Características:**
- Resumen de estadísticas (total partes, horas)
- Detalle de cada parte diario
- Información del técnico
- Descripción del trabajo
- Fotos adjuntas (con miniaturas)
- Filtrable por instalación, técnico o rango de fechas

---

## 📦 Estructura del ZIP

### Organización de Carpetas

```
export-2025-01-15_2025-01-31-1705334800.zip
├── 1_Cliente_A/
│   ├── Conformidad_Cliente_A.pdf
│   └── Partes_Diarios/
│       ├── Parte_2025-01-10.pdf
│       ├── Parte_2025-01-11.pdf
│       ├── Parte_2025-01-12.pdf
│       ├── Parte_2025-01-13.pdf
│       └── Parte_2025-01-14.pdf
│
├── 2_Cliente_B/
│   ├── Conformidad_Cliente_B.pdf
│   └── Partes_Diarios/
│       ├── Parte_2025-01-15.pdf
│       └── Parte_2025-01-16.pdf
│
├── 3_Cliente_C/
│   └── Partes_Diarios/
│       └── Parte_2025-01-17.pdf
│
└── RESUMEN.txt
```

### Archivo RESUMEN.txt

```
Exportación Masiva de PDFs - ODS Energy
========================================

Fecha de exportación: 15/01/2025 14:30:45
Rango de fechas: 10/01/2025 - 31/01/2025

Total de instalaciones: 3

Instalaciones incluidas:
- #1: Cliente A (CLI-001)
- #2: Cliente B (CLI-002)
- #3: Cliente C (CLI-003)

Tipos de documentos incluidos:
✓ Certificados de Conformidad
✓ Partes Diarios
```

### Proceso de Creación del ZIP

```typescript
// 1. Crear archivador
const archive = archiver('zip', {
  zlib: { level: 9 } // Máxima compresión
});

// 2. Recopilar datos
const chunks: Buffer[] = [];
archive.on('data', (chunk) => chunks.push(chunk));

// 3. Promesa de finalización
const archivePromise = new Promise<Buffer>((resolve, reject) => {
  archive.on('end', () => {
    resolve(Buffer.concat(chunks));
  });
  archive.on('error', reject);
});

// 4. Procesar instalaciones
for (const installation of filteredInstallations) {
  const sanitizedClientName = installation.clientName.replace(/[^a-z0-9]/gi, '_');
  const installationFolder = `${installation.id}_${sanitizedClientName}`;
  
  // Agregar PDF de conformidad
  if (includeConformity && installation.clientSignatureUrl) {
    const conformityPDF = await generateConformityPDF({...});
    archive.append(conformityPDF, {
      name: `${installationFolder}/Conformidad_${sanitizedClientName}.pdf`
    });
  }
  
  // Agregar PDFs de partes diarios
  if (includeDailyReports) {
    const dailyReports = await db.getDailyReportsByInstallation(installation.id);
    for (const report of dailyReports) {
      const reportPDF = await generateDailyReportPDF(report.id);
      const reportDate = new Date(report.reportDate).toISOString().split('T')[0];
      archive.append(reportPDF, {
        name: `${installationFolder}/Partes_Diarios/Parte_${reportDate}.pdf`
      });
    }
  }
}

// 5. Agregar resumen
archive.append(summary, { name: 'RESUMEN.txt' });

// 6. Finalizar
await archive.finalize();
const zipBuffer = await archivePromise;
```

---

## ⚙️ Lógica de Funcionamiento

### Flujo Frontend

```typescript
export default function BulkExport() {
  // 1. Estado
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clientId, setClientId] = useState('');
  const [includeConformity, setIncludeConformity] = useState(true);
  const [includeDailyReports, setIncludeDailyReports] = useState(true);

  // 2. Mutation tRPC
  const exportMutation = trpc.dailyReports.exportBulkPDFs.useMutation({
    onSuccess: (data) => {
      toast.success('Exportación completada');
      window.open(data.url, '_blank'); // Descargar
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // 3. Manejador de exportación
  const handleExport = () => {
    // Validación
    if (!includeConformity && !includeDailyReports) {
      toast.error('Debe seleccionar al menos un tipo de documento');
      return;
    }

    // Llamar mutation
    exportMutation.mutate({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      clientId: clientId.trim() || undefined,
      includeConformity,
      includeDailyReports,
    });
  };

  // 4. Renderizar UI
  return (
    <DashboardLayout>
      {/* Formulario */}
    </DashboardLayout>
  );
}
```

### Flujo Backend

```typescript
// 1. Endpoint tRPC
exportBulkPDFs: protectedProcedure
  .input(z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    clientId: z.string().optional(),
    includeConformity: z.boolean().default(true),
    includeDailyReports: z.boolean().default(true),
  }))
  .mutation(async ({ input, ctx }) => {
    // 2. Validación de permisos
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({ 
        code: 'FORBIDDEN', 
        message: 'No tienes permiso para exportar PDFs masivamente' 
      });
    }

    // 3. Generar ZIP
    const { generateBulkPDFExport } = await import('./bulk-pdf-export');
    const zipBuffer = await generateBulkPDFExport({
      startDate: input.startDate,
      endDate: input.endDate,
      clientId: input.clientId,
      includeConformity: input.includeConformity,
      includeDailyReports: input.includeDailyReports,
    });

    // 4. Subir a S3
    const timestamp = Date.now();
    const dateRange = input.startDate && input.endDate 
      ? `${input.startDate.toISOString().split('T')[0]}_${input.endDate.toISOString().split('T')[0]}`
      : 'all';
    const fileKey = `bulk-exports/export-${dateRange}-${timestamp}.zip`;
    const { url } = await storagePut(fileKey, zipBuffer, 'application/zip');

    // 5. Retornar URL
    return { success: true, url };
  }),
```

### Flujo de Generación de ZIP

```typescript
export async function generateBulkPDFExport(options: BulkExportOptions): Promise<Buffer> {
  // 1. Crear archivador
  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  archive.on('data', (chunk) => chunks.push(chunk));

  // 2. Promesa de finalización
  const archivePromise = new Promise<Buffer>((resolve, reject) => {
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
  });

  try {
    // 3. Obtener y filtrar instalaciones
    const allInstallations = await db.getAllInstallations();
    const filteredInstallations = allInstallations.filter(installation => {
      if (installation.status !== 'completed') return false;
      if (options.clientId && installation.clientId !== options.clientId) return false;
      if (options.startDate && installation.startDate < options.startDate) return false;
      if (options.endDate && installation.startDate > options.endDate) return false;
      return true;
    });

    // 4. Si no hay instalaciones
    if (filteredInstallations.length === 0) {
      archive.append('No se encontraron instalaciones completadas...', {
        name: 'README.txt'
      });
    } else {
      // 5. Procesar cada instalación
      for (const installation of filteredInstallations) {
        const sanitizedClientName = installation.clientName.replace(/[^a-z0-9]/gi, '_');
        const installationFolder = `${installation.id}_${sanitizedClientName}`;

        // Conformidad
        if (options.includeConformity && installation.clientSignatureUrl) {
          try {
            const conformityPDF = await generateConformityPDF({...});
            archive.append(conformityPDF, {
              name: `${installationFolder}/Conformidad_${sanitizedClientName}.pdf`
            });
          } catch (error) {
            console.error(`Error generating conformity PDF:`, error);
          }
        }

        // Partes diarios
        if (options.includeDailyReports) {
          try {
            const dailyReports = await db.getDailyReportsByInstallation(installation.id);
            for (const report of dailyReports) {
              try {
                const reportPDF = await generateDailyReportPDF(report.id);
                const reportDate = new Date(report.reportDate).toISOString().split('T')[0];
                archive.append(reportPDF, {
                  name: `${installationFolder}/Partes_Diarios/Parte_${reportDate}.pdf`
                });
              } catch (error) {
                console.error(`Error generating daily report PDF:`, error);
              }
            }
          } catch (error) {
            console.error(`Error fetching daily reports:`, error);
          }
        }
      }

      // 6. Agregar resumen
      const summary = `
Exportación Masiva de PDFs - ODS Energy
========================================

Fecha de exportación: ${new Date().toLocaleString('es-ES')}
Rango de fechas: ${options.startDate ? options.startDate.toLocaleDateString('es-ES') : 'Sin límite'} - ${options.endDate ? options.endDate.toLocaleDateString('es-ES') : 'Sin límite'}

Total de instalaciones: ${filteredInstallations.length}

Instalaciones incluidas:
${filteredInstallations.map(inst => `- #${inst.id}: ${inst.clientName} (${inst.clientId})`).join('\n')}

Tipos de documentos incluidos:
${options.includeConformity ? '✓ Certificados de Conformidad' : '✗ Certificados de Conformidad'}
${options.includeDailyReports ? '✓ Partes Diarios' : '✗ Partes Diarios'}
      `.trim();
      
      archive.append(summary, { name: 'RESUMEN.txt' });
    }

    // 7. Finalizar
    await archive.finalize();
    const zipBuffer = await archivePromise;
    return zipBuffer;
  } catch (error) {
    console.error('Error generating bulk PDF export:', error);
    throw error;
  }
}
```

---

## 📦 Dependencias y Alternativas

### Dependencias Actuales

#### 1. **archiver** (Compresión ZIP)

**Versión:** 7.0.1

**Propósito:** Crear archivos ZIP con múltiples archivos

**Uso:**
```typescript
const archive = archiver('zip', { zlib: { level: 9 } });
archive.append(buffer, { name: 'archivo.pdf' });
await archive.finalize();
```

**Características:**
- ✅ Compresión ZIP nativa
- ✅ Soporte para múltiples formatos
- ✅ Compresión configurable
- ✅ Streaming de datos

**Alternativas:**
- **jszip** - Librería JavaScript pura (más lenta)
- **tar** - Compresión TAR (no es ZIP)
- **7z** - Compresión 7z (requiere binario externo)

**Recomendación:** Mantener **archiver** (mejor para Node.js)

#### 2. **jsPDF** (Generación de PDFs)

**Versión:** 3.0.4

**Propósito:** Generar PDFs de partes diarios

**Uso:**
```typescript
const doc = new jsPDF();
doc.text("Título", 20, 20);
doc.addImage(imageUrl, 'JPEG', x, y, width, height);
const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
```

**Características:**
- ✅ Generación de PDFs en JavaScript
- ✅ Soporte para texto e imágenes
- ✅ Manejo de múltiples páginas
- ✅ Ligera

**Limitaciones:**
- ⚠️ Menos control que PDFKit
- ⚠️ Más lenta para PDFs complejos

**Alternativas:**
- **PDFKit** - Más control, mejor rendimiento
- **pdfmake** - Más simple, menos control
- **html2pdf** - Convertir HTML a PDF

**Recomendación:** Cambiar a **PDFKit** para mejor rendimiento

#### 3. **pdfkit** (Generación de PDFs)

**Versión:** 0.17.2

**Propósito:** Generar PDFs de conformidad

**Uso:**
```typescript
const doc = new PDFDocument();
doc.fontSize(20).text('Título');
doc.image(imageBuffer, 50, 100, { width: 200 });
doc.end();
```

**Características:**
- ✅ Control total sobre el PDF
- ✅ Mejor rendimiento que jsPDF
- ✅ Streaming nativo
- ✅ Soporte para fuentes personalizadas

**Ventajas sobre jsPDF:**
- Más rápido
- Mejor control de layout
- Mejor para PDFs complejos

**Recomendación:** Mantener **pdfkit** y migrar jsPDF a pdfkit

#### 4. **axios** (Descargas de Imágenes)

**Versión:** 1.12.0

**Propósito:** Descargar logo y firma desde URLs

**Uso:**
```typescript
const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
const imageBuffer = Buffer.from(response.data);
```

**Características:**
- ✅ HTTP client robusto
- ✅ Manejo de errores
- ✅ Soporte para arraybuffer

**Alternativas:**
- **node-fetch** - Más ligero
- **undici** - Más rápido (Node.js 18+)
- **got** - Más features

**Recomendación:** Cambiar a **node-fetch** (más ligero) o **undici** (más rápido)

#### 5. **S3 Manus** (Almacenamiento)

**Propósito:** Almacenar archivos ZIP

**Problema:** Dependencia de Manus

**Alternativas:**
- **AWS S3** (Recomendado)
- **Cloudinary**
- **Almacenamiento local**

---

## 🚀 Migración a LucusHost

### Cambios Necesarios

| Componente | Actual | Recomendado | Prioridad |
|-----------|--------|------------|-----------|
| Almacenamiento | S3 Manus | AWS S3 | 🔴 Alta |
| Cliente HTTP | axios | node-fetch | 🟡 Media |
| Generador PDF | jsPDF + pdfkit | pdfkit | 🟡 Media |

### Plan de Migración

#### Fase 1: Reemplazar Almacenamiento (Día 1)

**Cambio:** S3 Manus → AWS S3

```typescript
// Antes (Manus)
import { storagePut } from './server/storage';
const { url } = await storagePut(fileKey, zipBuffer, 'application/zip');

// Después (AWS S3)
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToS3(key: string, buffer: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  }), { expiresIn: 3600 });

  return { url: signedUrl, key };
}

// Uso
const { url } = await uploadToS3(fileKey, zipBuffer, 'application/zip');
```

**Variables de Entorno:**
```env
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_S3_BUCKET=tu-bucket-name
```

#### Fase 2: Optimizar Cliente HTTP (Día 2)

**Cambio:** axios → node-fetch

```typescript
// Antes (axios)
const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
const imageBuffer = Buffer.from(response.data);

// Después (node-fetch)
const response = await fetch(imageUrl);
const imageBuffer = await response.arrayBuffer();
```

**Instalación:**
```bash
npm install node-fetch
```

#### Fase 3: Unificar Generador de PDFs (Día 3)

**Cambio:** jsPDF → pdfkit

```typescript
// Antes (jsPDF)
import jsPDF from 'jspdf';

const doc = new jsPDF();
doc.text("Título", 20, 20);
const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

// Después (pdfkit)
import PDFDocument from 'pdfkit';

const doc = new PDFDocument();
const buffers: Buffer[] = [];

doc.on('data', buffers.push.bind(buffers));
doc.on('end', () => {
  const pdfBuffer = Buffer.concat(buffers);
});

doc.fontSize(20).text('Título', 20, 20);
doc.end();
```

#### Fase 4: Testing y Deployment (Día 4)

```bash
# 1. Tests
npm run test

# 2. Build
npm run build

# 3. Deploy a LucusHost
# Seguir guía de LucusHost

# 4. Verificar
# - Generar ZIP
# - Descargar ZIP
# - Verificar contenido
```

### Checklist de Migración

```markdown
## Almacenamiento
- [ ] Crear bucket S3
- [ ] Configurar credenciales AWS
- [ ] Actualizar server/storage.ts
- [ ] Probar subida de archivos
- [ ] Probar descarga de archivos
- [ ] Verificar URLs públicas

## Cliente HTTP
- [ ] Instalar node-fetch
- [ ] Reemplazar axios por fetch
- [ ] Probar descargas de imágenes
- [ ] Probar manejo de errores

## Generador de PDFs
- [ ] Reemplazar jsPDF por pdfkit
- [ ] Probar generación de PDFs
- [ ] Verificar calidad de PDFs
- [ ] Probar con imágenes

## Deployment
- [ ] Configurar variables de entorno
- [ ] Build y test local
- [ ] Deploy a LucusHost
- [ ] Probar funcionalidades
- [ ] Monitorear logs
```

---

## 📝 Conclusión

La pestaña de **Exportar PDFs** es un componente robusto que permite generar y descargar múltiples PDFs en un archivo ZIP. La migración a LucusHost requiere principalmente reemplazar el almacenamiento de Manus con AWS S3 y optimizar las dependencias.

### Recomendaciones Finales

✅ **Almacenamiento:** AWS S3 (estándar de industria)
✅ **Cliente HTTP:** node-fetch (más ligero que axios)
✅ **Generador PDF:** Mantener pdfkit, migrar jsPDF a pdfkit
✅ **Compresión:** Mantener archiver (mejor para Node.js)

Con estos cambios, la funcionalidad de exportación será completamente independiente de Manus y funcionará perfectamente en LucusHost con Node.js.

### Estimación de Esfuerzo

- **Almacenamiento:** 2-3 horas
- **Cliente HTTP:** 1 hora
- **Generador PDF:** 2-3 horas
- **Testing:** 2 horas
- **Total:** 7-9 horas de desarrollo


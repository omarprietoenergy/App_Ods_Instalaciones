# 📅 Pestaña de Calendario - Guía Completa y Detallada

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura del Calendario](#arquitectura-del-calendario)
3. [Interfaz Principal](#interfaz-principal)
4. [Vistas Disponibles](#vistas-disponibles)
5. [Filtros y Navegación](#filtros-y-navegación)
6. [Eventos y Colores](#eventos-y-colores)
7. [Lógica de Funcionamiento](#lógica-de-funcionamiento)
8. [Dependencias y Alternativas](#dependencias-y-alternativas)
9. [Migración a LucusHost](#migración-a-lucushost)
10. [Implementación Recomendada](#implementación-recomendada)

---

## 🎯 Visión General

La pestaña de **Calendario** es una herramienta visual para gestionar y visualizar todas las instalaciones de forma temporal. Permite a los usuarios ver el cronograma de proyectos, filtrar por técnico y navegar entre diferentes vistas (mes, semana, día, agenda, año).

### Características Principales

✅ **Visualización Multi-Vista**: Mes, Semana, Día, Agenda, Año
✅ **Filtrado por Técnico**: Ver solo instalaciones asignadas a un técnico
✅ **Navegación Intuitiva**: Botones, popover de mes/año, botón "Hoy"
✅ **Código de Colores**: Estados visuales (Pendiente, En Progreso, Completada)
✅ **Acceso Rápido**: Hacer clic en evento abre detalles de instalación
✅ **Localización**: Completamente en español

---

## 🏗️ Arquitectura del Calendario

### Stack Tecnológico Actual

```
Frontend:
├── React 19.2.1
├── react-big-calendar 1.19.4 (Librería de calendario)
├── date-fns 4.1.0 (Manipulación de fechas)
├── Tailwind CSS 4.1.14 (Estilos)
└── shadcn/ui (Componentes UI)

Backend:
├── Express 4.21.2
├── tRPC 11.6.0 (API type-safe)
└── Drizzle ORM (Base de datos)

Autenticación:
└── OAuth Manus (Será reemplazado)
```

### Estructura de Archivos

```
client/src/pages/
├── Calendar.tsx          ← Componente principal
└── calendar.css          ← Estilos personalizados

server/
├── routers.ts            ← Endpoints tRPC
└── db.ts                 ← Funciones de BD
```

---

## 🎨 Interfaz Principal

### 1. Layout General

```
┌─────────────────────────────────────────────────────────┐
│ DashboardLayout (Sidebar + Contenido)                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Calendario de Instalaciones                            │
│                         [Filtro Técnico] [Vista Anual]  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ [◀] [Mes/Año] [▶] [Hoy] [Leyenda de colores]   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  Calendario (React Big Calendar)                │   │
│  │  - Eventos de instalaciones                     │   │
│  │  - Colores por estado                           │   │
│  │  - Click para ver detalles                      │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2. Encabezado

```typescript
<div className="flex items-center justify-between">
  <h1 className="text-3xl font-bold">Calendario de Instalaciones</h1>
  
  <div className="flex items-center gap-4">
    {/* Filtro de técnico */}
    <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Filtrar por técnico" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los técnicos</SelectItem>
        {techniciansQuery.data?.map((tech) => (
          <SelectItem key={tech.id} value={tech.id.toString()}>
            {tech.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    {/* Botón para cambiar vista */}
    <Button
      variant={showYearView ? "default" : "outline"}
      onClick={() => setShowYearView(!showYearView)}
    >
      {showYearView ? "Vista Mensual" : "Vista Anual"}
    </Button>
  </div>
</div>
```

**Componentes:**
- **Título**: "Calendario de Instalaciones"
- **Select de Técnico**: Filtra instalaciones por técnico asignado
- **Botón Vista**: Alterna entre vista anual y mensual

---

## 👁️ Vistas Disponibles

### Vista 1: Mes (Por Defecto)

**Componente:** `react-big-calendar` con modo "month"

```
┌─────────────────────────────────────────────────────┐
│ Lun  Mar  Mié  Jue  Vie  Sab  Dom                  │
├─────────────────────────────────────────────────────┤
│  1    2    3    4    5    6    7                    │
│ [Evento] [Evento]                                  │
│                                                     │
│  8    9   10   11   12   13   14                   │
│ [Evento]                                           │
│                                                     │
│ 15   16   17   18   19   20   21                   │
│                                                     │
│ 22   23   24   25   26   27   28                   │
│ [Evento] [Evento] [Evento]                         │
│                                                     │
│ 29   30   31                                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Características:**
- Muestra todo el mes en una vista de grid
- Cada celda representa un día
- Eventos mostrados como barras de color
- Click en evento abre detalles

### Vista 2: Semana

**Componente:** `react-big-calendar` con modo "week"

```
┌─────────────────────────────────────────────────────┐
│ Lun 15  Mar 16  Mié 17  Jue 18  Vie 19  Sab 20    │
├─────────────────────────────────────────────────────┤
│ 08:00 ┌─────────────────────────────────────────┐  │
│       │ Instalación Cliente A (Pendiente)      │  │
│ 10:00 │                                         │  │
│       │                                         │  │
│ 12:00 ├─────────────────────────────────────────┤  │
│       │ Mantenimiento Cliente B (En Progreso)  │  │
│ 14:00 │                                         │  │
│       │                                         │  │
│ 16:00 └─────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Características:**
- Muestra 7 días con franjas horarias
- Eventos mostrados en bloques de tiempo
- Mejor para ver conflictos de horarios

### Vista 3: Día

**Componente:** `react-big-calendar` con modo "day"

```
┌─────────────────────────────────────────────────────┐
│ Viernes 19 de Enero de 2025                        │
├─────────────────────────────────────────────────────┤
│ 08:00 ┌─────────────────────────────────────────┐  │
│       │ Instalación Cliente A                   │  │
│       │ Pendiente                               │  │
│ 10:00 │                                         │  │
│       │                                         │  │
│ 12:00 ├─────────────────────────────────────────┤  │
│       │ Mantenimiento Cliente B                 │  │
│       │ En Progreso                             │  │
│ 14:00 │                                         │  │
│       │                                         │  │
│ 16:00 └─────────────────────────────────────────┘  │
│                                                     │
│ 18:00                                              │
│                                                     │
│ 20:00                                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Características:**
- Muestra un solo día completo
- Franjas horarias cada 30 minutos
- Máximo detalle de un día específico

### Vista 4: Agenda

**Componente:** `react-big-calendar` con modo "agenda"

```
┌─────────────────────────────────────────────────────┐
│ Fecha           Hora      Evento                    │
├─────────────────────────────────────────────────────┤
│ Lun 15 Ene      08:00     Instalación Cliente A    │
│ Mar 16 Ene      10:00     Mantenimiento Cliente B  │
│ Mié 17 Ene      14:00     Avería Cliente C         │
│ Jue 18 Ene      09:00     Instalación Cliente D    │
│ Vie 19 Ene      11:00     Mantenimiento Cliente E  │
│ Sab 20 Ene      15:00     Instalación Cliente F    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Características:**
- Lista de eventos en orden cronológico
- Muestra fecha, hora y nombre del evento
- Útil para ver resumen de próximos eventos

### Vista 5: Año (Personalizada)

**Componente:** `YearView` personalizado

```
┌─────────────────────────────────────────────────────┐
│ 2025                                                │
├─────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│ │ Enero    │  │ Febrero  │  │ Marzo    │           │
│ │ 3 inst.  │  │ 1 inst.  │  │ 5 inst.  │           │
│ │ [Cliente]│  │ [Cliente]│  │ [Cliente]│           │
│ │ +2 más   │  │          │  │ +2 más   │           │
│ └──────────┘  └──────────┘  └──────────┘           │
│                                                     │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│ │ Abril    │  │ Mayo     │  │ Junio    │           │
│ │ 0 inst.  │  │ 2 inst.  │  │ 4 inst.  │           │
│ │          │  │ [Cliente]│  │ [Cliente]│           │
│ │          │  │ [Cliente]│  │ +2 más   │           │
│ └──────────┘  └──────────┘  └──────────┘           │
│                                                     │
│ ... (más meses)                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Características:**
- Grid de 3 columnas x 4 filas (12 meses)
- Cada mes muestra cantidad de instalaciones
- Primeras 3 instalaciones mostradas como badges
- Click en mes cambia a vista mensual

---

## 🔍 Filtros y Navegación

### 1. Filtro de Técnico

```typescript
const [selectedTechnician, setSelectedTechnician] = useState<string>("all");

// Filtrado
const filteredInstallations = selectedTechnician === "all" 
  ? installations
  : installations.filter(installation => {
      try {
        const techIds = JSON.parse(installation.assignedTechnicianIds || '[]');
        return techIds.includes(Number(selectedTechnician));
      } catch {
        return false;
      }
    });
```

**Lógica:**
- Por defecto muestra "Todos los técnicos"
- Al seleccionar un técnico, filtra instalaciones asignadas a ese técnico
- Los técnicos se cargan desde `trpc.users.listTechnicians.useQuery()`
- Los IDs de técnicos se almacenan como JSON en `assignedTechnicianIds`

### 2. Navegación de Fechas

#### Botón Anterior/Siguiente
```typescript
<Button
  variant="outline"
  size="icon"
  onClick={() => handleNavigate(subMonths(currentDate, 1))}
>
  <ChevronLeft className="h-4 w-4" />
</Button>
```

**Funcionalidad:**
- Botón ◀ retrocede un mes
- Botón ▶ avanza un mes
- Usa `date-fns` para manipulación de fechas

#### Popover de Mes/Año

```typescript
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="min-w-[200px]">
      <CalendarIcon className="mr-2 h-4 w-4" />
      {format(currentDate, 'MMMM yyyy', { locale: es })}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-4" align="start">
    <div className="space-y-4">
      {/* Grid de meses */}
      <div className="grid grid-cols-3 gap-2">
        {months.map((month, index) => (
          <Button
            key={month}
            variant={currentDate.getMonth() === index ? "default" : "outline"}
            size="sm"
            onClick={() => handleMonthSelect(index)}
          >
            {month.substring(0, 3)}
          </Button>
        ))}
      </div>
      
      {/* Grid de años */}
      <div className="grid grid-cols-5 gap-2">
        {years.map(year => (
          <Button
            key={year}
            variant={currentDate.getFullYear() === year ? "default" : "outline"}
            size="sm"
            onClick={() => handleYearSelect(year)}
          >
            {year}
          </Button>
        ))}
      </div>
    </div>
  </PopoverContent>
</Popover>
```

**Características:**
- Grid de 3 columnas para meses
- Grid de 5 columnas para años (últimos 5 y próximos 5)
- Mes/año actual resaltado en color primario
- Click selecciona mes/año

#### Botón "Hoy"
```typescript
<Button
  variant="outline"
  onClick={() => handleNavigate(new Date())}
>
  Hoy
</Button>
```

**Funcionalidad:**
- Vuelve a la fecha actual
- Útil cuando se ha navegado a meses anteriores/posteriores

### 3. Leyenda de Colores

```typescript
<div className="flex items-center gap-4 text-sm">
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
    <span>Pendiente</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
    <span>En Progreso</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
    <span>Completada</span>
  </div>
</div>
```

**Colores:**
- 🟡 Pendiente: `#f59e0b` (Naranja)
- 🔵 En Progreso: `#3b82f6` (Azul)
- 🟢 Completada: `#10b981` (Verde)

---

## 🎨 Eventos y Colores

### Conversión de Instalaciones a Eventos

```typescript
const events = filteredInstallations.map(installation => {
  const startDate = new Date(installation.startDate);
  const endDate = installation.endDate ? new Date(installation.endDate) : startDate;
  
  return {
    id: installation.id,
    title: installation.clientName,
    start: startDate,
    end: endDate,
    resource: {
      status: installation.status,
      workOrderType: installation.workOrderType,
    },
  };
});
```

**Mapeo:**
- `id` → ID de la instalación
- `title` → Nombre del cliente
- `start` → Fecha de inicio
- `end` → Fecha de fin (o igual a inicio si no existe)
- `resource` → Metadata (estado, tipo de orden)

### Estilos de Eventos

```typescript
const eventStyleGetter = (event: any) => {
  let backgroundColor = '#3174ad'; // Default
  
  switch (event.resource.status) {
    case 'pending':
      backgroundColor = '#f59e0b'; // Orange
      break;
    case 'in_progress':
      backgroundColor = '#3b82f6'; // Blue
      break;
    case 'completed':
      backgroundColor = '#10b981'; // Green
      break;
  }
  
  return {
    style: {
      backgroundColor,
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
    },
  };
};
```

**Propiedades:**
- Color de fondo según estado
- Bordes redondeados
- Opacidad 0.8 para mejor visualización
- Texto blanco
- Sin borde

### Interactividad de Eventos

```typescript
onSelectEvent={(event) => setLocation(`/installations/${event.id}`)}
```

**Funcionalidad:**
- Click en evento abre `/installations/{id}`
- Redirige a detalle de instalación

---

## ⚙️ Lógica de Funcionamiento

### 1. Inicialización del Componente

```typescript
export default function Calendar() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTechnician, setSelectedTechnician] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [showYearView, setShowYearView] = useState(false);
  
  // Queries
  const installationsQuery = trpc.installations.list.useQuery();
  const techniciansQuery = trpc.users.listTechnicians.useQuery();
```

**Estado:**
- `selectedTechnician`: Técnico seleccionado (default: "all")
- `currentDate`: Fecha actual del calendario
- `view`: Vista actual (month, week, day, agenda)
- `showYearView`: Mostrar vista anual o mensual

**Queries:**
- `installations.list`: Obtiene todas las instalaciones
- `users.listTechnicians`: Obtiene lista de técnicos

### 2. Flujo de Filtrado

```
1. Obtener instalaciones desde BD
   ↓
2. Si selectedTechnician !== "all"
   ├─ Parsear JSON de assignedTechnicianIds
   ├─ Filtrar por técnico seleccionado
   └─ Si error en parseo, excluir instalación
   ↓
3. Convertir instalaciones a eventos
   ├─ Mapear propiedades
   ├─ Crear objeto de evento
   └─ Agregar metadata (status, workOrderType)
   ↓
4. Renderizar eventos en calendario
   ├─ Aplicar estilos según estado
   ├─ Agregar listeners de click
   └─ Mostrar en vista actual
```

### 3. Flujo de Navegación

```
Usuario hace clic en botón/popover
   ↓
Se calcula nueva fecha
   ├─ Anterior: subMonths(currentDate, 1)
   ├─ Siguiente: addMonths(currentDate, 1)
   ├─ Mes: setMonth(currentDate, monthIndex)
   ├─ Año: setYear(currentDate, year)
   └─ Hoy: new Date()
   ↓
Se actualiza currentDate
   ↓
Calendario se re-renderiza con nueva fecha
```

### 4. Flujo de Vista Anual

```
Usuario hace clic en "Vista Anual"
   ↓
showYearView = true
   ↓
Se renderiza YearView en lugar de BigCalendar
   ↓
YearView itera sobre 12 meses
   ├─ Para cada mes:
   │  ├─ Filtra eventos del mes/año
   │  ├─ Cuenta instalaciones
   │  ├─ Muestra primeras 3
   │  └─ Muestra "+X más" si hay más
   │
   └─ Click en mes:
      ├─ Establece currentDate al mes
      ├─ showYearView = false
      └─ Vuelve a vista mensual
```

---

## 📦 Dependencias y Alternativas

### Dependencias Actuales

#### 1. **react-big-calendar** (Librería de Calendario)

**Versión:** 1.19.4

**Propósito:** Componente principal de calendario con múltiples vistas

**Uso en el código:**
```typescript
import { Calendar as BigCalendar, dateFnsLocalizer, View } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

<BigCalendar
  localizer={localizer}
  events={events}
  startAccessor="start"
  endAccessor="end"
  style={{ height: 600 }}
  messages={messages}
  culture="es"
  eventPropGetter={eventStyleGetter}
  onSelectEvent={(event) => setLocation(`/installations/${event.id}`)}
  date={currentDate}
  onNavigate={handleNavigate}
  view={view}
  onView={setView}
  toolbar={false}
/>
```

**Características:**
- ✅ Múltiples vistas (mes, semana, día, agenda)
- ✅ Soporte para localización (español)
- ✅ Personalización de eventos
- ✅ Eventos con duración
- ⚠️ Dependencia pesada (librería grande)
- ⚠️ Requiere CSS personalizado

#### 2. **date-fns** (Manipulación de Fechas)

**Versión:** 4.1.0

**Propósito:** Funciones para manipular y formatear fechas

**Uso en el código:**
```typescript
import { format, parse, startOfWeek, getDay, addMonths, subMonths, setMonth, setYear } from "date-fns";
import { es } from "date-fns/locale";

// Ejemplos
format(currentDate, 'MMMM yyyy', { locale: es })  // "Enero 2025"
addMonths(currentDate, 1)                          // Siguiente mes
subMonths(currentDate, 1)                          // Mes anterior
setMonth(currentDate, monthIndex)                  // Establecer mes
setYear(currentDate, year)                         // Establecer año
```

**Características:**
- ✅ Funciones puras y sin mutaciones
- ✅ Soporte para múltiples idiomas
- ✅ Ligera y modular
- ✅ Amplia documentación

#### 3. **OAuth Manus** (Autenticación)

**Propósito:** Autenticación de usuarios

**Ubicación en código:**
```typescript
const { user } = useAuth();
```

**Problema:** Dependencia de Manus, requiere reemplazo para LucusHost

---

## 🔄 Migración a LucusHost

### Análisis de Dependencias de Manus

#### 1. **Autenticación OAuth**

**Actual (Manus):**
```typescript
// server/_core/auth.ts
import { oauth } from './oauth'; // Manus OAuth

const { user } = useAuth(); // Hook personalizado
```

**Problema:** 
- Completamente acoplado a Manus
- No funcionará en LucusHost

**Alternativas Recomendadas para LucusHost:**

##### Opción A: Auth0 (Recomendado)

**Ventajas:**
- ✅ Servicio SaaS robusto
- ✅ Soporte OAuth 2.0 completo
- ✅ Librería oficial para React
- ✅ Plan gratuito generoso
- ✅ Fácil integración

**Implementación:**

```typescript
// Instalar
npm install @auth0/auth0-react

// client/src/main.tsx
import { Auth0Provider } from '@auth0/auth0-react';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <Auth0Provider
    domain={import.meta.env.VITE_AUTH0_DOMAIN}
    clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin,
    }}
  >
    <App />
  </Auth0Provider>
);

// Uso en componentes
import { useAuth0 } from '@auth0/auth0-react';

export default function Calendar() {
  const { user, isLoading, isAuthenticated } = useAuth0();
  
  if (isLoading) return <div>Cargando...</div>;
  if (!isAuthenticated) return <div>No autenticado</div>;
  
  return <div>Hola {user?.name}</div>;
}
```

**Variables de Entorno:**
```env
VITE_AUTH0_DOMAIN=tu-dominio.auth0.com
VITE_AUTH0_CLIENT_ID=tu-client-id
```

**Costo:** Gratuito hasta 7,000 usuarios activos mensuales

##### Opción B: Supabase (Alternativa)

**Ventajas:**
- ✅ Backend as a Service completo
- ✅ Incluye BD PostgreSQL
- ✅ Autenticación integrada
- ✅ Plan gratuito muy generoso

**Implementación:**

```typescript
// Instalar
npm install @supabase/supabase-js @supabase/auth-helpers-react

// client/src/main.tsx
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

root.render(
  <SessionContextProvider supabaseClient={supabase}>
    <App />
  </SessionContextProvider>
);

// Uso
import { useSession } from '@supabase/auth-helpers-react';

export default function Calendar() {
  const session = useSession();
  
  if (!session) return <div>No autenticado</div>;
  
  return <div>Hola {session.user.email}</div>;
}
```

**Variables de Entorno:**
```env
VITE_SUPABASE_URL=tu-url.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

**Costo:** Gratuito hasta 500MB de almacenamiento

##### Opción C: JWT Local (Recomendado para Control Total)

**Ventajas:**
- ✅ Control total del flujo
- ✅ Sin dependencias externas
- ✅ Máxima flexibilidad
- ✅ Mejor para equipos pequeños

**Implementación:**

```typescript
// server/auth.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key';

export function generateToken(userId: number, email: string) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// client/src/lib/auth.ts
export function getToken() {
  return localStorage.getItem('auth_token');
}

export function setToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function clearToken() {
  localStorage.removeItem('auth_token');
}

// Uso en componentes
import { getToken } from '@/lib/auth';

export default function Calendar() {
  const token = getToken();
  
  if (!token) return <div>No autenticado</div>;
  
  // Decodificar token
  const [, payload] = token.split('.');
  const decoded = JSON.parse(atob(payload));
  
  return <div>Hola {decoded.email}</div>;
}
```

**Recomendación:** Para LucusHost con Node.js, **Auth0** es la mejor opción por su robustez y facilidad de integración.

#### 2. **Almacenamiento de Archivos (S3)**

**Actual (Manus):**
```typescript
import { storagePut, storageGet } from './server/storage';

const { url } = await storagePut(fileKey, fileBuffer, 'image/png');
```

**Problema:** Usa S3 de Manus, requiere reemplazo

**Alternativas para LucusHost:**

##### Opción A: AWS S3 (Recomendado)

**Ventajas:**
- ✅ Estándar de la industria
- ✅ Escalable y confiable
- ✅ Integración directa con Node.js

**Implementación:**

```typescript
// server/storage.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function storagePut(key: string, data: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: data,
    ContentType: contentType,
  });

  await s3Client.send(command);

  const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  }), { expiresIn: 3600 });

  return { url: signedUrl, key };
}
```

**Variables de Entorno:**
```env
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_S3_BUCKET=tu-bucket-name
```

**Costo:** Gratuito primer año, luego ~$0.023 por GB

##### Opción B: Cloudinary (Más Simple)

**Ventajas:**
- ✅ Más fácil de configurar
- ✅ Transformación de imágenes incluida
- ✅ CDN integrado

**Implementación:**

```typescript
// server/storage.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function storagePut(key: string, data: Buffer, contentType: string) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      public_id: key,
      resource_type: 'auto',
    }, (error, result) => {
      if (error) reject(error);
      else resolve({ url: result?.secure_url, key });
    });

    stream.end(data);
  });
}
```

**Costo:** Gratuito hasta 25 créditos mensuales

##### Opción C: Almacenamiento Local en LucusHost

**Ventajas:**
- ✅ Sin costos adicionales
- ✅ Control total
- ✅ Rápido para archivos pequeños

**Implementación:**

```typescript
// server/storage.ts
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function storagePut(key: string, data: Buffer, contentType: string) {
  const filePath = path.join(UPLOAD_DIR, key);
  const dir = path.dirname(filePath);
  
  // Crear directorio si no existe
  await fs.mkdir(dir, { recursive: true });
  
  // Guardar archivo
  await fs.writeFile(filePath, data);
  
  // Retornar URL pública
  const url = `/uploads/${key}`;
  
  return { url, key };
}

export async function storageGet(key: string) {
  const filePath = path.join(UPLOAD_DIR, key);
  const url = `/uploads/${key}`;
  return { url, key };
}

// server/_core/index.ts
import express from 'express';

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
```

**Limitaciones:**
- ⚠️ Requiere espacio en disco
- ⚠️ No escalable para muchos archivos
- ⚠️ Requiere backup manual

**Recomendación:** Para LucusHost, usar **AWS S3** o **Cloudinary** por seguridad y escalabilidad.

#### 3. **Notificaciones**

**Actual (Manus):**
```typescript
import { notifyOwner } from './_core/notification';

await notifyOwner({
  title: 'Título',
  content: 'Contenido',
});
```

**Problema:** Sistema de notificaciones de Manus no funcionará en LucusHost

**Alternativas:**

##### Opción A: SendGrid (Email)

**Ventajas:**
- ✅ Servicio email confiable
- ✅ Plan gratuito: 100 emails/día
- ✅ Fácil integración

**Implementación:**

```typescript
// Instalar
npm install @sendgrid/mail

// server/notifications.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(to: string, subject: string, htmlContent: string) {
  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Uso
await sendEmail(
  'info@odsenergy.es',
  'Instalación Completada',
  '<h1>Instalación completada exitosamente</h1>'
);
```

**Variables de Entorno:**
```env
SENDGRID_API_KEY=tu-api-key
SENDGRID_FROM_EMAIL=noreply@odsenergy.es
```

**Costo:** Gratuito hasta 100 emails/día

##### Opción B: Nodemailer (SMTP)

**Ventajas:**
- ✅ Sin costo si usas SMTP existente
- ✅ Compatible con cualquier proveedor SMTP

**Implementación:**

```typescript
// Instalar
npm install nodemailer

// server/notifications.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, htmlContent: string) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to,
      subject,
      html: htmlContent,
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
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-app
SMTP_FROM_EMAIL=noreply@odsenergy.es
```

**Costo:** Depende del proveedor SMTP (Gmail gratuito)

**Recomendación:** Usar **SendGrid** por su confiabilidad y facilidad.

---

## 🚀 Implementación Recomendada

### Resumen de Cambios Necesarios

| Componente | Actual (Manus) | Recomendado (LucusHost) | Prioridad |
|-----------|----------------|----------------------|-----------|
| Autenticación | OAuth Manus | Auth0 | 🔴 Alta |
| Almacenamiento | S3 Manus | AWS S3 / Cloudinary | 🔴 Alta |
| Notificaciones | Manus Notify | SendGrid | 🟡 Media |
| Calendario | react-big-calendar | Mantener | 🟢 Baja |
| Fechas | date-fns | Mantener | 🟢 Baja |

### Plan de Migración

#### Fase 1: Autenticación (Semana 1)

```bash
# 1. Instalar Auth0
npm install @auth0/auth0-react

# 2. Configurar variables de entorno
# .env
VITE_AUTH0_DOMAIN=tu-dominio.auth0.com
VITE_AUTH0_CLIENT_ID=tu-client-id

# 3. Actualizar main.tsx
# client/src/main.tsx
import { Auth0Provider } from '@auth0/auth0-react';

# 4. Actualizar componentes
# Reemplazar useAuth() con useAuth0()

# 5. Actualizar backend
# server/auth.ts - Cambiar validación de tokens
```

#### Fase 2: Almacenamiento (Semana 2)

```bash
# 1. Configurar AWS S3
# .env
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...

# 2. Actualizar server/storage.ts
# Reemplazar storagePut y storageGet

# 3. Probar carga de archivos
# npm run test

# 4. Migrar archivos existentes (si es necesario)
```

#### Fase 3: Notificaciones (Semana 3)

```bash
# 1. Instalar SendGrid
npm install @sendgrid/mail

# 2. Configurar variables
# .env
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=...

# 3. Actualizar server/notifications.ts
# Reemplazar notifyOwner con sendEmail

# 4. Probar envío de emails
```

#### Fase 4: Testing y Deployment (Semana 4)

```bash
# 1. Tests unitarios
npm run test

# 2. Build
npm run build

# 3. Deploy a LucusHost
# Seguir guía de LucusHost

# 4. Testing en producción
```

### Checklist de Migración

```markdown
## Autenticación
- [ ] Crear cuenta Auth0
- [ ] Configurar aplicación en Auth0
- [ ] Instalar @auth0/auth0-react
- [ ] Actualizar main.tsx con Auth0Provider
- [ ] Actualizar useAuth() a useAuth0()
- [ ] Probar login/logout
- [ ] Actualizar validación de tokens en backend

## Almacenamiento
- [ ] Crear bucket S3 (o Cloudinary)
- [ ] Configurar credenciales
- [ ] Actualizar server/storage.ts
- [ ] Probar carga de archivos
- [ ] Probar descarga de archivos
- [ ] Verificar URLs públicas

## Notificaciones
- [ ] Crear cuenta SendGrid
- [ ] Configurar API key
- [ ] Actualizar server/notifications.ts
- [ ] Probar envío de emails
- [ ] Configurar templates de email

## Deployment
- [ ] Configurar variables de entorno en LucusHost
- [ ] Build y test local
- [ ] Deploy a LucusHost
- [ ] Probar funcionalidades en producción
- [ ] Monitorear logs
- [ ] Configurar backups
```

---

## 📝 Conclusión

La pestaña de **Calendario** es un componente robusto que utiliza `react-big-calendar` para proporcionar una experiencia visual completa de las instalaciones. La migración a LucusHost requiere principalmente reemplazar las dependencias de Manus (autenticación, almacenamiento, notificaciones) con alternativas estándar de la industria.

### Recomendaciones Finales

✅ **Autenticación:** Auth0 (más robusto y fácil de mantener)
✅ **Almacenamiento:** AWS S3 (estándar de la industria)
✅ **Notificaciones:** SendGrid (confiable y económico)
✅ **Calendario:** Mantener react-big-calendar (funciona bien)

Con estos cambios, la aplicación será completamente independiente de Manus y funcionará perfectamente en LucusHost con Node.js.


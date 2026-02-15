# Guía de Despliegue en LucusHost

Esta guía detalla los pasos necesarios para desplegar la aplicación ODS Energy en LucusHost con el servicio Node.js.

## Requisitos Previos

- Cuenta de LucusHost con servicio Node.js activo
- Acceso a cPanel
- Dominio odsenergy.net configurado
- Acceso SSH (opcional pero recomendado)

## Paso 1: Configurar Base de Datos MySQL

### 1.1 Crear Base de Datos en cPanel

1. Accede a cPanel de LucusHost
2. Ve a **MySQL® Databases** o **Bases de datos MySQL**
3. Crea una nueva base de datos:
   - Nombre: `odsenergy_db` (o el nombre que prefieras)
4. Crea un nuevo usuario MySQL:
   - Usuario: `odsenergy_user`
   - Contraseña: **Genera una contraseña segura y guárdala**
5. Asigna el usuario a la base de datos con **TODOS LOS PRIVILEGIOS**

### 1.2 Obtener Cadena de Conexión

La cadena de conexión tendrá este formato:

```
mysql://usuario:contraseña@localhost:3306/nombre_base_datos
```

Ejemplo:
```
mysql://odsenergy_user:tu_contraseña_segura@localhost:3306/odsenergy_db
```

## Paso 2: Configurar Variables de Entorno

Crea un archivo `.env` en el directorio raíz del proyecto. Puedes usar `.env.lucushost` como plantilla. Variables clave:

```env
# Base de Datos
DATABASE_URL=mysql://puipcivu_app_user:OdsEnergy2025!@localhost/puipcivu_odsenergy_app

# Puerto y Host (Passenger gestiona esto)
PORT=3000
HOST=0.0.0.0

# Entorno
NODE_ENV=production
PASSENGER_APP_ENV=production

# Almacenamiento
STORAGE_TYPE=local
UPLOAD_DIR=uploads
BASE_URL=https://app.odsenergy.net

# JWT Secret (genera una cadena aleatoria segura)
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
```

## Paso 3: Preparar el Proyecto para Producción

### 3.1 Instalar Dependencias

```bash
pnpm install
```

### 3.2 Compilar el Proyecto

```bash
pnpm build
```

Esto generará:
- Frontend compilado en `dist/public`
- Backend compilado en `dist/index.js`

### 3.3 Ejecutar Migraciones de Base de Datos

```bash
pnpm db:push
```

## Paso 4: Subir Archivos a LucusHost

### Opción A: Usando FTP/SFTP

1. Conecta vía FTP/SFTP a tu cuenta de LucusHost
2. Navega al directorio de tu aplicación Node.js (ej: `~/app.odsenergy.net/`)
3. Sube los siguientes archivos y carpetas:
   - `dist/` (completo)
   - `node_modules/` (completo)
   - `package.json`
   - `.env`
   - `drizzle/` (carpeta con migraciones)
   - `drizzle.config.ts`
   - `uploads/` (crea esta carpeta vacía si no existe, con permisos 755)

### Opción B: Usando SSH y Git

```bash
# Conectar por SSH
ssh tu_usuario@tu_servidor.lucushost.com

# Clonar el repositorio
git clone https://github.com/tu-usuario/ods-energy-app.git
cd ods-energy-app

# Instalar dependencias
pnpm install

# Configurar variables de entorno
nano .env
# (pega las variables de entorno y guarda)

# Ejecutar migraciones
pnpm db:push

# Compilar
pnpm build
```

## Paso 5: Configurar Node.js en cPanel

1. Accede a cPanel
2. Ve a **Setup Node.js App** o **Configurar aplicación Node.js**
3. Crea una nueva aplicación:
   - **Node.js version**: Selecciona la versión 22.x o superior
   - **Application mode**: Production
   - **Application root**: Ruta donde subiste los archivos (ej: `nodejs/ods-energy-app`)
   - **Application URL**: Selecciona tu dominio `odsenergy.net`
   - **Application startup file**: `dist/index.js`
   - **Passenger log file**: Deja el valor por defecto

4. Haz clic en **Create** o **Crear**

## Paso 6: Configurar Variables de Entorno en cPanel

En la misma interfaz de **Setup Node.js App**:

1. Busca la sección **Environment Variables** o **Variables de Entorno**
2. Agrega cada variable del archivo `.env`:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NODE_ENV`
   - etc.

## Paso 7: Reiniciar la Aplicación

1. En la interfaz de **Setup Node.js App**, haz clic en **Restart** o **Reiniciar**
2. Espera unos segundos a que la aplicación se inicie

## Paso 8: Verificar el Despliegue

1. Abre tu navegador y ve a `https://odsenergy.net`
2. Deberías ver la aplicación funcionando
3. Intenta iniciar sesión y crear una instalación de prueba

## Solución de Problemas

### La aplicación no inicia

1. Revisa los logs en cPanel → **Setup Node.js App** → **Passenger log file**
2. Verifica que todas las variables de entorno estén configuradas correctamente
3. Asegúrate de que la base de datos esté accesible

### Error de conexión a la base de datos

1. Verifica que la cadena `DATABASE_URL` sea correcta
2. Comprueba que el usuario MySQL tenga permisos
3. Asegúrate de que el host sea `localhost` (no una IP externa)

### Errores 502 o 503

1. Verifica que el puerto configurado no esté en uso
2. Revisa los logs de Passenger
3. Reinicia la aplicación desde cPanel

### Archivos estáticos no se cargan

1. Verifica que la carpeta `dist/` se haya subido completamente
2. Comprueba los permisos de archivos (deben ser 644 para archivos, 755 para directorios)

## Mantenimiento

### Actualizar la Aplicación

```bash
# Conectar por SSH
ssh tu_usuario@tu_servidor.lucushost.com
cd ods-energy-app

# Obtener últimos cambios
git pull

# Instalar nuevas dependencias
pnpm install

# Ejecutar migraciones si hay cambios en la BD
pnpm db:push

# Recompilar
pnpm build

# Reiniciar desde cPanel
```

### Backup de Base de Datos

1. Accede a cPanel → **phpMyAdmin**
2. Selecciona la base de datos `odsenergy_db`
3. Haz clic en **Export** o **Exportar**
4. Selecciona formato SQL y descarga

### Monitoreo

- Revisa regularmente los logs de Passenger en cPanel
- Configura alertas de uptime con servicios como UptimeRobot
- Monitorea el uso de recursos en cPanel

## Contacto de Soporte

- **LucusHost**: https://www.lucushost.com/soporte
- **Documentación Node.js LucusHost**: https://www.lucushost.com/hosting-nodejs

## Notas Adicionales

- **SSL/HTTPS**: LucusHost proporciona certificados SSL gratuitos con Let's Encrypt. Actívalo desde cPanel → SSL/TLS
- **Dominio**: Asegúrate de que `odsenergy.net` apunte a los nameservers de LucusHost
- **Backups**: LucusHost realiza backups automáticos, pero es recomendable hacer backups manuales periódicos
- **Performance**: Considera habilitar caching y optimización de imágenes para mejorar el rendimiento

## Alternativa: Despliegue en Manus

Si prefieres usar el hosting integrado de Manus en lugar de LucusHost:

1. La aplicación ya está lista para desplegarse en Manus
2. Haz clic en el botón **Publish** en el panel de Manus
3. Manus se encargará automáticamente de:
   - Configurar la base de datos
   - Gestionar variables de entorno
   - Desplegar la aplicación
   - Configurar SSL
   - Proporcionar dominio personalizado

Esta opción es más sencilla y no requiere configuración manual de servidor.

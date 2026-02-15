-- ==============================================
-- ODS Energy - Script de Corrección de Usuarios Duplicados
-- Ejecutar en phpMyAdmin contra: puipcivu_odsenergy_app
-- ==============================================

-- PASO 1: Ver cuántos duplicados hay
SELECT email, COUNT(*) as duplicados 
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- PASO 2: Mantener solo el usuario con ID más bajo para cada email (el primero creado)
-- CUIDADO: Esto borrará los usuarios duplicados
DELETE u1 FROM users u1
INNER JOIN users u2 
WHERE u1.id > u2.id AND u1.email = u2.email;

-- PASO 3: Verificar que ya no hay duplicados
SELECT email, COUNT(*) as duplicados 
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- PASO 4: Añadir restricción UNIQUE al email si no existe
-- Primero verificamos si ya existe
SHOW INDEX FROM users WHERE Column_name = 'email';

-- Si no existe, ejecutar esta línea:
ALTER TABLE users ADD UNIQUE INDEX users_email_unique (email);

-- ==============================================
-- VERIFICACIÓN FINAL
-- ==============================================
SELECT * FROM users ORDER BY id;

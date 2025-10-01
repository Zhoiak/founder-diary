# 🗄️ GUÍA DE MIGRACIÓN - SUPABASE A POSTGRESQL

## 📋 **RESUMEN**

Migración completa de 68 tablas desde Supabase a PostgreSQL propio en el servidor.

## 🚀 **PASOS DE MIGRACIÓN**

### **PASO 1: Actualizar Servidor con pgAdmin**

```bash
# En el servidor VPS
cd ~/founder-diary
git pull origin main
docker-compose -f docker-compose.production.yml up -d
```

### **PASO 2: Acceder a pgAdmin**

1. **URL**: `http://85.10.194.199:5050`
2. **Credenciales**:
   - Email: `admin@luftmist.shop`
   - Password: `FounderDiary2024!`

### **PASO 3: Conectar a PostgreSQL**

En pgAdmin:
1. Click derecho en "Servers" → "Register" → "Server"
2. **General Tab**:
   - Name: `Founder Diary Production`
3. **Connection Tab**:
   - Host: `postgres` (nombre del contenedor)
   - Port: `5432`
   - Database: `founder_diary`
   - Username: `founder_user`
   - Password: `FounderDiary2024!`
4. Click "Save"

### **PASO 4: Crear Esquema Completo**

Opción A - **Desde pgAdmin** (Recomendado):
1. Navega a `Servers` → `Founder Diary Production` → `Databases` → `founder_diary`
2. Click derecho → "Query Tool"
3. Copia y pega el contenido del archivo de migración de Supabase
4. Ejecuta con F5 o botón "Execute"

Opción B - **Desde línea de comandos**:
```bash
# En el servidor, copiar archivo SQL
scp /path/to/migration.sql root@85.10.194.199:/root/

# Conectar al servidor
ssh root@85.10.194.199

# Ejecutar migración
docker exec -i founder-diary-postgres psql -U founder_user -d founder_diary < /root/migration.sql
```

### **PASO 5: Exportar Datos de Supabase**

Ve a Supabase Dashboard → SQL Editor y exporta tabla por tabla:

```sql
-- Ejemplo: Exportar projects
COPY (SELECT * FROM projects) TO STDOUT WITH CSV HEADER;
```

Guarda el output en archivos `.csv`.

### **PASO 6: Importar Datos a PostgreSQL**

En pgAdmin Query Tool:

```sql
-- Ejemplo: Importar projects
COPY projects FROM PROGRAM 'cat /path/to/projects.csv' WITH CSV HEADER;
```

O desde línea de comandos:
```bash
docker exec -i founder-diary-postgres psql -U founder_user -d founder_diary -c "\COPY projects FROM STDIN WITH CSV HEADER" < projects.csv
```

### **PASO 7: Verificar Migración**

```sql
-- Verificar conteo de registros
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Verificar integridad
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM daily_logs;
SELECT COUNT(*) FROM personal_entries;
```

### **PASO 8: Actualizar Variables de Entorno**

Edita `.env.local` en el proyecto:

```env
# ANTES (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# DESPUÉS (PostgreSQL propio)
DATABASE_URL=postgresql://founder_user:FounderDiary2024!@85.10.194.199:5432/founder_diary
# Remover variables de Supabase
```

### **PASO 9: Actualizar Docker Compose**

Ya está configurado en `docker-compose.production.yml`.

### **PASO 10: Deploy y Pruebas**

```bash
# Deploy
./deployment/deploy.sh

# Verificar logs
docker logs -f founder-diary-app

# Probar app
curl https://luftmist.shop
```

## ⚠️ **CONSIDERACIONES IMPORTANTES**

### **Backup Antes de Migrar**
```bash
# Backup completo de Supabase
pg_dump -h db.[PROJECT].supabase.co -U postgres -d postgres > supabase_backup.sql
```

### **Tablas Críticas (Priorizar)**
1. `auth.users` / `profiles`
2. `projects` y `project_members`
3. `personal_entries`
4. `daily_logs`
5. `habits` y `habit_logs`

### **Tablas Secundarias**
- `flashcards`, `books`, `people`, `memories`
- Se pueden migrar después sin afectar funcionalidad crítica

### **RLS (Row Level Security)**
- Supabase usa RLS extensivamente
- PostgreSQL estándar también lo soporta
- Las políticas ya están en el schema

## 🔧 **TROUBLESHOOTING**

### **Error: relation "auth.users" does not exist**
```sql
CREATE SCHEMA IF NOT EXISTS auth;
-- Luego ejecutar migración completa
```

### **Error: permission denied**
```sql
GRANT ALL PRIVILEGES ON DATABASE founder_diary TO founder_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO founder_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO founder_user;
```

### **Error: constraint violation**
- Verificar orden de importación (padres antes que hijos)
- Desactivar temporalmente FK constraints:
```sql
SET session_replication_role = 'replica';
-- Importar datos
SET session_replication_role = 'origin';
```

## 📊 **ORDEN DE IMPORTACIÓN RECOMENDADO**

```
1. auth.users
2. projects
3. project_members
4. life_areas
5. personal_entries
6. personal_entry_areas
7. habits
8. habit_logs
9. routines
10. routine_steps
11. routine_runs
12. Resto de tablas...
```

## ✅ **CHECKLIST FINAL**

- [ ] pgAdmin instalado y funcionando
- [ ] Conexión a PostgreSQL exitosa
- [ ] Esquema completo creado
- [ ] Datos exportados de Supabase
- [ ] Datos importados a PostgreSQL
- [ ] Conteos verificados
- [ ] Variables de entorno actualizadas
- [ ] App desplegada y funcionando
- [ ] Backup de Supabase guardado
- [ ] Pruebas de funcionalidad completas

## 🎯 **PRÓXIMOS PASOS DESPUÉS DE MIGRACIÓN**

1. **Implementar Better Auth** (reemplazar Supabase Auth)
2. **Configurar backups automáticos**
3. **Implementar logging con Axiom.co**
4. **Optimizar índices y queries**
5. **Panel de administración dev**

---

*Última actualización: 2025-10-01*

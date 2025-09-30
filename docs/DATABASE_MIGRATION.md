# 🗄️ DATABASE MIGRATION PLAN

## 📊 **ESTADO ACTUAL**

### **SUPABASE (ORIGEN):**
- **68 tablas** identificadas
- **Datos de producción** activos
- **Esquema completo** disponible en `/supabase/migrations/`

### **POSTGRESQL PROPIO (DESTINO):**
- **Servidor**: `85.10.194.199:5432`
- **Base de datos**: `founder_diary`
- **Usuario**: `founder_user`
- **Acceso visual**: pgAdmin en puerto 5050

---

## 🎯 **ESTRATEGIA DE MIGRACIÓN**

### **ENFOQUE ELEGIDO: RECREAR ESQUEMA DESDE CÓDIGO**
✅ **Ventajas:**
- Esquema limpio y actualizado
- Control total sobre la estructura
- Evita inconsistencias de Supabase
- Más rápido que exportar esquema

❌ **Desventajas:**
- Requiere migrar solo datos (no esquema)

---

## 📋 **TABLAS IDENTIFICADAS (68 TOTAL)**

### **🔥 CRÍTICAS (Funcionalidad Principal):**
```sql
-- Usuarios y autenticación
profiles, user_settings, user_sessions

-- Journaling principal
personal_entries, daily_logs, journal_prompts

-- Hábitos y rutinas
habits, habit_logs, routines, routine_logs, routine_runs, routine_steps, routine_step_logs

-- Objetivos y metas
goals, key_results, challenges, challenge_progress
```

### **⚡ IMPORTANTES (Features Secundarias):**
```sql
-- Learning y flashcards
flashcards, learning_decks, learning_items, card_learning_progress

-- Libros y lectura
books, book_reviews, book_highlights, reading_lists, reading_list_books, reading_progress

-- Personas y contactos
people, people_contacts, people_groups, people_group_members, people_interactions

-- Memorias y colecciones
memories, memory_collections, memory_collection_items, memory_photos
```

### **📊 SISTEMA (Analytics y Admin):**
```sql
-- Métricas y sistema
system_metrics, system_activity, system_recommendations, wellbeing_metrics

-- Feedback y colaboración
feedback, feedback_comments, feedback_votes, feedback_notifications
collaborations, collaboration_requests

-- Admin y desarrollo
dev_notes, features, user_feedback
```

---

## 🚀 **PLAN DE EJECUCIÓN**

### **FASE 1: PREPARAR ESQUEMA**
1. **Combinar migraciones existentes**
   - Usar `/supabase/migrations/20250127_diary_plus_complete.sql`
   - Añadir esquemas adicionales si es necesario
   - Crear script maestro de esquema

2. **Ejecutar en PostgreSQL propio**
   ```bash
   psql -h localhost -p 5432 -U founder_user -d founder_diary -f complete_schema.sql
   ```

### **FASE 2: MIGRAR DATOS CRÍTICOS**
1. **Exportar desde Supabase** (SQL Editor):
   ```sql
   -- Exportar usuarios
   COPY profiles TO STDOUT WITH CSV HEADER;
   
   -- Exportar entradas personales
   COPY personal_entries TO STDOUT WITH CSV HEADER;
   
   -- Exportar hábitos
   COPY habits TO STDOUT WITH CSV HEADER;
   ```

2. **Importar a PostgreSQL propio**:
   ```bash
   psql -h localhost -p 5432 -U founder_user -d founder_diary -c "\COPY profiles FROM 'profiles.csv' WITH CSV HEADER"
   ```

### **FASE 3: MIGRAR DATOS SECUNDARIOS**
- Repetir proceso para tablas importantes
- Verificar integridad referencial
- Validar datos migrados

### **FASE 4: ACTUALIZAR APLICACIÓN**
1. **Cambiar variables de entorno**:
   ```env
   # Cambiar de Supabase a PostgreSQL propio
   DATABASE_URL=postgresql://founder_user:FounderDiary2024!@postgres:5432/founder_diary
   ```

2. **Actualizar conexiones**
3. **Probar funcionalidad completa**

---

## 🛠️ **HERRAMIENTAS DISPONIBLES**

### **ACCESO A DATOS:**
- **Supabase Dashboard**: Exportar datos via SQL Editor
- **pgAdmin**: `http://85.10.194.199:5050` (gestión visual)
- **psql**: Línea de comandos para PostgreSQL

### **ARCHIVOS DE ESQUEMA:**
```
/supabase/migrations/
├── 20250127_diary_plus_complete.sql (21KB - Principal)
├── 20250127_personal_project_seed.sql (4KB)
├── 20250127_vault_configurations.sql (8KB)
└── 20250127_yearbook_generations.sql (2KB)
```

---

## ⚠️ **CONSIDERACIONES IMPORTANTES**

### **BACKUP ANTES DE MIGRAR:**
- Hacer backup completo de Supabase
- Mantener Supabase activo durante migración
- Plan de rollback si algo falla

### **TESTING:**
- Probar con datos de prueba primero
- Verificar todas las funcionalidades
- Validar performance

### **DOWNTIME:**
- Planificar ventana de mantenimiento
- Comunicar a usuarios si es necesario
- Migración gradual si es posible

---

## 📈 **PROGRESO ACTUAL**

```
Análisis:       ████████████████████████████████████████ 100%
Esquema:        ████████████████████████████████████████  80%
pgAdmin:        ████████████████████████████████████████  90%
Migración:      ████████████████████████████████████████  10%
Testing:        ████████████████████████████████████████   0%
```

**Próximo paso**: Crear esquema completo en PostgreSQL propio

---

*Última actualización: 2025-09-30*

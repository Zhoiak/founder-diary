#!/usr/bin/env tsx

/**
 * MIGRACIÓN CORE TABLES - FASE 2
 * Crea las 10 tablas críticas en PostgreSQL
 * 
 * ORDEN DE EJECUCIÓN:
 * 1. projects (tabla raíz)
 * 2. life_areas_new
 * 3. Resto de tablas (daily_logs, goals, etc.)
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { 
  projects, 
  dailyLogs, 
  goals, 
  weeklyReviews, 
  investorUpdates, 
  decisions,
  lifeAreasNew,
  personalEntriesNew,
  habitsNew,
  routinesNew 
} from '../src/lib/db/schema-migration';

// Configuración de conexión
const connectionString = process.env.DATABASE_URL || 'postgresql://founder_user:FounderDiary2024!@localhost:5432/founder_diary';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function createCoreTables() {
  console.log('🚀 INICIANDO MIGRACIÓN CORE TABLES - FASE 2');
  console.log('================================================');
  
  try {
    // PASO 1: Crear tabla raíz - PROJECTS
    console.log('📋 1. Creando tabla PROJECTS (raíz)...');
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner UUID NOT NULL,
        name TEXT NOT NULL,
        slug TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        feature_flags JSONB DEFAULT '{}',
        private_vault BOOLEAN DEFAULT false,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla projects creada');

    // PASO 2: Crear LIFE_AREAS (necesaria para habits)
    console.log('📋 2. Creando tabla LIFE_AREAS_NEW...');
    await sql`
      CREATE TABLE IF NOT EXISTS life_areas_new (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        key TEXT NOT NULL,
        label TEXT NOT NULL,
        color TEXT DEFAULT '#3B82F6',
        icon TEXT DEFAULT '🌟',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla life_areas_new creada');

    // PASO 3: Crear DAILY_LOGS
    console.log('📋 3. Creando tabla DAILY_LOGS...');
    await sql`
      CREATE TABLE IF NOT EXISTS daily_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        date DATE NOT NULL,
        title TEXT,
        content_md TEXT,
        tags TEXT[] DEFAULT '{}',
        mood INTEGER,
        time_spent_minutes INTEGER DEFAULT 0,
        ai_summary TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla daily_logs creada');

    // PASO 4: Crear GOALS
    console.log('📋 4. Creando tabla GOALS...');
    await sql`
      CREATE TABLE IF NOT EXISTS goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        objective TEXT NOT NULL,
        due_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla goals creada');

    // PASO 5: Crear WEEKLY_REVIEWS
    console.log('📋 5. Creando tabla WEEKLY_REVIEWS...');
    await sql`
      CREATE TABLE IF NOT EXISTS weekly_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        week_start DATE NOT NULL,
        week_end DATE NOT NULL,
        content_md TEXT,
        ai_summary TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla weekly_reviews creada');

    // PASO 6: Crear INVESTOR_UPDATES
    console.log('📋 6. Creando tabla INVESTOR_UPDATES...');
    await sql`
      CREATE TABLE IF NOT EXISTS investor_updates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        month INTEGER,
        year INTEGER,
        content_md TEXT,
        ai_summary TEXT,
        public_slug TEXT,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla investor_updates creada');

    // PASO 7: Crear DECISIONS
    console.log('📋 7. Creando tabla DECISIONS...');
    await sql`
      CREATE TABLE IF NOT EXISTS decisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        title TEXT NOT NULL,
        context_md TEXT,
        options_md TEXT,
        decision_md TEXT,
        consequences_md TEXT,
        status TEXT DEFAULT 'proposed',
        relates_to TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla decisions creada');

    // PASO 8: Crear PERSONAL_ENTRIES_NEW
    console.log('📋 8. Creando tabla PERSONAL_ENTRIES_NEW...');
    await sql`
      CREATE TABLE IF NOT EXISTS personal_entries_new (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        date DATE NOT NULL,
        title TEXT,
        content_md TEXT,
        tags TEXT[] DEFAULT '{}',
        mood INTEGER,
        energy INTEGER,
        sleep_hours NUMERIC,
        sentiment NUMERIC,
        latitude NUMERIC,
        longitude NUMERIC,
        location_name TEXT,
        photos JSONB DEFAULT '[]',
        is_private BOOLEAN DEFAULT false,
        encrypted_content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla personal_entries_new creada');

    // PASO 9: Crear HABITS_NEW
    console.log('📋 9. Creando tabla HABITS_NEW...');
    await sql`
      CREATE TABLE IF NOT EXISTS habits_new (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        title TEXT NOT NULL,
        description TEXT,
        schedule TEXT,
        target_per_week INTEGER DEFAULT 7,
        area_id UUID REFERENCES life_areas_new(id),
        color TEXT DEFAULT '#10B981',
        icon TEXT DEFAULT '✅',
        archived BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla habits_new creada');

    // PASO 10: Crear ROUTINES_NEW
    console.log('📋 10. Creando tabla ROUTINES_NEW...');
    await sql`
      CREATE TABLE IF NOT EXISTS routines_new (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla routines_new creada');

    // PASO 11: Crear índices para performance
    console.log('📋 11. Creando índices...');
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_logs_project_date ON daily_logs(project_id, date);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_goals_project_due ON goals(project_id, due_date);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_personal_entries_project_date ON personal_entries_new(project_id, date);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_habits_project_area ON habits_new(project_id, area_id);`;
    console.log('✅ Índices creados');

    console.log('================================================');
    console.log('🎉 MIGRACIÓN CORE TABLES COMPLETADA');
    console.log('📊 10 tablas críticas creadas en PostgreSQL');
    console.log('🔗 Foreign keys y relaciones configuradas');
    console.log('⚡ Índices de performance aplicados');
    console.log('================================================');

  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Ejecutar migración
if (require.main === module) {
  createCoreTables()
    .then(() => {
      console.log('✅ Migración completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migración falló:', error);
      process.exit(1);
    });
}

export { createCoreTables };

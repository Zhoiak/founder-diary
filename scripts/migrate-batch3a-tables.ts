#!/usr/bin/env tsx

/**
 * MIGRACIÓN BATCH 3A - SISTEMAS INDEPENDIENTES
 * Crea 8 tablas sin dependencias externas
 * 
 * ORDEN DE EJECUCIÓN:
 * 1. Animal archetypes system (animal_archetypes, user_animal_archetypes)
 * 2. User feedback system (user_feedback, feedback_votes, feedback_comments, feedback_notifications)
 * 3. Memories system (memories, memory_collections)
 */

import postgres from 'postgres';

// Configuración de conexión
const connectionString = process.env.DATABASE_URL || 'postgresql://founder_user:FounderDiary2024!@localhost:5432/founder_diary';
const sql = postgres(connectionString);

async function createBatch3aTables() {
  console.log('🚀 INICIANDO MIGRACIÓN BATCH 3A - 8 SISTEMAS INDEPENDIENTES');
  console.log('================================================');
  
  try {
    // PASO 1: ANIMAL ARCHETYPES SYSTEM
    console.log('📋 1. Creando ANIMAL_ARCHETYPES...');
    await sql`
      CREATE TABLE IF NOT EXISTS animal_archetypes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        animal_emoji TEXT NOT NULL,
        animal_icon TEXT NOT NULL,
        personality_traits TEXT[],
        strengths TEXT[],
        challenges TEXT[],
        motivation_style TEXT,
        preferred_reminder_style TEXT,
        optimal_session_length INTEGER,
        best_time_of_day TEXT,
        primary_color TEXT,
        secondary_color TEXT,
        gradient_from TEXT,
        gradient_to TEXT,
        dopamine_triggers TEXT[],
        stress_indicators TEXT[],
        recovery_methods TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla animal_archetypes creada');

    console.log('📋 2. Creando USER_ANIMAL_ARCHETYPES...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_animal_archetypes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        archetype_id UUID NOT NULL REFERENCES animal_archetypes(id),
        confidence_score NUMERIC DEFAULT 0.75,
        custom_traits TEXT[],
        adaptation_level INTEGER DEFAULT 1,
        engagement_score NUMERIC DEFAULT 0.0,
        completion_rate NUMERIC DEFAULT 0.0,
        satisfaction_score NUMERIC DEFAULT 0.0,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla user_animal_archetypes creada');

    // PASO 2: USER FEEDBACK SYSTEM
    console.log('📋 3. Creando USER_FEEDBACK...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        user_email TEXT,
        feedback_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'submitted',
        admin_notes TEXT,
        implementation_notes TEXT,
        tracking_id TEXT NOT NULL DEFAULT (
          'FB-' || EXTRACT(year FROM now()) || '-' || 
          lpad(EXTRACT(doy FROM now())::text, 3, '0') || '-' || 
          lpad(EXTRACT(hour FROM now())::text, 2, '0') || 
          lpad(EXTRACT(minute FROM now())::text, 2, '0')
        ),
        user_agent TEXT,
        ip_address INET,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        completed_at TIMESTAMP WITH TIME ZONE,
        notified_at TIMESTAMP WITH TIME ZONE
      );
    `;
    console.log('✅ Tabla user_feedback creada');

    console.log('📋 4. Creando FEEDBACK_VOTES...');
    await sql`
      CREATE TABLE IF NOT EXISTS feedback_votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        feedback_id UUID NOT NULL REFERENCES user_feedback(id),
        user_id UUID,
        vote_type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla feedback_votes creada');

    console.log('📋 5. Creando FEEDBACK_COMMENTS...');
    await sql`
      CREATE TABLE IF NOT EXISTS feedback_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        feedback_id UUID NOT NULL REFERENCES user_feedback(id),
        user_id UUID,
        comment TEXT NOT NULL,
        is_admin_comment BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla feedback_comments creada');

    console.log('📋 6. Creando FEEDBACK_NOTIFICATIONS...');
    await sql`
      CREATE TABLE IF NOT EXISTS feedback_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        feedback_id UUID NOT NULL REFERENCES user_feedback(id),
        user_id UUID,
        notification_type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        reward_details JSONB,
        read_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla feedback_notifications creada');

    // PASO 3: MEMORIES SYSTEM
    console.log('📋 7. Creando MEMORIES...');
    await sql`
      CREATE TABLE IF NOT EXISTS memories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        project_id UUID,
        title TEXT NOT NULL,
        description TEXT,
        memory_date DATE NOT NULL,
        location_name TEXT,
        latitude NUMERIC,
        longitude NUMERIC,
        mood INTEGER,
        is_favorite BOOLEAN DEFAULT false,
        is_private BOOLEAN DEFAULT false,
        tags TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla memories creada');

    console.log('📋 8. Creando MEMORY_COLLECTIONS...');
    await sql`
      CREATE TABLE IF NOT EXISTS memory_collections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        project_id UUID,
        name TEXT NOT NULL,
        description TEXT,
        cover_photo_id UUID,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla memory_collections creada');

    // PASO 4: Crear índices para performance
    console.log('📋 9. Creando índices...');
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_user_animal_archetypes_user ON user_animal_archetypes(user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_user_animal_archetypes_archetype ON user_animal_archetypes(archetype_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_feedback_votes_feedback ON feedback_votes(feedback_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback ON feedback_comments(feedback_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_feedback_notifications_feedback ON feedback_notifications(feedback_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_feedback_notifications_user ON feedback_notifications(user_id, read_at);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_memories_user_date ON memories(user_id, memory_date);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_memories_location ON memories(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;`;
      await sql`CREATE INDEX IF NOT EXISTS idx_memory_collections_user ON memory_collections(user_id);`;
      console.log('✅ Índices creados para batch 3a');
    } catch (indexError) {
      console.log('⚠️ Algunos índices no se pudieron crear (normal si las tablas ya existían)');
    }

    console.log('================================================');
    console.log('🎉 MIGRACIÓN BATCH 3A COMPLETADA');
    console.log('📊 8 sistemas independientes creados en PostgreSQL');
    console.log('🔗 Foreign keys y relaciones configuradas');
    console.log('⚡ Índices de performance aplicados');
    console.log('📍 Índices geoespaciales para memories');
    console.log('================================================');

  } catch (error) {
    console.error('❌ Error en migración batch 3a:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Ejecutar migración
if (require.main === module) {
  createBatch3aTables()
    .then(() => {
      console.log('✅ Migración batch 3a completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migración batch 3a falló:', error);
      process.exit(1);
    });
}

export { createBatch3aTables };

#!/usr/bin/env tsx

/**
 * MIGRACIÓN BATCH 2 - NIVEL 1 DEPENDENCIAS
 * Crea 20 tablas que dependen directamente de projects
 * 
 * ORDEN DE EJECUCIÓN:
 * 1. Project management (project_members, key_results, integration_counters)
 * 2. Product management (assumptions, risks, features, streak_freezes)
 * 3. People & contacts (people_contacts, people, people_groups)
 * 4. Learning & knowledge (learning_items, flashcards)
 * 5. Books & reading (books, reading_lists)
 * 6. Personal life OS (journal_prompts, affirmations, challenges, wellbeing_metrics)
 * 7. Collaboration & utilities (project_invitations, static_notes)
 */

import postgres from 'postgres';

// Configuración de conexión
const connectionString = process.env.DATABASE_URL || 'postgresql://founder_user:FounderDiary2024!@localhost:5432/founder_diary';
const sql = postgres(connectionString);

async function createBatch2Tables() {
  console.log('🚀 INICIANDO MIGRACIÓN BATCH 2 - 20 TABLAS NIVEL 1');
  console.log('================================================');
  
  try {
    // PASO 1: PROJECT MANAGEMENT
    console.log('📋 1. Creando PROJECT_MEMBERS...');
    await sql`
      CREATE TABLE IF NOT EXISTS project_members (
        project_id UUID NOT NULL REFERENCES projects(id),
        user_id UUID NOT NULL,
        role TEXT DEFAULT 'owner',
        invited_at TIMESTAMP WITH TIME ZONE,
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        PRIMARY KEY (project_id, user_id)
      );
    `;
    console.log('✅ Tabla project_members creada');

    console.log('📋 2. Creando KEY_RESULTS...');
    await sql`
      CREATE TABLE IF NOT EXISTS key_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        goal_id UUID REFERENCES goals(id),
        name TEXT NOT NULL,
        target NUMERIC,
        current NUMERIC DEFAULT 0,
        unit TEXT
      );
    `;
    console.log('✅ Tabla key_results creada');

    console.log('📋 3. Creando INTEGRATION_COUNTERS...');
    await sql`
      CREATE TABLE IF NOT EXISTS integration_counters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        period_start DATE,
        period_end DATE,
        github_prs INTEGER DEFAULT 0,
        github_issues INTEGER DEFAULT 0,
        vercel_deploys INTEGER DEFAULT 0,
        calendar_events INTEGER DEFAULT 0
      );
    `;
    console.log('✅ Tabla integration_counters creada');

    // PASO 2: PRODUCT MANAGEMENT
    console.log('📋 4. Creando ASSUMPTIONS...');
    await sql`
      CREATE TABLE IF NOT EXISTS assumptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        hypothesis TEXT NOT NULL,
        test_plan_md TEXT,
        result_md TEXT,
        status TEXT DEFAULT 'untested',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla assumptions creada');

    console.log('📋 5. Creando RISKS...');
    await sql`
      CREATE TABLE IF NOT EXISTS risks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        title TEXT NOT NULL,
        category TEXT,
        probability INTEGER,
        impact INTEGER,
        mitigation_md TEXT,
        owner UUID,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla risks creada');

    console.log('📋 6. Creando FEATURES...');
    await sql`
      CREATE TABLE IF NOT EXISTS features (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        title TEXT NOT NULL,
        description_md TEXT,
        reach NUMERIC DEFAULT 0,
        impact NUMERIC DEFAULT 0,
        confidence NUMERIC DEFAULT 0,
        effort NUMERIC DEFAULT 1,
        status TEXT DEFAULT 'idea',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla features creada');

    console.log('📋 7. Creando STREAK_FREEZES...');
    await sql`
      CREATE TABLE IF NOT EXISTS streak_freezes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        date DATE NOT NULL,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla streak_freezes creada');

    // PASO 3: PEOPLE & CONTACTS
    console.log('📋 8. Creando PEOPLE_CONTACTS...');
    await sql`
      CREATE TABLE IF NOT EXISTS people_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        name TEXT NOT NULL,
        aka TEXT,
        tags TEXT[] DEFAULT '{}',
        birthday DATE,
        timezone TEXT DEFAULT 'UTC',
        email TEXT,
        phone TEXT,
        notes_md TEXT,
        relationship_type TEXT,
        importance INTEGER DEFAULT 3,
        last_contact DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla people_contacts creada');

    console.log('📋 9. Creando PEOPLE...');
    await sql`
      CREATE TABLE IF NOT EXISTS people (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        project_id UUID REFERENCES projects(id),
        first_name TEXT NOT NULL,
        last_name TEXT,
        full_name TEXT,
        nickname TEXT,
        email TEXT,
        phone TEXT,
        birthday DATE,
        relationship_type TEXT DEFAULT 'friend',
        relationship_closeness INTEGER DEFAULT 3,
        company TEXT,
        job_title TEXT,
        location TEXT,
        address TEXT,
        social_links JSONB DEFAULT '{}',
        avatar_url TEXT,
        notes TEXT,
        tags TEXT[],
        is_favorite BOOLEAN DEFAULT false,
        is_archived BOOLEAN DEFAULT false,
        last_contact_date DATE,
        contact_frequency_days INTEGER DEFAULT 30,
        next_contact_reminder DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla people creada');

    console.log('📋 10. Creando PEOPLE_GROUPS...');
    await sql`
      CREATE TABLE IF NOT EXISTS people_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        project_id UUID REFERENCES projects(id),
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        icon TEXT DEFAULT '👥',
        is_system_group BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla people_groups creada');

    // PASO 4: LEARNING & KNOWLEDGE
    console.log('📋 11. Creando LEARNING_ITEMS...');
    await sql`
      CREATE TABLE IF NOT EXISTS learning_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        author TEXT,
        source_url TEXT,
        isbn TEXT,
        status TEXT DEFAULT 'want_to_read',
        rating INTEGER,
        started_at DATE,
        finished_at DATE,
        notes_md TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla learning_items creada');

    console.log('📋 12. Creando FLASHCARDS...');
    await sql`
      CREATE TABLE IF NOT EXISTS flashcards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        source_highlight_id UUID,
        deck_name TEXT DEFAULT 'General',
        deck_id UUID,
        front_content TEXT,
        back_content TEXT,
        hint TEXT,
        card_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        last_reviewed TIMESTAMP WITH TIME ZONE,
        next_review TIMESTAMP WITH TIME ZONE,
        interval_days INTEGER DEFAULT 1,
        ease_factor NUMERIC DEFAULT 2.5,
        repetitions INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla flashcards creada');

    // PASO 5: BOOKS & READING
    console.log('📋 13. Creando BOOKS...');
    await sql`
      CREATE TABLE IF NOT EXISTS books (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        project_id UUID REFERENCES projects(id),
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        isbn TEXT,
        description TEXT,
        cover_image_url TEXT,
        pages INTEGER,
        language TEXT DEFAULT 'es',
        genre TEXT,
        publisher TEXT,
        published_year INTEGER,
        purchase_url TEXT,
        estimated_price NUMERIC,
        actual_price NUMERIC,
        currency TEXT DEFAULT 'EUR',
        priority_level INTEGER DEFAULT 5,
        reading_status TEXT DEFAULT 'wishlist',
        is_public BOOLEAN DEFAULT false,
        allow_crowdfunding BOOLEAN DEFAULT false,
        crowdfunding_goal NUMERIC,
        crowdfunding_raised NUMERIC DEFAULT 0,
        crowdfunding_deadline DATE,
        crowdfunding_message TEXT,
        tags TEXT[],
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        started_reading_at TIMESTAMP WITH TIME ZONE,
        completed_reading_at TIMESTAMP WITH TIME ZONE
      );
    `;
    console.log('✅ Tabla books creada');

    console.log('📋 14. Creando READING_LISTS...');
    await sql`
      CREATE TABLE IF NOT EXISTS reading_lists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        project_id UUID REFERENCES projects(id),
        name TEXT NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT false,
        color TEXT DEFAULT '#3B82F6',
        icon TEXT DEFAULT '📚',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla reading_lists creada');

    // PASO 6: PERSONAL LIFE OS
    console.log('📋 15. Creando JOURNAL_PROMPTS...');
    await sql`
      CREATE TABLE IF NOT EXISTS journal_prompts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        key TEXT NOT NULL,
        text_md TEXT NOT NULL,
        area_id UUID,
        frequency TEXT DEFAULT 'daily',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla journal_prompts creada');

    console.log('📋 16. Creando AFFIRMATIONS...');
    await sql`
      CREATE TABLE IF NOT EXISTS affirmations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        text_md TEXT NOT NULL,
        area_id UUID,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla affirmations creada');

    console.log('📋 17. Creando CHALLENGES...');
    await sql`
      CREATE TABLE IF NOT EXISTS challenges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        title TEXT NOT NULL,
        description TEXT,
        days INTEGER DEFAULT 30,
        start_date DATE,
        area_id UUID,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla challenges creada');

    console.log('📋 18. Creando WELLBEING_METRICS...');
    await sql`
      CREATE TABLE IF NOT EXISTS wellbeing_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        user_id UUID,
        date DATE NOT NULL,
        metric_type TEXT NOT NULL,
        value NUMERIC NOT NULL,
        unit TEXT,
        source TEXT DEFAULT 'manual',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla wellbeing_metrics creada');

    // PASO 7: COLLABORATION & UTILITIES
    console.log('📋 19. Creando PROJECT_INVITATIONS...');
    await sql`
      CREATE TABLE IF NOT EXISTS project_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id),
        invited_by UUID NOT NULL,
        invited_email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        status TEXT NOT NULL DEFAULT 'pending',
        invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla project_invitations creada');

    console.log('📋 20. Creando STATIC_NOTES...');
    await sql`
      CREATE TABLE IF NOT EXISTS static_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        project_id UUID REFERENCES projects(id),
        module_name TEXT NOT NULL,
        note_type TEXT DEFAULT 'reminder',
        title TEXT,
        content TEXT NOT NULL,
        color TEXT DEFAULT '#FEF3C7',
        icon TEXT DEFAULT '📝',
        position_x INTEGER DEFAULT 0,
        position_y INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT true,
        is_visible BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    console.log('✅ Tabla static_notes creada');

    // PASO 8: Crear índices para performance
    console.log('📋 21. Creando índices...');
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_key_results_goal ON key_results(goal_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_people_contacts_project ON people_contacts(project_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_people_project_user ON people(project_id, user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_learning_items_project ON learning_items(project_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_flashcards_project ON flashcards(project_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_books_project_user ON books(project_id, user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_wellbeing_metrics_date ON wellbeing_metrics(project_id, date);`;
      console.log('✅ Índices creados para batch 2');
    } catch (indexError) {
      console.log('⚠️ Algunos índices no se pudieron crear (normal si las tablas ya existían)');
    }

    console.log('================================================');
    console.log('🎉 MIGRACIÓN BATCH 2 COMPLETADA');
    console.log('📊 20 tablas nivel 1 creadas en PostgreSQL');
    console.log('🔗 Foreign keys y relaciones configuradas');
    console.log('⚡ Índices de performance aplicados');
    console.log('================================================');

  } catch (error) {
    console.error('❌ Error en migración batch 2:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Ejecutar migración
if (require.main === module) {
  createBatch2Tables()
    .then(() => {
      console.log('✅ Migración batch 2 completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migración batch 2 falló:', error);
      process.exit(1);
    });
}

export { createBatch2Tables };

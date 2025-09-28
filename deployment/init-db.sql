-- Inicialización de base de datos para Founder Diary
-- Este script se ejecuta automáticamente al crear el container PostgreSQL

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Crear schema para NextAuth.js
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Tabla de usuarios (NextAuth.js compatible)
CREATE TABLE IF NOT EXISTS next_auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    email_verified TIMESTAMPTZ,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de cuentas (OAuth providers)
CREATE TABLE IF NOT EXISTS next_auth.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_account_id)
);

-- Tabla de sesiones
CREATE TABLE IF NOT EXISTS next_auth.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tokens de verificación
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- Crear índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON next_auth.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON next_auth.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON next_auth.sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_users_email ON next_auth.users(email);

-- Crear usuario admin inicial (opcional)
INSERT INTO next_auth.users (email, name, email_verified) 
VALUES ('admin@founderdiary.com', 'Admin User', NOW())
ON CONFLICT (email) DO NOTHING;

-- Mensaje de confirmación
SELECT 'Database initialized successfully for Founder Diary!' as status;

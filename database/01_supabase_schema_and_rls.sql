-- ============================================================================
-- PROJECT: SHIELD PARENTAL GUARD & AI-ANALYTICS
-- LAYER: DATABASE & ROW LEVEL SECURITY (RLS) POLICIES
-- PLATFORM: SUPABASE POSTGRESQL (ZERO-TRUST COMPLIANT)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ROLES & ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'parent', 'child');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('safe', 'low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Supabase Auth bilan bog'langan foydalanuvchilar profili)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'parent',
    phone_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. FAMILY LINKS TABLE (Ota-ona va farzand juftlik munosabatlari)
CREATE TABLE IF NOT EXISTS public.family_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pairing_code TEXT UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_family_pair UNIQUE (parent_id, child_id)
);

-- 5. TELEMETRY & ACTIVITY LOGS (Shifrlangan va AI tahlil qilingan telemetriya)
CREATE TABLE IF NOT EXISTS public.telemetry_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    app_package_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    screen_time_seconds INTEGER NOT NULL DEFAULT 0,
    anonymized_summary TEXT, -- PII tozalangan va AI tomonidan tuzilgan xavfsiz tahlil
    risk_rating risk_level NOT NULL DEFAULT 'safe',
    encrypted_payload TEXT NOT NULL, -- AES-256-GCM shifrlangan xom ma'lumotlar
    iv TEXT NOT NULL, -- Initialization Vector
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. E-MAKTAB INTEGRATION CACHE (Shifrlangan token va baholar keshi)
CREATE TABLE IF NOT EXISTS public.school_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    encrypted_auth_token TEXT NOT NULL,
    attendance_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    grades_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AUDIT LOGS (Zero-Trust Audit izi)
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    target_resource TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Faqat o'z profilini ko'rish va yangilash
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Family Links: Faqat bog'langan shaxslar ko'ra oladi
DROP POLICY IF EXISTS "Parents and children can view their links" ON public.family_links;
CREATE POLICY "Parents and children can view their links" 
ON public.family_links FOR SELECT 
USING (auth.uid() = parent_id OR auth.uid() = child_id);

-- Telemetry Logs: Qat'iy Ota-ona / Farzand izolyatsiyasi
DROP POLICY IF EXISTS "Parents can view linked child telemetry" ON public.telemetry_logs;
CREATE POLICY "Parents can view linked child telemetry" 
ON public.telemetry_logs FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.family_links fl 
        WHERE fl.parent_id = auth.uid() 
          AND fl.child_id = public.telemetry_logs.child_id 
          AND fl.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Children can insert own telemetry" ON public.telemetry_logs;
CREATE POLICY "Children can insert own telemetry" 
ON public.telemetry_logs FOR INSERT 
WITH CHECK (
    auth.uid() = child_id
);

DROP POLICY IF EXISTS "Telemetry logs are immutable" ON public.telemetry_logs;
CREATE POLICY "Telemetry logs are immutable" 
ON public.telemetry_logs FOR UPDATE 
USING (FALSE);

-- School Records: Ota-onalar farzandining baholari va davomatini ko'rishi
DROP POLICY IF EXISTS "Parents view child school records" ON public.school_records;
CREATE POLICY "Parents view child school records" 
ON public.school_records FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.family_links fl 
        WHERE fl.parent_id = auth.uid() 
          AND fl.child_id = public.school_records.child_id 
          AND fl.is_active = TRUE
    )
);

-- ============================================================================
-- INDEXING FOR HIGH-PERFORMANCE QUERYING
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_telemetry_child_date ON public.telemetry_logs(child_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_family_parent_child ON public.family_links(parent_id, child_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_school_child ON public.school_records(child_id);

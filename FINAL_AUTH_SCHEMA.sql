-- ============================================================
-- MFL LABS - COMPLETE AUTH SCHEMA RESET
-- Run this in Supabase SQL Editor (safe to re-run)
-- ============================================================

-- 1. Drop old trigger and function if they exist (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Drop and recreate profiles table (clean slate)
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'pending',
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (drop first to prevent duplicate errors)
DROP POLICY IF EXISTS "Admin manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;

-- Super Admin: full access
CREATE POLICY "Admin manage all profiles" ON public.profiles
  FOR ALL
  USING (auth.jwt() ->> 'email' = 'markmallan01@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'markmallan01@gmail.com');

-- Users: read their own profile only
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Service role: full access (for backend API calls)
CREATE POLICY "Service role full access" ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, approved)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN NEW.email = 'markmallan01@gmail.com' THEN 'super_admin' ELSE 'pending' END,
    CASE WHEN NEW.email = 'markmallan01@gmail.com' THEN TRUE ELSE FALSE END
  )
  ON CONFLICT (id) DO NOTHING; -- Don't fail if profile already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Sync any existing auth users who don't have profiles yet
INSERT INTO public.profiles (id, email, approved, role)
SELECT
  id,
  email,
  (email = 'markmallan01@gmail.com') as approved,
  CASE WHEN email = 'markmallan01@gmail.com' THEN 'super_admin' ELSE 'pending' END as role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Confirmation
SELECT 'Schema setup complete. Profiles count: ' || COUNT(*)::text FROM public.profiles;

-- =============================================================================
-- PROYECTO: Control Financiero
-- ARCHIVO: supabase/01_profiles.sql
-- INTEGRANTE 1: Tabla profiles + Trigger de registro automático y sincronización
-- =============================================================================

-- 1. CREACIÓN DE LA TABLA PROFILES
-- Esta tabla extiende los datos del usuario autenticado en auth.users con campos
-- de la lógica de negocio como nombre completo y rol.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'usuario' CHECK (role IN ('admin', 'usuario')),
  created_at timestamp with time zone DEFAULT now()
);

-- 2. SINCRONIZACIÓN DE USUARIOS EXISTENTES
-- Si ya existen usuarios creados previamente en auth.users, los inserta en profiles.
INSERT INTO public.profiles (id, full_name, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  CASE 
    WHEN u.email = 'admin@control.com' THEN 'admin'
    ELSE 'usuario'
  END
FROM auth.users u
ON CONFLICT (id) DO UPDATE 
SET 
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;

-- 3. LIMPIEZA DE PERFILES HUÉRFANOS
-- Elimina filas en profiles cuyos UUIDs no existan en auth.users.
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 4. FUNCIÓN CON SECURITY DEFINER PARA CREACIÓN AUTOMÁTICA
-- SECURITY DEFINER permite que la función se ejecute con privilegios elevados de base de datos,
-- pudiendo escribir en public.profiles cada vez que un usuario se registra en auth.users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email = 'admin@control.com' THEN 'admin'
      ELSE 'usuario'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER ASOCIADO A AUTH.USERS
-- Dispara la función handle_new_user() automáticamente tras cada INSERT en auth.users.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ASIGNACIÓN DE ROLES Y NOMBRES PARA USUARIOS BASE
UPDATE public.profiles
SET full_name = 'Ana Martínez (Admin)', role = 'admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@control.com');

UPDATE public.profiles
SET full_name = 'Carlos López (Cajero)', role = 'usuario'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'usuario@control.com');

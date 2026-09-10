-- =============================================================================
-- PROYECTO: Control Financiero
-- ARCHIVO: supabase/03_rls_policies.sql
-- INTEGRANTE 3: Seguridad con Row Level Security (RLS) + Función is_admin()
-- =============================================================================

-- 1. FUNCIÓN AUXILIAR IS_ADMIN() CON SECURITY DEFINER
-- Verifica si el usuario autenticado (auth.uid()) tiene el rol 'admin' en la tabla profiles.
-- Se usa SECURITY DEFINER para evitar problemas de recursión infinita en las políticas de RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE SEGURIDAD PARA LA TABLA PROFILES
-- Eliminar políticas previas para evitar duplicados
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Los administradores pueden ver todos los perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Los administradores pueden modificar perfiles" ON public.profiles;

-- a) Cada usuario puede leer únicamente su propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- b) Los administradores pueden leer todos los perfiles
CREATE POLICY "Los administradores pueden ver todos los perfiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

-- c) Los administradores pueden actualizar perfiles (por ejemplo para cambiar roles)
CREATE POLICY "Los administradores pueden modificar perfiles"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin());

-- 4. POLÍTICAS DE SEGURIDAD PARA LA TABLA INCOMES (INGRESOS)
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios ingresos" ON public.incomes;
DROP POLICY IF EXISTS "Usuarios pueden registrar sus propios ingresos" ON public.incomes;
DROP POLICY IF EXISTS "Administradores tienen acceso total a ingresos" ON public.incomes;

-- a) El usuario estándar puede consultar únicamente sus propios ingresos
CREATE POLICY "Usuarios pueden ver sus propios ingresos"
  ON public.incomes
  FOR SELECT
  USING (created_by = auth.uid());

-- b) El usuario estándar puede insertar ingresos asignando su propio UUID
CREATE POLICY "Usuarios pueden registrar sus propios ingresos"
  ON public.incomes
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- c) El administrador tiene control total (SELECT, INSERT, UPDATE, DELETE) sobre todos los ingresos
CREATE POLICY "Administradores tienen acceso total a ingresos"
  ON public.incomes
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. POLÍTICAS DE SEGURIDAD PARA LA TABLA EXPENSES (EGRESOS)
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios egresos" ON public.expenses;
DROP POLICY IF EXISTS "Usuarios pueden registrar sus propios egresos" ON public.expenses;
DROP POLICY IF EXISTS "Administradores tienen acceso total a egresos" ON public.expenses;

-- a) El usuario estándar puede consultar únicamente sus propios gastos
CREATE POLICY "Usuarios pueden ver sus propios egresos"
  ON public.expenses
  FOR SELECT
  USING (created_by = auth.uid());

-- b) El usuario estándar puede insertar gastos asignando su propio UUID
CREATE POLICY "Usuarios pueden registrar sus propios egresos"
  ON public.expenses
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- c) El administrador tiene control total (SELECT, INSERT, UPDATE, DELETE) sobre todos los egresos
CREATE POLICY "Administradores tienen acceso total a egresos"
  ON public.expenses
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- INSTRUCCIONES PARA CONVERTIR A UN USUARIO EN ADMIN MANUALMENTE:
-- =============================================================================
-- Ejecuta la siguiente consulta para promover un correo a rol 'admin':
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@control.com');

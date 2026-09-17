-- =============================================================================
-- PROYECTO: Control Financiero
-- ARCHIVO: supabase/02_incomes_expenses.sql
-- INTEGRANTE 2: Tablas incomes y expenses (Movimientos Financieros)
-- =============================================================================

-- 1. TABLA INCOMES (INGRESOS)
-- Registra todas las entradas de dinero, ventas y cobros del sistema.
CREATE TABLE IF NOT EXISTS public.incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                -- Identificador único universal (UUID)
  amount numeric NOT NULL CHECK (amount > 0),                   -- Monto en Lempiras (L.), debe ser positivo
  payment_method text NOT NULL CHECK (payment_method IN ('efectivo', 'tarjeta', 'transferencia')), -- Método de cobro
  description text,                                             -- Concepto o detalle de la transacción
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Usuario/cajero que registró el ingreso
  created_at timestamp with time zone DEFAULT now()             -- Fecha y hora del registro con zona horaria (timestamptz)
);

-- 2. TABLA EXPENSES (EGRESOS / GASTOS)
-- Registra todas las salidas de dinero, compras, servicios o pagos operativos.
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                -- Identificador único universal (UUID)
  category text NOT NULL CHECK (category IN ('servicios', 'insumos', 'salarios', 'mantenimiento', 'otros')), -- Categoría de gasto
  amount numeric NOT NULL CHECK (amount > 0),                   -- Monto del gasto en Lempiras (L.)
  description text,                                             -- Detalle o concepto del gasto
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Usuario que registró el gasto
  created_at timestamp with time zone DEFAULT now()             -- Fecha y hora del registro con zona horaria (timestamptz)
);

-- 3. ÍNDICES DE RENDIMIENTO
-- Aceleran las consultas filtradas por usuario en ambas tablas.
CREATE INDEX IF NOT EXISTS idx_incomes_created_by ON public.incomes(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_incomes_created_at ON public.incomes(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at);

-- 4. MIGRACIÓN PARA BASES DE DATOS EXISTENTES
-- Si ya ejecutaste el script previamente, ejecuta estas dos líneas en el SQL Editor de Supabase:
-- ALTER TABLE public.incomes ALTER COLUMN created_at TYPE timestamp with time zone;
-- ALTER TABLE public.expenses ALTER COLUMN created_at TYPE timestamp with time zone;

import { createClient } from '@supabase/supabase-js';

/**
 * Variables de entorno obtenidas desde Vite (.env / .env.local).
 * - VITE_SUPABASE_URL: URL del proyecto en Supabase (ej: https://xyzcompany.supabase.co)
 * - VITE_SUPABASE_ANON_KEY: Llave pública anónima (segura para exponer en el navegador gracias a RLS).
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Validador para determinar si las credenciales de Supabase están configuradas en el entorno
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('tu-proyecto') &&
  !supabaseAnonKey.includes('tu-anon-key')
);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase no está configurado aún o tiene valores de ejemplo en .env. ' +
    'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env para conectar con la base de datos real.'
  );
}

/**
 * Cliente oficial de Supabase para operaciones de Autenticación y Base de Datos en el Frontend.
 * Usamos un fallback seguro a URL dummy si aún no se ha colocado en .env para evitar que la app crashee al cargar.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

export default supabase;

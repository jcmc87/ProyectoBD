import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthContextType, LoginResult } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Proveedor de Autenticación con soporte de sincronización de sesiones.
 */
const getInitialMockUser = (): User | null => {
  if (typeof window !== 'undefined' && window.location.search.includes('mock=')) {
    const isMockAdmin = window.location.search.includes('mock=admin');
    return {
      id: isMockAdmin ? '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000002',
      email: isMockAdmin ? 'admin@empresa.com' : 'cajero@empresa.com',
      fullName: isMockAdmin ? 'Lic. Roberto Morales (Admin)' : 'Carlos López (Cajero)',
      role: isMockAdmin ? 'admin' : 'usuario',
    };
  }
  return null;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getInitialMockUser);
  const [loading, setLoading] = useState<boolean>(() => !getInitialMockUser());

  /**
   * Obtiene los datos del perfil del usuario autenticado desde la tabla public.profiles en Supabase
   * @param authUserId - UUID del usuario autenticado en auth.users
   * @param email - Correo del usuario
   */
  const fetchUserProfile = async (authUserId: string, email: string): Promise<User> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUserId)
        .single();

      if (error || !profile) {
        console.warn('Perfil no encontrado en public.profiles o restringido por RLS:', error?.message);
        return {
          id: authUserId,
          email,
          fullName: email.split('@')[0] || 'Usuario',
          role: 'usuario',
        };
      }

      return {
        id: profile.id,
        email,
        fullName: profile.full_name || email.split('@')[0] || 'Usuario',
        role: (profile.role as UserRole) || 'usuario',
      };
    } catch (err) {
      console.error('Error al consultar tabla profiles:', err);
      return {
        id: authUserId,
        email,
        fullName: email.split('@')[0] || 'Usuario',
        role: 'usuario',
      };
    }
  };

  /**
   * Efecto para inicializar la sesión activa y suscribirse a cambios de autenticación
   */
  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      try {
        // Soporte para captura de vistas en documentación técnica
        if (typeof window !== 'undefined' && window.location.search.includes('mock=')) {
          const isMockAdmin = window.location.search.includes('mock=admin');
          if (isMounted) {
            setUser({
              id: isMockAdmin ? '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000002',
              email: isMockAdmin ? 'admin@empresa.com' : 'cajero@empresa.com',
              fullName: isMockAdmin ? 'Lic. Roberto Morales' : 'Carlos López',
              role: isMockAdmin ? 'admin' : 'usuario',
            });
            setLoading(false);
          }
          return;
        }

        if (!isSupabaseConfigured) {
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // 1. Obtener la sesión activa de Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id, session.user.email || '');
          if (isMounted) setUser(userProfile);
        } else {
          if (isMounted) setUser(null);
        }
      } catch (err) {
        console.error('Error al inicializar sesión:', err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeSession();

    // 2. Suscribirse a eventos de autenticación de Supabase (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (typeof window !== 'undefined' && window.location.search.includes('mock=')) {
        return;
      }
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id, session.user.email || '');
        if (isMounted) setUser(userProfile);
      } else {
        if (isMounted) setUser(null);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Inicia sesión con correo electrónico y contraseña contra Supabase Auth
   * @param email - Correo electrónico registrado en la base de datos
   * @param password - Contraseña del usuario
   * @returns Promise<LoginResult>
   */
  const loginWithCredentials = async (email: string, password: string): Promise<LoginResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      return {
        success: false,
        message: 'Por favor, ingresa el correo y la contraseña.',
      };
    }

    if (!isSupabaseConfigured) {
      return {
        success: false,
        message: 'Supabase no está configurado. Verifica las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (error) {
        return {
          success: false,
          message: error.message === 'Invalid login credentials'
            ? 'Correo o contraseña incorrectos.'
            : error.message,
        };
      }

      if (data.user) {
        const userProfile = await fetchUserProfile(data.user.id, data.user.email || cleanEmail);
        setUser(userProfile);
        return { success: true, user: userProfile };
      }

      return {
        success: false,
        message: 'No se pudo iniciar sesión. Verifica tus credenciales.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Error de conexión con el servidor de autenticación.',
      };
    }
  };

  /**
   * Cierra la sesión activa en Supabase y limpia el estado local
   */
  const logout = async (): Promise<void> => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setUser(null);
    }
  };

  /**
   * Función de compatibilidad (deshabilitada para roles manuales ya que provienen de la BD)
   */
  const login = (_role: UserRole): void => {
    console.warn('El cambio manual de rol está deshabilitado. La autenticación se realiza exclusivamente contra la base de datos.');
  };

  const isAuthenticated = user !== null;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        loginWithCredentials,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para acceder al contexto de autenticación
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un <AuthProvider>');
  }
  return context;
};

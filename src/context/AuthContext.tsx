import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthContextType, LoginResult } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Cuentas preconfiguradas de respaldo para pruebas visuales en caso de no contar aún con conexión a Supabase
 */
export const MOCK_ACCOUNTS = [
  {
    username: 'admin',
    email: 'admin@control.com',
    password: 'admin123',
    user: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@control.com',
      fullName: 'Ana Martínez (Admin)',
      role: 'admin' as UserRole,
    },
  },
  {
    username: 'usuario',
    email: 'usuario@control.com',
    password: 'user123',
    user: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'usuario@control.com',
      fullName: 'Carlos López (Cajero)',
      role: 'usuario' as UserRole,
    },
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Proveedor de Autenticación integrado con Supabase Auth y la tabla public.profiles.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Obtiene los datos del perfil del usuario autenticado desde la tabla public.profiles
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
        console.warn('No se encontró fila en profiles o RLS restringió la consulta:', error?.message);
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
      console.error('Error al consultar profiles:', err);
      return {
        id: authUserId,
        email,
        fullName: 'Usuario',
        role: 'usuario',
      };
    }
  };

  /**
   * Efecto para inicializar la sesión y escuchar cambios en tiempo real con onAuthStateChange()
   */
  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      try {
        if (!isSupabaseConfigured) {
          // Si no está configurado Supabase, inicializar con cuenta demo por defecto
          if (isMounted) {
            setUser(MOCK_ACCOUNTS[0].user);
            setLoading(false);
          }
          return;
        }

        // 1. Obtener la sesión activa actual de Supabase
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
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeSession();

    // 2. Suscribirse a eventos de autenticación (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
   * Inicia sesión con correo electrónico y contraseña mediante supabase.auth.signInWithPassword()
   * @param identifier - Correo electrónico o nombre de usuario
   * @param password - Contraseña
   * @returns Promise<LoginResult>
   */
  const loginWithCredentials = async (identifier: string, password: string): Promise<LoginResult> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return {
        success: false,
        message: 'Por favor, ingresa el correo y la contraseña.',
      };
    }

    // Convertir usuario plano a email si ingresó solo 'admin' o 'usuario'
    const emailToUse = cleanId.includes('@')
      ? cleanId
      : cleanId === 'admin'
      ? 'admin@control.com'
      : cleanId === 'usuario'
      ? 'usuario@control.com'
      : `${cleanId}@control.com`;

    // Si Supabase está configurado, autenticar contra Supabase Auth
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password: cleanPass,
        });

        if (error) {
          return {
            success: false,
            message: error.message === 'Invalid login credentials'
              ? 'Correo o contraseña incorrectos en Supabase.'
              : error.message,
          };
        }

        if (data.user) {
          const userProfile = await fetchUserProfile(data.user.id, data.user.email || emailToUse);
          setUser(userProfile);
          return { success: true };
        }
      } catch (err: any) {
        return {
          success: false,
          message: err.message || 'Error de conexión con Supabase.',
        };
      }
    }

    // Fallback para modo offline / pruebas visuales si Supabase aún no tiene credenciales en .env
    const account = MOCK_ACCOUNTS.find(
      (acc) =>
        (acc.username.toLowerCase() === cleanId || acc.email.toLowerCase() === emailToUse) &&
        acc.password === cleanPass
    );

    if (account) {
      setUser(account.user);
      return { success: true };
    }

    return {
      success: false,
      message: 'Credenciales inválidas. (Modo pruebas: admin@control.com/admin123 o usuario@control.com/user123)',
    };
  };

  /**
   * Cierra la sesión activa mediante supabase.auth.signOut()
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
   * Conmuta o establece directamente el rol de usuario para pruebas rápidas
   * @param role - 'admin' | 'usuario'
   */
  const login = (role: UserRole): void => {
    const account = MOCK_ACCOUNTS.find((acc) => acc.user.role === role);
    if (account) {
      setUser(account.user);
    }
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

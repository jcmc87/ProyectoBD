import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, AuthContextType, LoginResult } from '../types';

/**
 * Estructura de credenciales simuladas para el entorno de pruebas
 */
export interface MockCredential {
  user: User;
  username: string;
  password: string;
}

/**
 * Cuentas y credenciales predefinidas para Administrador y Usuario:
 * 
 * 1. ADMINISTRADOR:
 *    - Usuario / Correo: admin@control.com (o 'admin')
 *    - Contraseña:       admin123
 *    - Rol:              admin
 * 
 * 2. USUARIO ESTÁNDAR:
 *    - Usuario / Correo: usuario@control.com (o 'usuario' / 'carlos')
 *    - Contraseña:       user123
 *    - Rol:              usuario
 */
export const MOCK_ACCOUNTS: MockCredential[] = [
  {
    username: 'admin',
    password: 'admin123',
    user: {
      id: 'usr-admin-001',
      email: 'admin@control.com',
      fullName: 'Ana Martínez (Admin)',
      role: 'admin',
    },
  },
  {
    username: 'usuario',
    password: 'user123',
    user: {
      id: 'usr-standard-002',
      email: 'usuario@control.com',
      fullName: 'Carlos López (Cajero)',
      role: 'usuario',
    },
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Proveedor de Autenticación en Memoria.
 * Gestiona el inicio de sesión por credenciales y roles.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Inicializamos la sesión con el Administrador por comodidad durante el desarrollo
  const [user, setUser] = useState<User | null>(MOCK_ACCOUNTS[0].user);

  /**
   * Inicia sesión directa mediante el rol
   * @param role - Rol 'admin' | 'usuario'
   */
  const login = (role: UserRole): void => {
    const account = MOCK_ACCOUNTS.find((acc) => acc.user.role === role);
    if (account) {
      setUser(account.user);
    }
  };

  /**
   * Inicia sesión validando usuario/correo y contraseña
   * @param identifier - Correo o nombre de usuario
   * @param password - Contraseña ingresada
   * @returns LoginResult ({ success: boolean, message?: string })
   */
  const loginWithCredentials = (identifier: string, password: string): LoginResult => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return {
        success: false,
        message: 'Por favor completa todos los campos.',
      };
    }

    // Busca coincidencia en correo o nombre de usuario
    const account = MOCK_ACCOUNTS.find(
      (acc) =>
        (acc.username.toLowerCase() === cleanId || acc.user.email.toLowerCase() === cleanId) &&
        acc.password === cleanPass
    );

    if (!account) {
      return {
        success: false,
        message: 'Correo/Usuario o contraseña incorrectos.',
      };
    }

    // Credenciales correctas: establecer usuario
    setUser(account.user);
    return {
      success: true,
    };
  };

  /**
   * Cierra la sesión activa actual
   */
  const logout = (): void => {
    setUser(null);
  };

  const isAuthenticated = user !== null;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
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
 * Hook de acceso al contexto de autenticación
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un <AuthProvider>');
  }
  return context;
};

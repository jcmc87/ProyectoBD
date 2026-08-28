import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Proveedor de Tema (Modo Claro / Modo Oscuro)
 * Guarda la preferencia en localStorage y sincroniza la clase 'dark' en el elemento raíz del DOM.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    // 1. Verificar si hay preferencia guardada en localStorage
    const saved = localStorage.getItem('app_theme') as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // 2. Verificar preferencia del sistema operativo
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  /**
   * Sincroniza la clase 'dark' en el <html> y persiste en localStorage
   */
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  /**
   * Alterna entre modo claro y modo oscuro
   */
  const toggleTheme = (): void => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook para consumir el contexto de tema
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser utilizado dentro de un <ThemeProvider>');
  }
  return context;
};

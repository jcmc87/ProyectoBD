import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/**
 * Componente de Barra de Navegación Superior (BarraNavegacion).
 * - Enlaces directos a: Ingresos, Egresos, Historial/Cuadre y Panel Admin (solo visible para Administradores).
 * - Conmutador interactivo de Modo Claro / Modo Oscuro.
 * - Conmutador rápido de rol para pruebas.
 * - Botón de cierre de sesión.
 */
export const BarraNavegacion: React.FC = () => {
  const { user, isAdmin, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  /**
   * Cierra la sesión activa y redirige al usuario a la pantalla de Login.
   */
  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  /**
   * Alterna el rol de prueba entre 'admin' y 'usuario' para verificar permisos inmediatamente.
   */
  const handleToggleRole = (): void => {
    login(isAdmin ? 'usuario' : 'admin');
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Título y Enlaces de Navegación */}
        <div className="flex items-center space-x-6">
          <span className="font-bold text-slate-900 dark:text-white tracking-tight text-sm sm:text-base">
            Control Financiero
          </span>

          <nav className="flex items-center space-x-1 sm:space-x-2">
            <NavLink
              to="/ingresos"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              Ingresos
            </NavLink>

            <NavLink
              to="/egresos"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              Egresos
            </NavLink>

            <NavLink
              to="/cuadre"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              Historial / Cuadre
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-900 text-white dark:bg-purple-800 dark:text-white font-semibold'
                      : 'text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-medium'
                  }`
                }
              >
                Panel Admin
              </NavLink>
            )}
          </nav>
        </div>

        {/* Acciones: Modo Oscuro, Switch de Rol y Logout */}
        <div className="flex items-center space-x-2 text-xs">
          {/* Botón de alternar tema claro / oscuro */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Switch de rol para pruebas */}
          <button
            onClick={handleToggleRole}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 transition-colors"
            title="Haz clic para cambiar el rol y probar permisos"
          >
            Rol: <strong className="capitalize text-slate-900 dark:text-white">{user?.role}</strong> (cambiar)
          </button>

          {/* Botón de cierre de sesión */}
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export const Navbar = BarraNavegacion;

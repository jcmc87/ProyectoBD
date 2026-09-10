import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  MinusCircle, 
  History, 
  LayoutDashboard, 
  FileText, 
  TrendingDown, 
  LogOut, 
  Sun, 
  Moon,
  Wallet,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/**
 * Componente Layout Principal (src/components/Layout.tsx).
 * - Barra de navegación responsive superior adaptada a Modo Claro y Oscuro.
 * - Muestra el nombre completo del usuario y badge con su rol ('Admin' o 'Usuario').
 * - Renderiza enlaces de navegación dinámicos según el rol autenticado:
 *   - Usuario: "Registrar Ingreso", "Registrar Egreso", "Mi Historial".
 *   - Admin: "Dashboard", "Gestión de Ingresos", "Gestión de Egresos".
 * - Botón para cerrar sesión y selector de tema visual (Sol / Luna).
 */
export const Layout: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  /**
   * Cierra la sesión activa y redirige a la vista de login.
   */
  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Barra de Navegación Superior */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo y Nombre de la Aplicación */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base block leading-tight">
                Control Financiero
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                {isAdmin ? 'Módulo Administrativo' : 'Punto de Venta / Caja'}
              </span>
            </div>
          </div>

          {/* Menú de Enlaces Dinámicos según el Rol */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* VISTAS PARA EL USUARIO ESTÁNDAR */}
            {!isAdmin ? (
              <>
                <NavLink
                  to="/user/income"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Registrar Ingreso</span>
                </NavLink>

                <NavLink
                  to="/user/expense"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>Registrar Egreso</span>
                </NavLink>

                <NavLink
                  to="/user/history"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <History className="w-4 h-4" />
                  <span>Mi Historial / Cuadre</span>
                </NavLink>
              </>
            ) : (
              /* VISTAS PARA EL ADMINISTRADOR */
              <>
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-purple-900 text-white dark:bg-purple-800 shadow-xs'
                        : 'text-purple-800 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>

                <NavLink
                  to="/admin/incomes"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <FileText className="w-4 h-4" />
                  <span>Gestión de Ingresos</span>
                </NavLink>

                <NavLink
                  to="/admin/expenses"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>Gestión de Egresos</span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Perfil del Usuario, Botón de Tema y Cierre de Sesión */}
          <div className="flex items-center space-x-3">
            
            {/* Alternador de Tema Claro / Oscuro */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Badge de Rol y Usuario en Sesión */}
            <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 pl-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user?.fullName || 'Usuario'}
                </p>
                {user?.email && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                    {user.email}
                  </p>
                )}
              </div>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                }`}
              >
                {isAdmin ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                )}
                {isAdmin ? 'Admin' : 'Usuario'}
              </span>
            </div>

            {/* Botón de Cerrar Sesión */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-semibold hidden lg:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Barra de Navegación Móvil Inferior */}
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 px-3 py-2 flex items-center justify-around overflow-x-auto text-[11px]">
          {!isAdmin ? (
            <>
              <NavLink
                to="/user/income"
                className={({ isActive }) =>
                  `px-2.5 py-1 rounded font-medium ${isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300'}`
                }
              >
                + Ingreso
              </NavLink>
              <NavLink
                to="/user/expense"
                className={({ isActive }) =>
                  `px-2.5 py-1 rounded font-medium ${isActive ? 'bg-rose-600 text-white' : 'text-slate-600 dark:text-slate-300'}`
                }
              >
                - Egreso
              </NavLink>
              <NavLink
                to="/user/history"
                className={({ isActive }) =>
                  `px-2.5 py-1 rounded font-medium ${isActive ? 'bg-slate-900 text-white dark:bg-slate-800' : 'text-slate-600 dark:text-slate-300'}`
                }
              >
                Historial
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) =>
                  `px-2.5 py-1 rounded font-medium ${isActive ? 'bg-purple-900 text-white' : 'text-slate-600 dark:text-slate-300'}`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/incomes"
                className={({ isActive }) =>
                  `px-2.5 py-1 rounded font-medium ${isActive ? 'bg-emerald-700 text-white' : 'text-slate-600 dark:text-slate-300'}`
                }
              >
                Ingresos
              </NavLink>
              <NavLink
                to="/admin/expenses"
                className={({ isActive }) =>
                  `px-2.5 py-1 rounded font-medium ${isActive ? 'bg-rose-700 text-white' : 'text-slate-600 dark:text-slate-300'}`
                }
              >
                Egresos
              </NavLink>
            </>
          )}
        </div>
      </header>

      {/* Contenedor Central de Contenido Dinámico */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

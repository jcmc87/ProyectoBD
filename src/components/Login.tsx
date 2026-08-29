import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/**
 * Componente de Inicio de Sesión (Login).
 * - Formulario de acceso con correo/usuario y contraseña.
 * - Botones de acceso rápido "Entrar como Admin" y "Entrar como Usuario" para pruebas inmediatas.
 * - Conmutador de tema Claro / Oscuro.
 * - Redirección inteligente según el rol del usuario ('admin' a Dashboard, 'usuario' a Registrar Ingreso).
 */
export const Login: React.FC = () => {
  const { loginWithCredentials, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Estados locales del formulario
  const [identifier, setIdentifier] = useState<string>('admin@control.com');
  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Maneja el envío del formulario de login.
   * Valida credenciales contra las cuentas mock en memoria.
   * @param e - Evento de submit del formulario
   */
  const handleFormSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = loginWithCredentials(identifier, password);
      setIsLoading(false);

      if (result.success) {
        // Redirigir según rol
        const account = identifier.includes('admin') || identifier === 'admin' ? '/admin/dashboard' : '/user/income';
        navigate(account);
      } else {
        setErrorMessage(result.message || 'Credenciales inválidas.');
      }
    }, 150);
  };

  /**
   * Autocompleta los campos de texto con las credenciales seleccionadas.
   * @param email - Correo o usuario a precargar
   * @param pass - Contraseña a precargar
   */
  const handleQuickFill = (email: string, pass: string): void => {
    setIdentifier(email);
    setPassword(pass);
    setErrorMessage(null);
  };

  /**
   * Acceso directo de un clic autenticando el rol seleccionado.
   * @param role - Rol 'admin' | 'usuario'
   */
  const handleDirectLogin = (role: 'admin' | 'usuario'): void => {
    login(role);
    navigate(role === 'admin' ? '/admin/dashboard' : '/user/income');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative transition-colors duration-200">
      
      {/* Botón flotante para cambiar tema en el Login */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>
      </div>

      <div className="max-w-md w-full space-y-6">
        
        {/* Cabecera / Marca del Sistema */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white shadow-sm mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Control Financiero
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sistema de Ingresos, Egresos y Cuadre de Caja
          </p>
        </div>

        {/* Tarjeta Principal de Login */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Iniciar Sesión
          </h2>

          {/* Alerta de Error */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Campo: Usuario / Correo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Usuario o Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="admin@control.com o usuario"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 focus:border-slate-800 dark:focus:border-slate-600 transition-all"
                />
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 focus:border-slate-800 dark:focus:border-slate-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botón de Ingreso */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 active:bg-black text-white font-medium text-sm rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {isLoading ? (
                <span>Verificando...</span>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Tarjeta de Acceso Rápido y Cuentas Demo */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
              Acceso Rápido para Pruebas
            </span>
            <span className="text-[10px] text-slate-400">Sin base de datos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Cuenta 1: Administrador */}
            <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
                  Admin
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@control.com', 'admin123')}
                  className="text-[10px] text-purple-700 dark:text-purple-400 underline hover:text-purple-900"
                >
                  Rellenar
                </button>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">admin@control.com</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Clave: <strong>admin123</strong></p>
              <button
                type="button"
                onClick={() => handleDirectLogin('admin')}
                className="w-full mt-1.5 py-1.5 bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded text-[11px] font-semibold transition-colors"
              >
                Entrar como Admin
              </button>
            </div>

            {/* Cuenta 2: Usuario Estándar */}
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  Usuario
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickFill('usuario@control.com', 'user123')}
                  className="text-[10px] text-blue-700 dark:text-blue-400 underline hover:text-blue-900"
                >
                  Rellenar
                </button>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">usuario@control.com</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Clave: <strong>user123</strong></p>
              <button
                type="button"
                onClick={() => handleDirectLogin('usuario')}
                className="w-full mt-1.5 py-1.5 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded text-[11px] font-semibold transition-colors"
              >
                Entrar como Usuario
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;

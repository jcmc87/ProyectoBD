import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Pantalla de Acceso No Autorizado (PantallaNoAutorizado / Error HTTP 403).
 * Se presenta cuando un usuario con rol 'usuario' intenta acceder a rutas protegidas para 'admin'.
 * Ofrece botones de acción para cambiar rápidamente al perfil de Administrador o regresar al flujo principal.
 */
export const PantallaNoAutorizado: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto my-12 space-y-4 transition-colors">
      <h1 className="text-lg font-bold text-slate-900 dark:text-white">Acceso No Autorizado</h1>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Esta sección requiere permisos exclusivos de Administrador.
      </p>
      <div className="flex justify-center space-x-2 pt-2">
        <button
          onClick={() => login('admin')}
          className="px-3 py-1.5 bg-slate-900 dark:bg-purple-600 hover:bg-slate-800 dark:hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors"
        >
          Cambiar a perfil Admin
        </button>
        <Link
          to="/ingresos"
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Ir a Ingresos
        </Link>
      </div>
    </div>
  );
};

export const UnauthorizedPage = PantallaNoAutorizado;

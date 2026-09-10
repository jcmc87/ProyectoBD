import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Pantalla de Acceso No Autorizado (PantallaNoAutorizado / Error HTTP 403).
 * Se presenta cuando un usuario con rol 'usuario' intenta acceder a rutas protegidas para 'admin'.
 */
export const PantallaNoAutorizado: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto my-12 space-y-4 transition-colors">
      <h1 className="text-lg font-bold text-slate-900 dark:text-white">Acceso No Autorizado</h1>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Esta sección requiere permisos exclusivos de Administrador.
      </p>
      <div className="flex justify-center pt-2">
        <Link
          to="/"
          className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
        >
          Volver a mi Panel
        </Link>
      </div>
    </div>
  );
};

export const UnauthorizedPage = PantallaNoAutorizado;

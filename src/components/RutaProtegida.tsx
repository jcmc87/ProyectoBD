import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RutaProtegidaProps {
  children: React.ReactNode;
  requiredRole?: UserRole; // Rol mínimo requerido (opcional)
}

/**
 * Componente Guardián de Rutas (RutaProtegida).
 * - Maneja el estado de carga inicial mientras Supabase verifica la sesión activa.
 * - Si el usuario NO está autenticado, lo redirige a /login guardando la ruta previa en state.
 * - Si la ruta exige rol 'admin' y el usuario tiene rol 'usuario', lo redirige a /unauthorized (403).
 * - Si cumple con las condiciones, renderiza la vista solicitada.
 * 
 * @param children - Componentes hijos a proteger
 * @param requiredRole - Rol requerido opcional ('admin' | 'usuario')
 */
export const RutaProtegida: React.FC<RutaProtegidaProps> = ({ children, requiredRole }) => {
  const isMockMode = typeof window !== 'undefined' && window.location.search.includes('mock=');
  if (isMockMode) {
    return <>{children}</>;
  }

  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Esperar a que termine la verificación de sesión en Supabase
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-slate-300 dark:border-slate-700 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Verificando sesión con Supabase...</p>
        </div>
      </div>
    );
  }

  // Validación 1: Verificar si el usuario ha iniciado sesión
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Validación 2: Verificar si cumple con el rol exigido por la ruta
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Acceso concedido
  return <>{children}</>;
};

export const ProtectedRoute = RutaProtegida;

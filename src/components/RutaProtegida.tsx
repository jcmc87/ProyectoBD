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
 * - Si el usuario NO está autenticado, lo redirige a /login guardando la ruta previa en state.
 * - Si la ruta exige rol 'admin' y el usuario tiene rol 'usuario', lo redirige a /unauthorized (403).
 * - Si cumple con las condiciones, renderiza la vista solicitada.
 * 
 * @param children - Componentes hijos a proteger
 * @param requiredRole - Rol requerido opcional ('admin' | 'usuario')
 */
export const RutaProtegida: React.FC<RutaProtegidaProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

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

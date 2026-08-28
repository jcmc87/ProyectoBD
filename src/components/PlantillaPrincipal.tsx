import React from 'react';
import { Outlet } from 'react-router-dom';
import { BarraNavegacion } from './BarraNavegacion';

/**
 * Componente de Plantilla Principal (PlantillaPrincipal / Layout).
 * Estructura la arquitectura visual compartida para todas las rutas autenticadas:
 * - Incluye la Barra de Navegación superior fija con conmutador de tema y rol.
 * - Proporciona un contenedor centralizado y responsivo (`max-w-5xl`) para renderizar las vistas hijas a través del `<Outlet />`.
 * - Aplica estilos adaptables a Modo Claro y Modo Oscuro.
 */
export const PlantillaPrincipal: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <BarraNavegacion />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export const MainLayout = PlantillaPrincipal;

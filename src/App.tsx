import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { RutaProtegida } from './components/RutaProtegida';
import { PlantillaPrincipal } from './components/PlantillaPrincipal';
import { PantallaLogin } from './pages/PantallaLogin';
import { PantallaIngresos } from './pages/PantallaIngresos';
import { PantallaEgresos } from './pages/PantallaEgresos';
import { PantallaCuadreCaja } from './pages/PantallaCuadreCaja';
import { PantallaAdministrador } from './pages/PantallaAdministrador';
import { PantallaNoAutorizado } from './pages/PantallaNoAutorizado';

/**
 * Componente Raíz de la Aplicación (App).
 * Configura la jerarquía de proveedores de contexto y el árbol de rutas:
 * 1. `ThemeProvider`: Manejo global de tema Claro / Oscuro con persistencia.
 * 2. `BrowserRouter`: Enrutamiento del cliente SPA.
 * 3. `AuthProvider`: Autenticación, sesión activa y verificación de roles.
 * 4. `FinanceProvider`: Gestión del estado financiero en memoria (ingresos, egresos y cuadre).
 * 5. `Routes`: Definición de rutas públicas (/login), privadas (/ingresos, /egresos, /cuadre) y administrativas (/admin).
 */
export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <FinanceProvider>
            <Routes>
              {/* Ruta pública: Inicio de sesión */}
              <Route path="/login" element={<PantallaLogin />} />

              {/* Rutas protegidas que requieren sesión activa y comparten PlantillaPrincipal */}
              <Route
                path="/"
                element={
                  <RutaProtegida>
                    <PlantillaPrincipal />
                  </RutaProtegida>
                }
              >
                {/* Redirección automática de la raíz a la pantalla de Ingresos */}
                <Route index element={<Navigate to="/ingresos" replace />} />

                {/* Pantallas operativas accesibles para cualquier usuario autenticado */}
                <Route path="ingresos" element={<PantallaIngresos />} />
                <Route path="egresos" element={<PantallaEgresos />} />
                <Route path="cuadre" element={<PantallaCuadreCaja />} />

                {/* Pantalla exclusiva para administradores */}
                <Route
                  path="admin"
                  element={
                    <RutaProtegida requiredRole="admin">
                      <PantallaAdministrador />
                    </RutaProtegida>
                  }
                />

                {/* Pantalla de aviso de falta de permisos (403) */}
                <Route path="unauthorized" element={<PantallaNoAutorizado />} />
              </Route>

              {/* Redirección para cualquier ruta no mapeada */}
              <Route path="*" element={<Navigate to="/ingresos" replace />} />
            </Routes>
          </FinanceProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

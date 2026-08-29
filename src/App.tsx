import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { RutaProtegida } from './components/RutaProtegida';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { RegisterIncome } from './pages/user/RegisterIncome';
import { RegisterExpense } from './pages/user/RegisterExpense';
import { MyHistory } from './pages/user/MyHistory';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminIncomes } from './pages/admin/AdminIncomes';
import { AdminExpenses } from './pages/admin/AdminExpenses';
import { PantallaNoAutorizado } from './pages/PantallaNoAutorizado';

/**
 * Componente de redirección inteligente en la raíz:
 * - Si es Admin -> /admin/dashboard
 * - Si es Usuario -> /user/income
 */
const RootRedirect: React.FC = () => {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? '/admin/dashboard' : '/user/income'} replace />;
};

/**
 * Enrutador Principal de la Aplicación (App.tsx).
 * Estructurado en base a las especificaciones del Paso 2, Paso 3 y Paso 4.
 */
export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <FinanceProvider>
            <Routes>
              {/* 1. Paso 2: Pantalla de Login */}
              <Route path="/login" element={<Login />} />

              {/* 2. Paso 2: Layout Principal Protegido con Navegación Dinámica */}
              <Route
                path="/"
                element={
                  <RutaProtegida>
                    <Layout />
                  </RutaProtegida>
                }
              >
                {/* Redirección inteligente de raíz */}
                <Route index element={<RootRedirect />} />

                {/* 3. Paso 3: Vistas del Usuario (Operador / Empleado) */}
                <Route path="user/income" element={<RegisterIncome />} />
                <Route path="user/expense" element={<RegisterExpense />} />
                <Route path="user/history" element={<MyHistory />} />

                {/* 4. Paso 4: Vistas del Administrador (Dashboard y Gestión) */}
                <Route
                  path="admin/dashboard"
                  element={
                    <RutaProtegida requiredRole="admin">
                      <AdminDashboard />
                    </RutaProtegida>
                  }
                />
                <Route
                  path="admin/incomes"
                  element={
                    <RutaProtegida requiredRole="admin">
                      <AdminIncomes />
                    </RutaProtegida>
                  }
                />
                <Route
                  path="admin/expenses"
                  element={
                    <RutaProtegida requiredRole="admin">
                      <AdminExpenses />
                    </RutaProtegida>
                  }
                />

                {/* Alias de compatibilidad */}
                <Route path="ingresos" element={<Navigate to="/user/income" replace />} />
                <Route path="egresos" element={<Navigate to="/user/expense" replace />} />
                <Route path="cuadre" element={<Navigate to="/user/history" replace />} />
                <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="unauthorized" element={<PantallaNoAutorizado />} />
              </Route>

              {/* Redirección fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </FinanceProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

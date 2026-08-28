import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Banknote, 
  CreditCard, 
  ArrowLeftRight, 
  Trash2, 
  Filter 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';

/**
 * Tipos de filtros temporales disponibles para el Administrador
 */
type PeriodFilter = 'hoy' | 'semana' | 'mes' | 'ano' | 'personalizado' | 'todos';

/**
 * Formateador de moneda en Lempiras (L.)
 * @param amount - Monto numérico
 * @returns string - Monto formateado (ej: L. 1,250.00)
 */
const formatMoney = (amount: number): string => {
  return `L. ${Number(amount).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Formateador de fecha legible para auditoría
 * @param dateStr - String de fecha ISO
 * @returns string - Fecha y hora formateada en español
 */
const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('es-HN')} ${d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return dateStr;
  }
};

/**
 * Pantalla de Administración y Reportes (PantallaAdministrador).
 * - Exclusiva para el rol 'admin'.
 * - Permite auditar ingresos y egresos por: Hoy, Semana, Mes, Año o Rango Personalizado.
 * - Recalcula dinámicamente el arqueo por canal de cobro (Efectivo, Tarjeta, Transferencia) y utilidad neta.
 * - Permite eliminar registros con privilegios administrativos.
 */
export const PantallaAdministrador: React.FC = () => {
  const { user } = useAuth();
  const { 
    incomes, 
    expenses, 
    deleteIncome, 
    deleteExpense 
  } = useFinance();

  // Estados locales para la gestión de filtros y pestañas
  const [period, setPeriod] = useState<PeriodFilter>('todos');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'supervision' | 'ingresos' | 'egresos' | 'usuarios'>('supervision');

  /**
   * Verifica si la fecha de un registro se encuentra dentro del periodo temporal seleccionado.
   * @param dateStr - Fecha ISO 8601 del movimiento
   * @returns boolean - true si coincide con el filtro activo
   */
  const isDateInPeriod = (dateStr: string): boolean => {
    const itemDate = new Date(dateStr);
    const now = new Date();

    switch (period) {
      case 'hoy': {
        return (
          itemDate.getFullYear() === now.getFullYear() &&
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getDate() === now.getDate()
        );
      }
      case 'semana': {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return itemDate >= sevenDaysAgo && itemDate <= now;
      }
      case 'mes': {
        return (
          itemDate.getFullYear() === now.getFullYear() &&
          itemDate.getMonth() === now.getMonth()
        );
      }
      case 'ano': {
        return itemDate.getFullYear() === now.getFullYear();
      }
      case 'personalizado': {
        if (!startDate && !endDate) return true;
        const start = startDate ? new Date(`${startDate}T00:00:00`) : new Date(0);
        const end = endDate ? new Date(`${endDate}T23:59:59`) : new Date(8640000000000000);
        return itemDate >= start && itemDate <= end;
      }
      case 'todos':
      default:
        return true;
    }
  };

  /** Lista de ingresos filtrados según el periodo activo */
  const filteredIncomes = useMemo(() => {
    return incomes.filter((item) => isDateInPeriod(item.createdAt));
  }, [incomes, period, startDate, endDate]);

  /** Lista de egresos filtrados según el periodo activo */
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => isDateInPeriod(item.createdAt));
  }, [expenses, period, startDate, endDate]);

  /** Total monetario de ingresos en el periodo */
  const periodTotalIncome = useMemo(() => {
    return filteredIncomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredIncomes]);

  /** Total monetario de egresos en el periodo */
  const periodTotalExpense = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredExpenses]);

  /** Balance neto (Utilidad) del periodo: Ingresos - Egresos */
  const periodNetBalance = useMemo(() => {
    return periodTotalIncome - periodTotalExpense;
  }, [periodTotalIncome, periodTotalExpense]);

  /** Recaudación en efectivo durante el periodo seleccionado */
  const periodCash = useMemo(() => {
    return filteredIncomes
      .filter((item) => item.paymentMethod === 'efectivo')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredIncomes]);

  /** Recaudación por tarjeta durante el periodo seleccionado */
  const periodCard = useMemo(() => {
    return filteredIncomes
      .filter((item) => item.paymentMethod === 'tarjeta')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredIncomes]);

  /** Recaudación por transferencia durante el periodo seleccionado */
  const periodTransfer = useMemo(() => {
    return filteredIncomes
      .filter((item) => item.paymentMethod === 'transferencia')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredIncomes]);

  /**
   * Genera el texto legible del periodo activo para títulos y subtítulos.
   * @returns string
   */
  const getPeriodLabel = (): string => {
    switch (period) {
      case 'hoy': return 'del Día de Hoy';
      case 'semana': return 'de Esta Semana (Últimos 7 días)';
      case 'mes': return 'de Este Mes';
      case 'ano': return 'de Este Año';
      case 'personalizado': return `del Rango ${startDate || 'Inicio'} al ${endDate || 'Hoy'}`;
      default: return 'Histórico Total';
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado del Administrador */}
      <div className="bg-slate-900 dark:bg-slate-900 text-white p-5 rounded-lg border border-transparent dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-800 rounded-md">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Panel de Administración y Reportes</h1>
            <p className="text-xs text-slate-400">
              Supervisión de finanzas por periodos de tiempo. Sesión: <strong className="text-white">{user?.fullName}</strong>
            </p>
          </div>
        </div>

        <span className="self-start sm:self-auto px-2.5 py-1 bg-purple-900/60 text-purple-200 border border-purple-700 text-xs font-semibold rounded">
          Rol: ADMINISTRADOR
        </span>
      </div>

      {/* BARRA DE FILTROS TEMPORALES */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Filtrar por Periodo:</span>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              onClick={() => setPeriod('hoy')}
              className={`px-3 py-1.5 rounded transition-colors ${
                period === 'hoy'
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setPeriod('semana')}
              className={`px-3 py-1.5 rounded transition-colors ${
                period === 'semana'
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => setPeriod('mes')}
              className={`px-3 py-1.5 rounded transition-colors ${
                period === 'mes'
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => setPeriod('ano')}
              className={`px-3 py-1.5 rounded transition-colors ${
                period === 'ano'
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Este Año
            </button>
            <button
              onClick={() => setPeriod('personalizado')}
              className={`px-3 py-1.5 rounded transition-colors ${
                period === 'personalizado'
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Periodo Específico
            </button>
            <button
              onClick={() => setPeriod('todos')}
              className={`px-3 py-1.5 rounded transition-colors ${
                period === 'todos'
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Todos los Tiempos
            </button>
          </div>
        </div>

        {/* Selector de Rango Personalizado */}
        {period === 'personalizado' && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Desde:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-800 dark:focus:border-slate-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Hasta:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-800 dark:focus:border-slate-500"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline ml-2"
              >
                Limpiar fechas
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pestañas de Vista Interna */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('supervision')}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
            activeTab === 'supervision'
              ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          Supervisión {getPeriodLabel()}
        </button>
        <button
          onClick={() => setActiveTab('ingresos')}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
            activeTab === 'ingresos'
              ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          Ingresos ({filteredIncomes.length})
        </button>
        <button
          onClick={() => setActiveTab('egresos')}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
            activeTab === 'egresos'
              ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          Egresos ({filteredExpenses.length})
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
            activeTab === 'usuarios'
              ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          Usuarios
        </button>
      </div>

      {/* CONTENIDO 1: SUPERVISIÓN DEL PERIODO */}
      {activeTab === 'supervision' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Ingresos {getPeriodLabel()}
              </span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatMoney(periodTotalIncome)}</p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{filteredIncomes.length} movimientos</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Egresos {getPeriodLabel()}
              </span>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{formatMoney(periodTotalExpense)}</p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{filteredExpenses.length} gastos</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border-2 border-slate-900 dark:border-slate-100 transition-colors">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                Balance Neto {getPeriodLabel()}
              </span>
              <p className={`text-2xl font-bold mt-1 ${periodNetBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatMoney(periodNetBalance)}
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {periodNetBalance >= 0 ? 'Superávit en el periodo' : 'Déficit en el periodo'}
              </span>
            </div>
          </div>

          {/* Desglose por Tipo de Venta */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Desglose de Ingresos por Tipo de Venta {getPeriodLabel()}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded transition-colors">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 mb-1">
                  <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold">Efectivo Físico</span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white">{formatMoney(periodCash)}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded transition-colors">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 mb-1">
                  <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold">Terminal Tarjetas</span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white">{formatMoney(periodCard)}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded transition-colors">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 mb-1">
                  <ArrowLeftRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold">Transferencias Bancarias</span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white">{formatMoney(periodTransfer)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO 2: TABLA DE INGRESOS */}
      {activeTab === 'ingresos' && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ingresos registrados {getPeriodLabel()} (Total: {formatMoney(periodTotalIncome)})
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Registrado Por</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredIncomes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                    No hay ingresos en el periodo seleccionado.
                  </td>
                </tr>
              ) : (
                filteredIncomes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{item.description}</td>
                    <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-400 text-xs">{item.paymentMethod}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">{formatDate(item.createdAt)}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">{item.userName}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">+{formatMoney(item.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm('¿Eliminar registro como administrador?')) deleteIncome(item.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CONTENIDO 3: TABLA DE EGRESOS */}
      {activeTab === 'egresos' && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Egresos registrados {getPeriodLabel()} (Total: {formatMoney(periodTotalExpense)})
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Registrado Por</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                    No hay egresos en el periodo seleccionado.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{item.description}</td>
                    <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-400 text-xs">{item.category}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">{formatDate(item.createdAt)}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">{item.userName}</td>
                    <td className="py-3 px-4 text-right font-semibold text-rose-600 dark:text-rose-400">-{formatMoney(item.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm('¿Eliminar registro como administrador?')) deleteExpense(item.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CONTENIDO 4: USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3 transition-colors">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span>Usuarios y Roles Habilitados</span>
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Ana Martínez</p>
                <p className="text-slate-500 dark:text-slate-400">admin@control.com</p>
              </div>
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold rounded">ADMIN</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Carlos López</p>
                <p className="text-slate-500 dark:text-slate-400">usuario@control.com</p>
              </div>
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold rounded">USUARIO</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

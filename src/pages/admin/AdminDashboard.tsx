import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Banknote, 
  CreditCard, 
  ArrowLeftRight, 
  Tag, 
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { TransactionItem } from '../../types';

type DashboardPeriod = 'hoy' | 'semana' | 'mes' | 'todos' | 'personalizado';

/**
 * Formateador de moneda en Lempiras (L.)
 */
const formatMoney = (amount: number): string => {
  return `L. ${Number(amount).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Formateador de fecha legible
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
 * Vista de Panel de Control del Administrador (src/pages/admin/AdminDashboard.tsx).
 * - 3 tarjetas de resumen principales: Total Ingresos, Total Egresos y Balance Neto.
 * - Filtros de fecha: "Hoy", "Esta Semana", "Este Mes", "Total Histórico" y Rango Personalizado.
 * - Desglose visual por métodos de pago y categorías de gastos.
 * - Lista de las últimas 5 transacciones registradas en el sistema.
 */
export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { incomes, expenses } = useFinance();

  const [period, setPeriod] = useState<DashboardPeriod>('mes');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  /**
   * Verifica si una fecha cae en el periodo activo
   */
  const isDateInPeriod = (dateStr: string): boolean => {
    const itemDate = new Date(dateStr);
    const now = new Date();

    switch (period) {
      case 'hoy':
        return (
          itemDate.getFullYear() === now.getFullYear() &&
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getDate() === now.getDate()
        );
      case 'semana': {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        return itemDate >= weekAgo && itemDate <= now;
      }
      case 'mes':
        return (
          itemDate.getFullYear() === now.getFullYear() &&
          itemDate.getMonth() === now.getMonth()
        );
      case 'personalizado': {
        if (!startDate && !endDate) return true;
        const year = itemDate.getFullYear();
        const month = String(itemDate.getMonth() + 1).padStart(2, '0');
        const day = String(itemDate.getDate()).padStart(2, '0');
        const itemLocalDate = `${year}-${month}-${day}`;
        if (startDate && itemLocalDate < startDate) return false;
        if (endDate && itemLocalDate > endDate) return false;
        return true;
      }
      case 'todos':
      default:
        return true;
    }
  };

  /** Ingresos filtrados por periodo */
  const filteredIncomes = useMemo(() => {
    return incomes.filter((item) => isDateInPeriod(item.createdAt));
  }, [incomes, period, startDate, endDate]);

  /** Egresos filtrados por periodo */
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => isDateInPeriod(item.createdAt));
  }, [expenses, period, startDate, endDate]);

  /** Totales de métricas */
  const totalIncome = useMemo(() => {
    return filteredIncomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredIncomes]);

  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredExpenses]);

  const netBalance = useMemo(() => {
    return totalIncome - totalExpense;
  }, [totalIncome, totalExpense]);

  /** Desglose por método de pago de ingresos */
  const cashTotal = useMemo(() => {
    return filteredIncomes
      .filter((i) => i.paymentMethod === 'efectivo')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredIncomes]);

  const cardTotal = useMemo(() => {
    return filteredIncomes
      .filter((i) => i.paymentMethod === 'tarjeta')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredIncomes]);

  const transferTotal = useMemo(() => {
    return filteredIncomes
      .filter((i) => i.paymentMethod === 'transferencia')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredIncomes]);

  /** Desglose por categoría de gastos */
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {
      servicios: 0,
      insumos: 0,
      salarios: 0,
      mantenimiento: 0,
      otros: 0,
    };
    filteredExpenses.forEach((exp) => {
      map[exp.category] = (map[exp.category] || 0) + Number(exp.amount || 0);
    });
    return map;
  }, [filteredExpenses]);

  /** Últimas 5 transacciones globales */
  const recentTransactions: TransactionItem[] = useMemo(() => {
    const list: TransactionItem[] = [
      ...incomes.map((inc) => ({
        id: inc.id,
        type: 'ingreso' as const,
        description: inc.description,
        amount: inc.amount,
        paymentMethodOrCategory: inc.paymentMethod,
        createdAt: inc.createdAt,
        userName: inc.userName,
      })),
      ...expenses.map((exp) => ({
        id: exp.id,
        type: 'egreso' as const,
        description: exp.description,
        amount: exp.amount,
        paymentMethodOrCategory: exp.category,
        createdAt: exp.createdAt,
        userName: exp.userName,
      })),
    ];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  }, [incomes, expenses]);

  const getPeriodLabel = (): string => {
    switch (period) {
      case 'hoy': return 'Hoy';
      case 'semana': return 'Esta Semana';
      case 'mes': return 'Este Mes';
      case 'personalizado': return `Rango (${startDate || 'Inicio'} al ${endDate || 'Hoy'})`;
      default: return 'Total Histórico';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera del Administrador */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Dashboard Administrativo</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Supervisión global de flujo de caja y rentabilidad. Sesión: <strong className="text-white">{user?.fullName}</strong>
            </p>
          </div>
        </div>

        {/* Filtros de Fecha */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => setPeriod('hoy')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              period === 'hoy' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setPeriod('semana')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              period === 'semana' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setPeriod('mes')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              period === 'mes' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => setPeriod('todos')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              period === 'todos' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Total Histórico
          </button>
          <button
            onClick={() => setPeriod('personalizado')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              period === 'personalizado' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Personalizado
          </button>
        </div>
      </div>

      {/* Selector de fechas si es personalizado */}
      {period === 'personalizado' && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">Rango de fechas:</span>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
            />
          </div>
        </div>
      )}

      {/* 3 TARJETAS DE RESUMEN PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Ingresos */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Ingresos ({getPeriodLabel()})
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-3">
            {formatMoney(totalIncome)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {filteredIncomes.length} movimientos de ingreso
          </p>
        </div>

        {/* Total Egresos */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Egresos ({getPeriodLabel()})
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-3">
            {formatMoney(totalExpense)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {filteredExpenses.length} compras y gastos registrados
          </p>
        </div>

        {/* Balance Neto */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-slate-900 dark:border-slate-100 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Balance Neto ({getPeriodLabel()})
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-3xl font-black mt-3 ${netBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>
            {formatMoney(netBalance)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {netBalance >= 0 ? 'Margen operativo positivo' : 'Déficit en el periodo seleccionado'}
          </p>
        </div>
      </div>

      {/* DESGLOSES VISUALES: MÉTODOS DE PAGO Y CATEGORÍAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Desglose de Ingresos por Método de Pago */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span>Ingresos por Método de Pago ({getPeriodLabel()})</span>
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Efectivo</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{formatMoney(cashTotal)}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Tarjetas (POS)</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{formatMoney(cardTotal)}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2.5">
                <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Transferencias</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{formatMoney(transferTotal)}</span>
            </div>
          </div>
        </div>

        {/* Desglose de Gastos por Categoría */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-rose-600" />
            <span>Gastos por Categoría ({getPeriodLabel()})</span>
          </h2>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(expenseByCategory).map(([cat, val]) => (
              <div key={cat} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="capitalize font-bold text-slate-700 dark:text-slate-300 text-[11px] mb-1">{cat}</p>
                <p className="font-black text-rose-600 dark:text-rose-400 text-sm">{formatMoney(val)}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ÚLTIMAS 5 TRANSACCIONES REGISTRADAS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Últimas 5 Transacciones Registradas</span>
          </h2>
          <span className="text-[11px] text-slate-400">Actividad reciente</span>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            <tr>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Descripción</th>
              <th className="py-3 px-4">Usuario</th>
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                  No hay transacciones registradas.
                </td>
              </tr>
            ) : (
              recentTransactions.map((tx) => {
                const isIncome = tx.type === 'ingreso';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isIncome
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{tx.description}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">{tx.userName}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">{formatDate(tx.createdAt)}</td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatMoney(tx.amount)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AdminDashboard;

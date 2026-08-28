import React, { useState } from 'react';
import { 
  Banknote, 
  CreditCard, 
  ArrowLeftRight, 
  Calendar,
  Filter,
  Clock
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { TransactionItem } from '../types';

/**
 * Formateador de moneda en Lempiras (L.)
 * @param amount - Monto numérico
 * @returns string - Monto formateado (ej: L. 1,250.00)
 */
const formatMoney = (amount: number): string => {
  return `L. ${Number(amount).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Formateador de fecha legible para el historial
 * @param dateStr - Fecha ISO 8601
 * @returns string - Fecha y hora legible en español
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
 * Pantalla de Historial y Cuadre de Caja del Día (PantallaCuadreCaja).
 * - Realiza el arqueo diario: Total Ingresos - Total Egresos = Balance del Turno.
 * - Desglosa los ingresos por canal: Efectivo en Caja, Tarjetas (POS) y Transferencias Bancarias.
 * - Para el Usuario Estándar: Opera exclusivamente con los movimientos de hoy (inicia en cero a las 00:00).
 * - Para el Administrador: Permite alternar entre el cuadre de hoy y el histórico acumulado.
 */
export const PantallaCuadreCaja: React.FC = () => {
  const { isAdmin } = useAuth();
  const { 
    incomes, 
    expenses, 
    todayIncomes, 
    todayExpenses, 
    totalIncome, 
    totalExpense, 
    netBalance, 
    todayTotalIncome, 
    todayTotalExpense, 
    todayNetBalance, 
    incomeByCash, 
    incomeByCard, 
    incomeByTransfer,
    todayIncomeByCash,
    todayIncomeByCard,
    todayIncomeByTransfer
  } = useFinance();

  // Filtro de tipo de transacción (todos, ingresos, egresos)
  const [filterType, setFilterType] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  // Selector de alcance para el Administrador (hoy vs histórico)
  const [viewScope, setViewScope] = useState<'hoy' | 'historico'>('hoy');

  // Si no es admin, el alcance es forzosamente el día actual
  const isTodayOnly = !isAdmin || viewScope === 'hoy';

  const currentIncomes = isTodayOnly ? todayIncomes : incomes;
  const currentExpenses = isTodayOnly ? todayExpenses : expenses;
  const currentTotalIncome = isTodayOnly ? todayTotalIncome : totalIncome;
  const currentTotalExpense = isTodayOnly ? todayTotalExpense : totalExpense;
  const currentNetBalance = isTodayOnly ? todayNetBalance : netBalance;
  const currentCash = isTodayOnly ? todayIncomeByCash : incomeByCash;
  const currentCard = isTodayOnly ? todayIncomeByCard : incomeByCard;
  const currentTransfer = isTodayOnly ? todayIncomeByTransfer : incomeByTransfer;

  const todayFormatted = new Date().toLocaleDateString('es-HN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  /**
   * Une los ingresos y egresos activos en una sola lista cronológica unificada para la tabla.
   */
  const transactions: TransactionItem[] = [
    ...currentIncomes.map((inc) => ({
      id: inc.id,
      type: 'ingreso' as const,
      description: inc.description,
      amount: inc.amount,
      paymentMethodOrCategory: inc.paymentMethod,
      createdAt: inc.createdAt,
      userName: inc.userName,
    })),
    ...currentExpenses.map((exp) => ({
      id: exp.id,
      type: 'egreso' as const,
      description: exp.description,
      amount: exp.amount,
      paymentMethodOrCategory: exp.category,
      createdAt: exp.createdAt,
      userName: exp.userName,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  /** Transacciones filtradas por tipo de movimiento */
  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'todos') return true;
    return t.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Banner de Turno Diario para el Usuario */}
      {!isAdmin && (
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              <strong>Turno Activo:</strong> {todayFormatted}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-blue-700 dark:text-blue-300 text-[11px]">
            <Clock className="w-3.5 h-3.5" />
            <span>El cuadre de caja se reinicia automáticamente a cero cada nuevo día.</span>
          </div>
        </div>
      )}

      {/* Encabezado Principal y Selector para Admin */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Cuadre de Caja {isTodayOnly ? 'del Día de Hoy' : '(Histórico Total)'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isTodayOnly
              ? 'Arqueo de ventas y balance correspondiente al turno de hoy.'
              : 'Consolidado acumulado de todos los movimientos registrados.'}
          </p>
        </div>

        {/* Selector de alcance exclusivo para Administrador */}
        {isAdmin && (
          <div className="flex items-center space-x-1.5 text-xs bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewScope('hoy')}
              className={`px-3 py-1 rounded transition-colors ${
                viewScope === 'hoy'
                  ? 'bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Cuadre de Hoy
            </button>
            <button
              onClick={() => setViewScope('historico')}
              className={`px-3 py-1 rounded transition-colors ${
                viewScope === 'historico'
                  ? 'bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Histórico Total
            </button>
          </div>
        )}
      </div>

      {/* SECCIÓN 1: CUADRE GENERAL (Ingresos vs Egresos) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Ingresos */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Total Ingresos (+) {isTodayOnly && 'de Hoy'}
          </span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatMoney(currentTotalIncome)}</p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">{currentIncomes.length} cobros</span>
        </div>

        {/* Total Egresos */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Total Egresos (-) {isTodayOnly && 'de Hoy'}
          </span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{formatMoney(currentTotalExpense)}</p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">{currentExpenses.length} gastos</span>
        </div>

        {/* Balance Neto / Cuadre Final */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border-2 border-slate-900 dark:border-slate-100 transition-colors">
          <span className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">
            Balance Final {isTodayOnly ? 'de Hoy' : 'Total'} (Ingresos - Egresos)
          </span>
          <p className={`text-2xl font-bold mt-1 ${currentNetBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatMoney(currentNetBalance)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {currentNetBalance >= 0 ? 'Resultado positivo del turno' : 'Déficit operativo'}
          </span>
        </div>
      </div>

      {/* SECCIÓN 2: DESGLOSE POR TIPO DE VENTA / MÉTODO DE PAGO */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>Desglose de Ingresos por Tipo de Venta {isTodayOnly && '(Turno de Hoy)'}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Efectivo */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
              <span className="font-semibold flex items-center gap-1">
                <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Ventas en Efectivo
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">(Físico en caja hoy)</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatMoney(currentCash)}</p>
          </div>

          {/* Tarjeta */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
              <span className="font-semibold flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Ventas con Tarjeta
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">(POS hoy)</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatMoney(currentCard)}</p>
          </div>

          {/* Transferencia */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
              <span className="font-semibold flex items-center gap-1">
                <ArrowLeftRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Transferencias
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">(Banco hoy)</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatMoney(currentTransfer)}</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: HISTORIAL DE MOVIMIENTOS */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Historial de Transacciones {isTodayOnly ? 'del Día' : 'Completas'}
          </h2>

          {/* Filtro Rápido */}
          <div className="flex items-center space-x-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <button
              onClick={() => setFilterType('todos')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterType === 'todos'
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-medium'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Todos ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('ingreso')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterType === 'ingreso'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Ingresos ({currentIncomes.length})
            </button>
            <button
              onClick={() => setFilterType('egreso')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterType === 'egreso'
                  ? 'bg-rose-600 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Egresos ({currentExpenses.length})
            </button>
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
            <tr>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Descripción / Concepto</th>
              <th className="py-3 px-4">Método / Categoría</th>
              <th className="py-3 px-4">Hora</th>
              <th className="py-3 px-4">Usuario</th>
              <th className="py-3 px-4 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  {isTodayOnly
                    ? 'No hay movimientos registrados en el turno de hoy. (Inicia en cero)'
                    : 'No hay movimientos registrados.'}
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'ingreso';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          isIncome
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{tx.description}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 capitalize text-xs">
                      {tx.paymentMethodOrCategory}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {isTodayOnly
                        ? new Date(tx.createdAt).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })
                        : formatDate(tx.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">{tx.userName}</td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
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

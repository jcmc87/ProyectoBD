import React, { useState, useMemo } from 'react';
import { 
  Banknote, 
  CreditCard, 
  ArrowLeftRight, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock 
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { TransactionItem } from '../../types';

/**
 * Formateador de moneda en Lempiras (L.)
 */
const formatMoney = (amount: number): string => {
  return `L. ${Number(amount).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Vista de Historial Personal y Cuadre de Caja para el Usuario (src/pages/user/MyHistory.tsx).
 * - Muestra la lista de movimientos registrados.
 * - Filtros rápidos: "Todos", "Solo Ingresos", "Solo Egresos" y selector de fecha.
 * - Distinción visual entre ingresos (verde/positivo) y egresos (rojo/negativo).
 * - Realiza el balance neto del turno (Ingresos - Egresos) y desglose por tipo de cobro (Efectivo, Tarjeta, Transferencia).
 */
export const MyHistory: React.FC = () => {
  const { 
    todayIncomes, 
    todayExpenses, 
    todayTotalIncome, 
    todayTotalExpense, 
    todayNetBalance, 
    todayIncomeByCash, 
    todayIncomeByCard, 
    todayIncomeByTransfer 
  } = useFinance();

  // Estados de filtros
  const [filterType, setFilterType] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const todayFormatted = new Date().toLocaleDateString('es-HN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  /**
   * Consolida ingresos y egresos en una sola lista unificada
   */
  const allTransactions: TransactionItem[] = useMemo(() => {
    const list: TransactionItem[] = [
      ...todayIncomes.map((inc) => ({
        id: inc.id,
        type: 'ingreso' as const,
        description: inc.description,
        amount: inc.amount,
        paymentMethodOrCategory: inc.paymentMethod,
        createdAt: inc.createdAt,
        userName: inc.userName,
      })),
      ...todayExpenses.map((exp) => ({
        id: exp.id,
        type: 'egreso' as const,
        description: exp.description,
        amount: exp.amount,
        paymentMethodOrCategory: exp.category,
        createdAt: exp.createdAt,
        userName: exp.userName,
      })),
    ];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [todayIncomes, todayExpenses]);

  /**
   * Filtra las transacciones por tipo y por fecha si se especifica
   */
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      // Filtro por tipo
      if (filterType !== 'todos' && tx.type !== filterType) {
        return false;
      }
      // Filtro por fecha opcional
      if (selectedDate) {
        const txDate = tx.createdAt.split('T')[0];
        if (txDate !== selectedDate) return false;
      }
      return true;
    });
  }, [allTransactions, filterType, selectedDate]);

  return (
    <div className="space-y-6">
      
      {/* Banner de Turno Diario */}
      <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-blue-900 dark:text-blue-200">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            <strong>Turno Activo:</strong> {todayFormatted}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-blue-700 dark:text-blue-300 text-[11px]">
          <Clock className="w-3.5 h-3.5" />
          <span>Arqueo diario — Inicia en cero a las 00:00</span>
        </div>
      </div>

      {/* SECCIÓN 1: RESUMEN DE CUADRE DIARIO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Ingresos */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Ingresos (+)
            </span>
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/80 rounded-lg text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatMoney(todayTotalIncome)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {todayIncomes.length} cobros registrados hoy
          </p>
        </div>

        {/* Total Egresos */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Egresos (-)
            </span>
            <div className="p-1.5 bg-rose-100 dark:bg-rose-950/80 rounded-lg text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {formatMoney(todayTotalExpense)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {todayExpenses.length} gastos registrados hoy
          </p>
        </div>

        {/* Balance Final / Arqueo */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-slate-900 dark:border-slate-100 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Cuadre Final (Balance)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
              HOY
            </span>
          </div>
          <p className={`text-2xl font-black mt-2 ${todayNetBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>
            {formatMoney(todayNetBalance)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {todayNetBalance >= 0 ? 'Cierre de caja positivo' : 'Déficit operativo en caja'}
          </p>
        </div>
      </div>

      {/* SECCIÓN 2: DESGLOSE POR MÉTODO DE PAGO */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 transition-colors shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Desglose de Ventas por Tipo de Cobro
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
              <span className="font-bold flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Efectivo Físico
              </span>
              <span className="text-[10px] text-slate-400">(En caja)</span>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white">{formatMoney(todayIncomeByCash)}</p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
              <span className="font-bold flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Ventas con Tarjeta
              </span>
              <span className="text-[10px] text-slate-400">(Terminal POS)</span>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white">{formatMoney(todayIncomeByCard)}</p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
              <span className="font-bold flex items-center gap-1.5">
                <ArrowLeftRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Transferencias
              </span>
              <span className="text-[10px] text-slate-400">(Bancos)</span>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white">{formatMoney(todayIncomeByTransfer)}</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: TABLA DE HISTORIAL CON FILTROS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        
        {/* Barra de Filtros */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Historial de Movimientos de Hoy
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Registros ordenados cronológicamente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filtro por tipo de transacción */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setFilterType('todos')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  filterType === 'todos'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Todos ({allTransactions.length})
              </button>
              <button
                onClick={() => setFilterType('ingreso')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  filterType === 'ingreso'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Solo Ingresos ({todayIncomes.length})
              </button>
              <button
                onClick={() => setFilterType('egreso')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  filterType === 'egreso'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Solo Egresos ({todayExpenses.length})
              </button>
            </div>

            {/* Selector de fecha opcional */}
            <div className="flex items-center space-x-1">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabla */}
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            <tr>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Descripción / Concepto</th>
              <th className="py-3 px-4">Método / Categoría</th>
              <th className="py-3 px-4">Hora</th>
              <th className="py-3 px-4 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No hay transacciones registradas en este turno. (Inicia en cero)
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'ingreso';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          isIncome
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {tx.description}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 capitalize text-xs">
                      {tx.paymentMethodOrCategory}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(tx.createdAt).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold text-sm ${
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

export default MyHistory;

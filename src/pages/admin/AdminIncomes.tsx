import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Edit2, 
  Trash2, 
  Plus, 
  X,
  RefreshCw
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Income, IncomeInput, PaymentMethod } from '../../types';

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
 * Vista de Gestión de Ingresos para el Administrador (src/pages/admin/AdminIncomes.tsx).
 * - Tabla con todos los ingresos de todos los usuarios conectada a Supabase.
 * - Buscador en tiempo real por descripción o usuario y filtro por fecha.
 * - Modales completos para Editar y Registrar ingresos.
 * - Eliminación de registros con confirmación de seguridad.
 */
export const AdminIncomes: React.FC = () => {
  const { incomes, addIncome, updateIncome, deleteIncome, isLoading, refreshData } = useFinance();

  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  // Estados del modal de edición/creación
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<IncomeInput>({
    amount: 0,
    paymentMethod: 'efectivo',
    description: '',
  });

  /**
   * Filtra ingresos por término de búsqueda y por fecha
   */
  const filteredIncomes = useMemo(() => {
    return incomes.filter((item) => {
      const matchesSearch =
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDate = filterDate ? item.createdAt.startsWith(filterDate) : true;

      return matchesSearch && matchesDate;
    });
  }, [incomes, searchTerm, filterDate]);

  /** Total de ingresos filtrados */
  const totalFilteredAmount = useMemo(() => {
    return filteredIncomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredIncomes]);

  /**
   * Abre modal para crear nuevo ingreso
   */
  const handleOpenCreate = (): void => {
    setEditingId(null);
    setFormData({ amount: 0, paymentMethod: 'efectivo', description: '' });
    setIsModalOpen(true);
  };

  /**
   * Abre modal para editar un ingreso existente
   */
  const handleOpenEdit = (income: Income): void => {
    setEditingId(income.id);
    setFormData({
      amount: income.amount,
      paymentMethod: income.paymentMethod,
      description: income.description,
    });
    setIsModalOpen(true);
  };

  /**
   * Guarda cambios o crea nuevo registro en Supabase
   */
  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (formData.amount <= 0 || !formData.description.trim()) {
      alert('Ingresa un monto válido y una descripción.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateIncome(editingId, formData);
      } else {
        await addIncome(formData);
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Elimina un ingreso con confirmación en Supabase
   */
  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro de ingreso permanentemente en Supabase?')) {
      await deleteIncome(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera y Resumen */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Gestión de Ingresos (Administrador)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total visible: <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{formatMoney(totalFilteredAmount)}</strong> ({filteredIncomes.length} registros)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors text-xs font-semibold flex items-center space-x-1"
            title="Sincronizar con Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Ingreso</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3 shadow-xs transition-colors">
        {/* Buscador de texto */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por concepto, cajero, método de pago..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Filtro por fecha */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
            />
          </div>
          {(searchTerm || filterDate) && (
            <button
              onClick={() => { setSearchTerm(''); setFilterDate(''); }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline whitespace-nowrap"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla Completa de Ingresos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            <tr>
              <th className="py-3.5 px-4">Fecha y Hora</th>
              <th className="py-3.5 px-4">Usuario / Cajero</th>
              <th className="py-3.5 px-4">Método</th>
              <th className="py-3.5 px-4">Descripción / Concepto</th>
              <th className="py-3.5 px-4 text-right">Monto</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredIncomes.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                  {isLoading ? 'Cargando datos desde Supabase...' : 'No se encontraron ingresos con los filtros seleccionados.'}
                </td>
              </tr>
            ) : (
              filteredIncomes.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs font-mono">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium text-xs">
                    {item.userName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="capitalize px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {item.description}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                    +{formatMoney(item.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar Ingreso"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Eliminar Ingreso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edición / Creación */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? 'Editar Ingreso en Supabase' : 'Registrar Nuevo Ingreso'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Monto (L.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={formData.amount || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Método de Pago
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })
                  }
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Descripción / Concepto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Venta de mostrador #42"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-60"
                >
                  {isSaving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminIncomes;

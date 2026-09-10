import React, { useState, useMemo } from 'react';
import { 
  TrendingDown, 
  Search, 
  Edit2, 
  Trash2, 
  Plus, 
  X,
  RefreshCw
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Expense, ExpenseInput, ExpenseCategory } from '../../types';

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
 * Vista de Gestión de Egresos para el Administrador (src/pages/admin/AdminExpenses.tsx).
 * - Tabla con todos los gastos y compras registrados en Supabase.
 * - Buscador en tiempo real por descripción, categoría o usuario y filtro por fecha.
 * - Modales completos para Editar y Registrar egresos.
 * - Eliminación de registros con confirmación de seguridad.
 */
export const AdminExpenses: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, isLoading, refreshData } = useFinance();

  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');

  // Estados del modal de edición/creación
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExpenseInput>({
    amount: 0,
    category: 'servicios',
    description: '',
  });

  /**
   * Filtra egresos por término de búsqueda, fecha y categoría
   */
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchesSearch =
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDate = filterDate ? item.createdAt.startsWith(filterDate) : true;
      const matchesCategory = categoryFilter !== 'todas' ? item.category === categoryFilter : true;

      return matchesSearch && matchesDate && matchesCategory;
    });
  }, [expenses, searchTerm, filterDate, categoryFilter]);

  /** Total de gastos filtrados */
  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredExpenses]);

  /**
   * Abre modal para crear nuevo egreso
   */
  const handleOpenCreate = (): void => {
    setEditingId(null);
    setFormData({ amount: 0, category: 'servicios', description: '' });
    setIsModalOpen(true);
  };

  /**
   * Abre modal para editar un egreso existente
   */
  const handleOpenEdit = (expense: Expense): void => {
    setEditingId(expense.id);
    setFormData({
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
    });
    setIsModalOpen(true);
  };

  /**
   * Guarda cambios o crea nuevo registro de gasto en Supabase
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
        await updateExpense(editingId, formData);
      } else {
        await addExpense(formData);
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Elimina un egreso con confirmación en Supabase
   */
  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este gasto permanentemente en Supabase?')) {
      await deleteExpense(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera y Resumen */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Gestión de Egresos (Administrador)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total visible: <strong className="text-rose-600 dark:text-rose-400 text-sm">{formatMoney(totalFilteredAmount)}</strong> ({filteredExpenses.length} registros)
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
            className="flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Egreso</span>
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
            placeholder="Buscar por concepto, usuario, categoría..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>

        {/* Filtro por Categoría */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none w-full sm:w-auto"
        >
          <option value="todas">Todas las categorías</option>
          <option value="servicios">Servicios</option>
          <option value="insumos">Insumos</option>
          <option value="salarios">Salarios</option>
          <option value="mantenimiento">Mantenimiento</option>
          <option value="otros">Otros</option>
        </select>

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
          {(searchTerm || filterDate || categoryFilter !== 'todas') && (
            <button
              onClick={() => { setSearchTerm(''); setFilterDate(''); setCategoryFilter('todas'); }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline whitespace-nowrap"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla Completa de Egresos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            <tr>
              <th className="py-3.5 px-4">Fecha y Hora</th>
              <th className="py-3.5 px-4">Usuario</th>
              <th className="py-3.5 px-4">Categoría</th>
              <th className="py-3.5 px-4">Descripción / Concepto</th>
              <th className="py-3.5 px-4 text-right">Monto</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                  {isLoading ? 'Cargando datos desde Supabase...' : 'No se encontraron egresos con los filtros seleccionados.'}
                </td>
              </tr>
            ) : (
              filteredExpenses.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs font-mono">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium text-xs">
                    {item.userName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="capitalize px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-100 dark:border-rose-900/50">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {item.description}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-rose-600 dark:text-rose-400">
                    -{formatMoney(item.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar Egreso"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Eliminar Egreso"
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
                {editingId ? 'Editar Egreso en Supabase' : 'Registrar Nuevo Egreso'}
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
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as ExpenseCategory })
                  }
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="servicios">Servicios</option>
                  <option value="insumos">Insumos</option>
                  <option value="salarios">Salarios</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Descripción / Concepto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de recibo eléctrico"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
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
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-60"
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

export default AdminExpenses;

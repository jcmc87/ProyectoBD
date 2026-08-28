import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X, Calendar } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { ExpenseInput, ExpenseCategory } from '../types';

/**
 * Formateador de moneda en Lempiras (L.)
 * @param amount - Monto numérico
 * @returns string - Monto formateado (ej: L. 1,250.00)
 */
const formatMoney = (amount: number): string => {
  return `L. ${Number(amount).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Pantalla de Gestión y Registro de Egresos / Gastos (PantallaEgresos).
 * - Permite registrar gastos clasificados por categoría (servicios, insumos, salarios, etc.).
 * - Restricción de vista: El Usuario Estándar solo visualiza los egresos del día de hoy.
 * - Restricción de permisos: Solo el Administrador tiene habilitados los botones para modificar o eliminar egresos.
 */
export const PantallaEgresos: React.FC = () => {
  const { isAdmin } = useAuth();
  const { 
    expenses, 
    todayExpenses, 
    totalExpense, 
    todayTotalExpense, 
    addExpense, 
    updateExpense, 
    deleteExpense 
  } = useFinance();

  // Estados locales para control del modal y formulario
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ExpenseInput>({
    amount: 0,
    category: 'servicios',
    description: '',
  });

  // Lista y total visibles según el rol activo
  const visibleExpenses = isAdmin ? expenses : todayExpenses;
  const currentTotal = isAdmin ? totalExpense : todayTotalExpense;
  const todayFormatted = new Date().toLocaleDateString('es-HN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  /**
   * Abre el modal en modo creación para registrar un nuevo gasto/egreso.
   */
  const handleOpenCreate = (): void => {
    setEditingId(null);
    setFormData({ amount: 0, category: 'servicios', description: '' });
    setIsModalOpen(true);
  };

  /**
   * Abre el modal en modo edición precargando los datos del gasto.
   * Validación de seguridad: Exclusivo para administradores.
   * @param expense - Objeto de gasto a editar
   */
  const handleOpenEdit = (expense: { id: string; amount: number; category: ExpenseCategory; description: string }): void => {
    if (!isAdmin) {
      alert('Solo el Administrador tiene permisos para modificar registros.');
      return;
    }
    setEditingId(expense.id);
    setFormData({
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
    });
    setIsModalOpen(true);
  };

  /**
   * Procesa el formulario para registrar un nuevo gasto o actualizar uno existente.
   * @param e - Evento submit del formulario
   */
  const handleSave = (e: React.FormEvent): void => {
    e.preventDefault();
    if (formData.amount <= 0 || !formData.description.trim()) {
      alert('Ingresa un monto válido y una descripción.');
      return;
    }

    if (editingId) {
      if (!isAdmin) {
        alert('Solo el Administrador puede modificar registros.');
        return;
      }
      updateExpense(editingId, formData);
    } else {
      addExpense(formData);
    }
    setIsModalOpen(false);
  };

  /**
   * Solicita confirmación y elimina un registro de egreso.
   * Validación de seguridad: Exclusivo para administradores.
   * @param id - Identificador del egreso
   */
  const handleDelete = (id: string): void => {
    if (!isAdmin) {
      alert('Solo el Administrador puede eliminar registros.');
      return;
    }
    if (window.confirm('¿Eliminar este gasto?')) {
      deleteExpense(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Indicador de Turno Diario para el Usuario */}
      {!isAdmin && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-lg flex items-center justify-between text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>
              <strong>Turno Diario:</strong> {todayFormatted} — <em>(Solo gastos del día actual, reinicio diario a las 00:00)</em>
            </span>
          </div>
        </div>
      )}

      {/* Encabezado y Total */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Egresos {isAdmin ? '(Histórico Total)' : 'de Hoy'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total {isAdmin ? 'general' : 'gastado hoy'}: <strong className="text-rose-600 dark:text-rose-400 text-sm">{formatMoney(currentTotal)}</strong>
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Egreso</span>
        </button>
      </div>

      {/* Tabla limpia de Egresos */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
            <tr>
              <th className="py-3 px-4">Descripción</th>
              <th className="py-3 px-4">Categoría</th>
              <th className="py-3 px-4">Hora</th>
              <th className="py-3 px-4">Registrado Por</th>
              <th className="py-3 px-4 text-right">Monto</th>
              {isAdmin && <th className="py-3 px-4 text-center">Acciones (Admin)</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleExpenses.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  {!isAdmin
                    ? 'Aún no hay gastos registrados el día de hoy. (Inicia en cero)'
                    : 'No hay egresos registrados en el sistema.'}
                </td>
              </tr>
            ) : (
              visibleExpenses.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{item.description}</td>
                  <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-400">{item.category}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">
                    {new Date(item.createdAt).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">{item.userName}</td>
                  <td className="py-3 px-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                    -{formatMoney(item.amount)}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          title="Editar (Solo Admin)"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Eliminar (Solo Admin)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Registro / Edición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {editingId ? 'Editar Egreso (Admin)' : 'Nuevo Egreso'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Monto (L.)</label>
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
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-800 dark:focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as ExpenseCategory })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-800 dark:focus:border-slate-500"
                >
                  <option value="servicios">Servicios</option>
                  <option value="insumos">Insumos</option>
                  <option value="salarios">Salarios</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de internet"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-800 dark:focus:border-slate-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 dark:hover:bg-rose-700 text-white rounded font-medium"
                >
                  {editingId ? 'Guardar Cambios' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

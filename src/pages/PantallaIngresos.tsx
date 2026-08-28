import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X, Calendar } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { IncomeInput, PaymentMethod } from '../types';

/**
 * Formateador de moneda en Lempiras (L.)
 * @param amount - Monto numérico
 * @returns string - Monto formateado (ej: L. 1,250.00)
 */
const formatMoney = (amount: number): string => {
  return `L. ${Number(amount).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Pantalla de Gestión y Registro de Ingresos (PantallaIngresos).
 * - Permite registrar cobros/ventas por Efectivo, Tarjeta y Transferencia.
 * - Restricción de vista: El Usuario Estándar solo visualiza los ingresos del día de hoy.
 * - Restricción de permisos: Solo el Administrador tiene habilitados los botones para modificar o eliminar ingresos.
 */
export const PantallaIngresos: React.FC = () => {
  const { isAdmin } = useAuth();
  const { 
    incomes, 
    todayIncomes, 
    totalIncome, 
    todayTotalIncome, 
    addIncome, 
    updateIncome, 
    deleteIncome 
  } = useFinance();

  // Estados locales para control del modal y formulario
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<IncomeInput>({
    amount: 0,
    paymentMethod: 'transferencia',
    description: '',
  });

  // Lista y total visibles según el rol activo
  const visibleIncomes = isAdmin ? incomes : todayIncomes;
  const currentTotal = isAdmin ? totalIncome : todayTotalIncome;
  const todayFormatted = new Date().toLocaleDateString('es-HN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  /**
   * Abre el modal en modo creación para registrar un nuevo ingreso.
   */
  const handleOpenCreate = (): void => {
    setEditingId(null);
    setFormData({ amount: 0, paymentMethod: 'transferencia', description: '' });
    setIsModalOpen(true);
  };

  /**
   * Abre el modal en modo edición precargando los datos del ingreso.
   * Validación de seguridad: Exclusivo para administradores.
   * @param income - Objeto de ingreso a editar
   */
  const handleOpenEdit = (income: { id: string; amount: number; paymentMethod: PaymentMethod; description: string }): void => {
    if (!isAdmin) {
      alert('Solo el Administrador tiene permisos para modificar registros.');
      return;
    }
    setEditingId(income.id);
    setFormData({
      amount: income.amount,
      paymentMethod: income.paymentMethod,
      description: income.description,
    });
    setIsModalOpen(true);
  };

  /**
   * Procesa el formulario para guardar un nuevo registro o actualizar uno existente.
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
      updateIncome(editingId, formData);
    } else {
      addIncome(formData);
    }
    setIsModalOpen(false);
  };

  /**
   * Solicita confirmación y elimina un registro de ingreso.
   * Validación de seguridad: Exclusivo para administradores.
   * @param id - Identificador del ingreso
   */
  const handleDelete = (id: string): void => {
    if (!isAdmin) {
      alert('Solo el Administrador puede eliminar registros.');
      return;
    }
    if (window.confirm('¿Eliminar este ingreso?')) {
      deleteIncome(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Indicador de Turno Diario para el Usuario */}
      {!isAdmin && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-lg flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>Turno Diario:</strong> {todayFormatted} — <em>(Solo movimientos del día actual, reinicio diario a las 00:00)</em>
            </span>
          </div>
        </div>
      )}

      {/* Encabezado y Total */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Ingresos {isAdmin ? '(Histórico Total)' : 'de Hoy'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total {isAdmin ? 'general' : 'recaudado hoy'}: <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{formatMoney(currentTotal)}</strong>
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Ingreso</span>
        </button>
      </div>

      {/* Tabla limpia de Ingresos */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
            <tr>
              <th className="py-3 px-4">Descripción</th>
              <th className="py-3 px-4">Método</th>
              <th className="py-3 px-4">Hora</th>
              <th className="py-3 px-4">Registrado Por</th>
              <th className="py-3 px-4 text-right">Monto</th>
              {isAdmin && <th className="py-3 px-4 text-center">Acciones (Admin)</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleIncomes.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  {!isAdmin
                    ? 'Aún no hay ingresos registrados el día de hoy. (Inicia en cero)'
                    : 'No hay ingresos registrados en el sistema.'}
                </td>
              </tr>
            ) : (
              visibleIncomes.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{item.description}</td>
                  <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-400">{item.paymentMethod}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">
                    {new Date(item.createdAt).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">{item.userName}</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    +{formatMoney(item.amount)}
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
                {editingId ? 'Editar Ingreso (Admin)' : 'Nuevo Ingreso'}
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
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Método de Pago</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-800 dark:focus:border-slate-500"
                >
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="efectivo">Efectivo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de cliente"
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
                  className="px-3 py-1.5 text-xs bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white rounded font-medium"
                >
                  {editingId ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

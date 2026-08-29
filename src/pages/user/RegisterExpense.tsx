import React, { useState } from 'react';
import { 
  MinusCircle, 
  CheckCircle2, 
  Tag, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ExpenseCategory } from '../../types';

/**
 * Formateador de moneda en Lempiras (L.)
 */
const formatMoney = (amount: number): string => {
  return `L. ${Number(amount).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Categorías disponibles con etiquetas amigables
 */
const CATEGORIES: { value: ExpenseCategory; label: string; description: string }[] = [
  { value: 'servicios', label: 'Servicios', description: 'Luz, agua, internet, teléfono' },
  { value: 'insumos', label: 'Insumos', description: 'Papelería, bolsas, productos' },
  { value: 'salarios', label: 'Salarios', description: 'Sueldos, horas extras, anticipos' },
  { value: 'mantenimiento', label: 'Mantenimiento', description: 'Reparaciones, limpieza' },
  { value: 'otros', label: 'Otros Gastos', description: 'Gastos varios o imprevistos' },
];

/**
 * Vista de Registro de Egresos para el Usuario (src/pages/user/RegisterExpense.tsx).
 * - Formulario con campos: Monto, Categoría (Servicios, Insumos, Salarios, Mantenimiento, Otros) y Descripción (opcional).
 * - Feedback visual de confirmación con toast/alerta temporal de éxito.
 * - Muestra el total de egresos acumulado en el turno del día.
 */
export const RegisterExpense: React.FC = () => {
  const { addExpense, todayTotalExpense } = useFinance();

  // Estados del formulario
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('servicios');
  const [description, setDescription] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [lastRegisteredAmount, setLastRegisteredAmount] = useState<number>(0);

  const todayFormatted = new Date().toLocaleDateString('es-HN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  /**
   * Procesa el registro del egreso y emite el feedback visual
   * @param e - Evento de formulario
   */
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Por favor, ingresa un monto válido mayor a cero.');
      return;
    }

    // Agregar egreso al contexto financiero
    addExpense({
      amount: numAmount,
      category,
      description: description.trim() || `Gasto registrado en ${category}`,
    });

    // Guardar para feedback visual y limpiar campos
    setLastRegisteredAmount(numAmount);
    setShowSuccessToast(true);
    setAmount('');
    setDescription('');

    // Ocultar mensaje de éxito tras 3.5 segundos
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Banner de Turno Activo */}
      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center justify-between text-xs text-rose-900 dark:text-rose-300">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>
            <strong>Turno de Hoy:</strong> {todayFormatted}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
          Gastado Hoy: {formatMoney(todayTotalExpense)}
        </span>
      </div>

      {/* Tarjeta Principal del Formulario */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 transition-colors">
        
        {/* Cabecera de la sección */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <MinusCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Registrar Nuevo Egreso / Gasto
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registra compras, servicios o pagos de caja menor del día.
            </p>
          </div>
        </div>

        {/* Feedback visual temporal (Toast de éxito) */}
        {showSuccessToast && (
          <div className="p-4 bg-rose-500 text-white rounded-xl shadow-md flex items-center justify-between animate-fade-in text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>
                ¡Egreso de <strong>{formatMoney(lastRegisteredAmount)}</strong> registrado correctamente!
              </span>
            </div>
            <Sparkles className="w-4 h-4 opacity-80" />
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Campo: Monto */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Monto del Gasto (L.) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 font-bold text-sm">
                L.
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>
          </div>

          {/* Campo: Categoría */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Categoría del Gasto <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    category === cat.value
                      ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <Tag className="w-3.5 h-3.5 text-rose-500" />
                    <span className="font-bold text-xs">{cat.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {cat.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Campo: Descripción (Opcional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Descripción / Detalle <span className="text-slate-400 font-normal text-[10px]">(Opcional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Pago de internet del mes, compra de café y papel, flete..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Guardar Egreso</span>
          </button>
        </form>
      </div>

    </div>
  );
};

export default RegisterExpense;

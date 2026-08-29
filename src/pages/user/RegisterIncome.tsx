import React, { useState } from 'react';
import { 
  PlusCircle, 
  CheckCircle2, 
  Banknote, 
  CreditCard, 
  ArrowLeftRight, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { PaymentMethod } from '../../types';

/**
 * Formateador de moneda en Lempiras (L.)
 */
const formatMoney = (amount: number): string => {
  return `L. ${Number(amount).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Vista de Registro de Ingresos para el Usuario (src/pages/user/RegisterIncome.tsx).
 * - Formulario con campos: Monto, Método de Pago (Efectivo, Tarjeta, Transferencia) y Descripción (opcional).
 * - Feedback visual de confirmación con toast/alerta temporal de éxito.
 * - Muestra el total recaudado en el turno del día.
 */
export const RegisterIncome: React.FC = () => {
  const { addIncome, todayTotalIncome } = useFinance();

  // Estados del formulario
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
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
   * Procesa el registro del ingreso y emite el feedback visual
   * @param e - Evento de formulario
   */
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Por favor, ingresa un monto válido mayor a cero.');
      return;
    }

    // Agregar ingreso al contexto financiero
    addIncome({
      amount: numAmount,
      paymentMethod,
      description: description.trim() || 'Ingreso general de venta',
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
      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            <strong>Turno de Hoy:</strong> {todayFormatted}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          Recaudado Hoy: {formatMoney(todayTotalIncome)}
        </span>
      </div>

      {/* Tarjeta Principal del Formulario */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 transition-colors">
        
        {/* Cabecera de la sección */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Registrar Nuevo Ingreso
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ingresa los cobros y ventas del turno actual.
            </p>
          </div>
        </div>

        {/* Feedback visual temporal (Toast de éxito) */}
        {showSuccessToast && (
          <div className="p-4 bg-emerald-500 text-white rounded-xl shadow-md flex items-center justify-between animate-fade-in text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>
                ¡Ingreso de <strong>{formatMoney(lastRegisteredAmount)}</strong> registrado con éxito!
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
              Monto en Lempiras (L.) <span className="text-rose-500">*</span>
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
                className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Campo: Método de Pago */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Método de Pago <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Opción 1: Efectivo */}
              <button
                type="button"
                onClick={() => setPaymentMethod('efectivo')}
                className={`py-3 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1.5 transition-all ${
                  paymentMethod === 'efectivo'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Efectivo</span>
              </button>

              {/* Opción 2: Tarjeta */}
              <button
                type="button"
                onClick={() => setPaymentMethod('tarjeta')}
                className={`py-3 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1.5 transition-all ${
                  paymentMethod === 'tarjeta'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Tarjeta</span>
              </button>

              {/* Opción 3: Transferencia */}
              <button
                type="button"
                onClick={() => setPaymentMethod('transferencia')}
                className={`py-3 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1.5 transition-all ${
                  paymentMethod === 'transferencia'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 ring-2 ring-purple-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ArrowLeftRight className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Transferencia</span>
              </button>
            </div>
          </div>

          {/* Campo: Descripción (Opcional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Descripción / Concepto <span className="text-slate-400 font-normal text-[10px]">(Opcional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Venta de mostrador #104, servicio técnico, factura cliente..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Guardar Ingreso</span>
          </button>
        </form>
      </div>

    </div>
  );
};

export default RegisterIncome;

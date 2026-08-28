import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Income, Expense, IncomeInput, ExpenseInput, FinanceContextType } from '../types';
import { useAuth } from './AuthContext';

/**
 * Valida si una fecha dada en formato string ISO corresponde exactamente al día de hoy (año, mes y día).
 * @param dateStr - Fecha en formato ISO 8601
 * @returns boolean - true si la fecha corresponde a la jornada actual
 */
export const isToday = (dateStr: string): boolean => {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  } catch {
    return false;
  }
};

/**
 * Datos iniciales simulados (Mocks) con movimientos de HOY y de días anteriores para pruebas completas.
 */
const INITIAL_INCOMES: Income[] = [
  // Movimiento 1 de Hoy
  {
    id: 'inc-001',
    amount: 1250.00,
    paymentMethod: 'efectivo',
    description: 'Venta de productos en mostrador #1',
    createdBy: 'usr-standard-002',
    userName: 'Carlos López (Cajero)',
    createdAt: new Date().toISOString(), // Hoy
  },
  // Movimiento 2 de Hoy
  {
    id: 'inc-002',
    amount: 840.50,
    paymentMethod: 'tarjeta',
    description: 'Cobro de servicio técnico con terminal POS',
    createdBy: 'usr-standard-002',
    userName: 'Carlos López (Cajero)',
    createdAt: new Date().toISOString(), // Hoy
  },
  // Movimiento de hace 3 días (Visible solo para Admin)
  {
    id: 'inc-003',
    amount: 2100.00,
    paymentMethod: 'transferencia',
    description: 'Transferencia por factura corporativa #402',
    createdBy: 'usr-admin-001',
    userName: 'Ana Martínez (Admin)',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Movimiento de hace 12 días (Visible solo para Admin)
  {
    id: 'inc-004',
    amount: 3500.00,
    paymentMethod: 'transferencia',
    description: 'Anticipo por proyecto de consultoría financiera',
    createdBy: 'usr-admin-001',
    userName: 'Ana Martínez (Admin)',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Movimiento de hace 45 días (Visible solo para Admin)
  {
    id: 'inc-005',
    amount: 4800.00,
    paymentMethod: 'tarjeta',
    description: 'Venta de paquete de licencias empresariales',
    createdBy: 'usr-admin-001',
    userName: 'Ana Martínez (Admin)',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const INITIAL_EXPENSES: Expense[] = [
  // Movimiento 1 de Hoy
  {
    id: 'exp-001',
    category: 'insumos',
    amount: 150.00,
    description: 'Compra de bolsas y rollos de papel para caja',
    createdBy: 'usr-standard-002',
    userName: 'Carlos López (Cajero)',
    createdAt: new Date().toISOString(), // Hoy
  },
  // Movimiento de hace 2 días (Visible solo para Admin)
  {
    id: 'exp-002',
    category: 'servicios',
    amount: 350.00,
    description: 'Pago de servicio eléctrico de oficina',
    createdBy: 'usr-standard-002',
    userName: 'Carlos López (Cajero)',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Movimiento de hace 10 días (Visible solo para Admin)
  {
    id: 'exp-003',
    category: 'mantenimiento',
    amount: 600.00,
    description: 'Mantenimiento preventivo de aire acondicionado',
    createdBy: 'usr-admin-001',
    userName: 'Ana Martínez (Admin)',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

interface FinanceProviderProps {
  children: ReactNode;
}

/**
 * Proveedor de Estado Financiero (FinanceProvider).
 * Gestiona en memoria las listas de ingresos y egresos, separando los acumulados históricos
 * (para administradores) de los movimientos exclusivos del día de hoy (para cajeros/usuarios).
 */
export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  const { user } = useAuth();

  const [incomes, setIncomes] = useState<Income[]>(INITIAL_INCOMES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);

  /**
   * Genera un identificador único para nuevos registros en memoria.
   * @param prefix - Prefijo descriptivo ('inc' para ingresos, 'exp' para egresos)
   * @returns string - Identificador único generado
   */
  const generateId = (prefix: string): string => {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  /**
   * Agrega un nuevo ingreso al estado en memoria.
   * Autocompleta automáticamente ID, fecha actual ISO, usuario y nombre del creador.
   * @param data - Datos del ingreso (monto, método de pago y descripción)
   */
  const addIncome = (data: IncomeInput): void => {
    const newIncome: Income = {
      ...data,
      id: generateId('inc'),
      createdBy: user?.id || 'anon',
      userName: user?.fullName || 'Usuario',
      createdAt: new Date().toISOString(),
    };
    setIncomes((prev) => [newIncome, ...prev]);
  };

  /**
   * Modifica un ingreso existente por su ID.
   * @param id - Identificador del ingreso a actualizar
   * @param data - Campos parciales a modificar
   */
  const updateIncome = (id: string, data: Partial<IncomeInput>): void => {
    setIncomes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  };

  /**
   * Elimina un ingreso del estado en memoria por su ID.
   * @param id - Identificador del ingreso a eliminar
   */
  const deleteIncome = (id: string): void => {
    setIncomes((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * Agrega un nuevo egreso al estado en memoria.
   * Autocompleta automáticamente ID, fecha actual ISO, usuario y nombre del creador.
   * @param data - Datos del egreso (monto, categoría y descripción)
   */
  const addExpense = (data: ExpenseInput): void => {
    const newExpense: Expense = {
      ...data,
      id: generateId('exp'),
      createdBy: user?.id || 'anon',
      userName: user?.fullName || 'Usuario',
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  /**
   * Modifica un egreso existente por su ID.
   * @param id - Identificador del egreso a actualizar
   * @param data - Campos parciales a modificar
   */
  const updateExpense = (id: string, data: Partial<ExpenseInput>): void => {
    setExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  };

  /**
   * Elimina un egreso del estado en memoria por su ID.
   * @param id - Identificador del egreso a eliminar
   */
  const deleteExpense = (id: string): void => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  // =========================================================================
  // CÁLCULOS GLOBALES / HISTÓRICOS (ACCESO EXCLUSIVO PARA ADMINISTRADORES)
  // =========================================================================

  /** Total acumulado histórico de ingresos */
  const totalIncome = useMemo(() => {
    return incomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [incomes]);

  /** Total acumulado histórico de egresos */
  const totalExpense = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [expenses]);

  /** Balance neto histórico global (Ingresos - Egresos) */
  const netBalance = useMemo(() => {
    return totalIncome - totalExpense;
  }, [totalIncome, totalExpense]);

  /** Total histórico acumulado de ventas en Efectivo */
  const incomeByCash = useMemo(() => {
    return incomes
      .filter((item) => item.paymentMethod === 'efectivo')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [incomes]);

  /** Total histórico acumulado de ventas con Tarjeta */
  const incomeByCard = useMemo(() => {
    return incomes
      .filter((item) => item.paymentMethod === 'tarjeta')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [incomes]);

  /** Total histórico acumulado de ventas por Transferencia */
  const incomeByTransfer = useMemo(() => {
    return incomes
      .filter((item) => item.paymentMethod === 'transferencia')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [incomes]);

  // =========================================================================
  // CÁLCULOS EXCLUSIVOS DEL DÍA DE HOY (PARA USUARIO ESTÁNDAR / CUADRE DIARIO)
  // =========================================================================

  /** Lista de ingresos registrados en la fecha actual */
  const todayIncomes = useMemo(() => {
    return incomes.filter((item) => isToday(item.createdAt));
  }, [incomes]);

  /** Lista de egresos registrados en la fecha actual */
  const todayExpenses = useMemo(() => {
    return expenses.filter((item) => isToday(item.createdAt));
  }, [expenses]);

  /** Total de ingresos recaudados exclusivamente en el turno de hoy */
  const todayTotalIncome = useMemo(() => {
    return todayIncomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [todayIncomes]);

  /** Total de egresos realizados exclusivamente en el turno de hoy */
  const todayTotalExpense = useMemo(() => {
    return todayExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [todayExpenses]);

  /** Balance final neto del turno de hoy (Ingresos de hoy - Egresos de hoy) */
  const todayNetBalance = useMemo(() => {
    return todayTotalIncome - todayTotalExpense;
  }, [todayTotalIncome, todayTotalExpense]);

  /** Dinero físico recaudado en efectivo durante el día de hoy */
  const todayIncomeByCash = useMemo(() => {
    return todayIncomes
      .filter((item) => item.paymentMethod === 'efectivo')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [todayIncomes]);

  /** Recaudación procesada por terminales POS (Tarjeta) en el día de hoy */
  const todayIncomeByCard = useMemo(() => {
    return todayIncomes
      .filter((item) => item.paymentMethod === 'tarjeta')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [todayIncomes]);

  /** Recaudación depositada por Transferencias en el día de hoy */
  const todayIncomeByTransfer = useMemo(() => {
    return todayIncomes
      .filter((item) => item.paymentMethod === 'transferencia')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [todayIncomes]);

  return (
    <FinanceContext.Provider
      value={{
        incomes,
        expenses,
        totalIncome,
        totalExpense,
        netBalance,
        incomeByCash,
        incomeByCard,
        incomeByTransfer,
        todayIncomes,
        todayExpenses,
        todayTotalIncome,
        todayTotalExpense,
        todayNetBalance,
        todayIncomeByCash,
        todayIncomeByCard,
        todayIncomeByTransfer,
        addIncome,
        updateIncome,
        deleteIncome,
        addExpense,
        updateExpense,
        deleteExpense,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

/**
 * Hook personalizado para acceder al contexto financiero global.
 * @returns FinanceContextType - Objeto con los datos, totales y operaciones CRUD
 */
export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance debe ser utilizado dentro de un <FinanceProvider>');
  }
  return context;
};

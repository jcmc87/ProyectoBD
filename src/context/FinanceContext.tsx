import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { 
  Income, 
  Expense, 
  IncomeInput, 
  ExpenseInput, 
  FinanceContextType, 
  PaymentMethod, 
  ExpenseCategory 
} from '../types';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Valida si una fecha dada en formato string ISO corresponde exactamente al día de hoy.
 * @param dateStr - Fecha en formato ISO 8601 o timestamp
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
 * Datos simulados iniciales (Mocks) para pruebas locales en caso de no tener Supabase configurado
 */
const INITIAL_INCOMES: Income[] = [
  {
    id: '11111111-0000-0000-0000-000000000001',
    amount: 1250.00,
    paymentMethod: 'efectivo',
    description: 'Venta de productos en mostrador #1',
    createdBy: '00000000-0000-0000-0000-000000000002',
    userName: 'Carlos López (Cajero)',
    createdAt: new Date().toISOString(),
  },
  {
    id: '11111111-0000-0000-0000-000000000002',
    amount: 840.50,
    paymentMethod: 'tarjeta',
    description: 'Cobro de servicio técnico con terminal POS',
    createdBy: '00000000-0000-0000-0000-000000000002',
    userName: 'Carlos López (Cajero)',
    createdAt: new Date().toISOString(),
  },
  {
    id: '11111111-0000-0000-0000-000000000003',
    amount: 2100.00,
    paymentMethod: 'transferencia',
    description: 'Transferencia por factura corporativa #402',
    createdBy: '00000000-0000-0000-0000-000000000001',
    userName: 'Ana Martínez (Admin)',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: '22222222-0000-0000-0000-000000000001',
    category: 'insumos',
    amount: 150.00,
    description: 'Compra de bolsas y rollos de papel para caja',
    createdBy: '00000000-0000-0000-0000-000000000002',
    userName: 'Carlos López (Cajero)',
    createdAt: new Date().toISOString(),
  },
  {
    id: '22222222-0000-0000-0000-000000000002',
    category: 'servicios',
    amount: 350.00,
    description: 'Pago de servicio eléctrico de oficina',
    createdBy: '00000000-0000-0000-0000-000000000002',
    userName: 'Carlos López (Cajero)',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

interface FinanceProviderProps {
  children: ReactNode;
}

/**
 * Proveedor Financiero (FinanceProvider) conectado directamente a Supabase.
 * - Realiza consultas SELECT con JOIN a la tabla public.profiles para obtener nombres de usuario.
 * - Efectúa INSERT, UPDATE y DELETE protegidos por las políticas de Row Level Security (RLS).
 * - Calcula en memoria métricas globales y de la jornada actual (turno de hoy).
 */
export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  const { user } = useAuth();

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Carga los ingresos y egresos directamente desde las tablas de Supabase
   */
  const refreshData = useCallback(async (): Promise<void> => {
    if (!isSupabaseConfigured) {
      setIncomes(INITIAL_INCOMES);
      setExpenses(INITIAL_EXPENSES);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Consultar tabla incomes con join a profiles
      const { data: incomesData, error: incomesError } = await supabase
        .from('incomes')
        .select(`
          id,
          amount,
          payment_method,
          description,
          created_by,
          created_at,
          profiles (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (incomesError) {
        console.error('Error al consultar incomes desde Supabase:', incomesError);
      } else {
        const mappedIncomes: Income[] = (incomesData || []).map((row: any) => ({
          id: row.id,
          amount: Number(row.amount),
          paymentMethod: (row.payment_method as PaymentMethod) || 'efectivo',
          description: row.description || '',
          createdBy: row.created_by,
          createdAt: row.created_at,
          userName: row.profiles?.full_name || (row.created_by === user?.id ? user?.fullName : 'Usuario'),
        }));
        setIncomes(mappedIncomes);
      }

      // 2. Consultar tabla expenses con join a profiles
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id,
          category,
          amount,
          description,
          created_by,
          created_at,
          profiles (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (expensesError) {
        console.error('Error al consultar expenses desde Supabase:', expensesError);
      } else {
        const mappedExpenses: Expense[] = (expensesData || []).map((row: any) => ({
          id: row.id,
          category: (row.category as ExpenseCategory) || 'otros',
          amount: Number(row.amount),
          description: row.description || '',
          createdBy: row.created_by,
          createdAt: row.created_at,
          userName: row.profiles?.full_name || (row.created_by === user?.id ? user?.fullName : 'Usuario'),
        }));
        setExpenses(mappedExpenses);
      }
    } catch (err) {
      console.error('Error inesperado al sincronizar finanzas con Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Sincronizar datos al iniciar y cuando cambie el usuario en sesión
   */
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // =========================================================================
  // OPERACIONES CRUD CONECTADAS A SUPABASE
  // =========================================================================

  /**
   * Inserta un nuevo ingreso en la tabla `incomes` de Supabase
   * @param data - Datos del ingreso (monto, método de pago, descripción)
   */
  const addIncome = async (data: IncomeInput): Promise<boolean> => {
    if (isSupabaseConfigured && user?.id) {
      try {
        const { error } = await supabase.from('incomes').insert([
          {
            amount: data.amount,
            payment_method: data.paymentMethod,
            description: data.description,
            created_by: user.id,
          },
        ]);

        if (error) {
          console.error('Error insertando income en Supabase:', error);
          alert('Error al registrar en Supabase: ' + error.message);
          return false;
        }

        await refreshData();
        return true;
      } catch (err: any) {
        console.error('Error de red al registrar ingreso:', err);
        alert('Error de conexión con la base de datos.');
        return false;
      }
    }

    // Modo local offline
    const newIncome: Income = {
      ...data,
      id: `local-inc-${Date.now()}`,
      createdBy: user?.id || 'local-user',
      userName: user?.fullName || 'Usuario',
      createdAt: new Date().toISOString(),
    };
    setIncomes((prev) => [newIncome, ...prev]);
    return true;
  };

  /**
   * Actualiza un ingreso en la tabla `incomes` de Supabase
   * @param id - UUID del ingreso a actualizar
   * @param data - Campos a modificar
   */
  const updateIncome = async (id: string, data: Partial<IncomeInput>): Promise<boolean> => {
    if (isSupabaseConfigured) {
      try {
        const updatePayload: Record<string, any> = {};
        if (data.amount !== undefined) updatePayload.amount = data.amount;
        if (data.paymentMethod !== undefined) updatePayload.payment_method = data.paymentMethod;
        if (data.description !== undefined) updatePayload.description = data.description;

        const { error } = await supabase
          .from('incomes')
          .update(updatePayload)
          .eq('id', id);

        if (error) {
          console.error('Error al actualizar ingreso en Supabase:', error);
          alert('Error al actualizar: ' + error.message);
          return false;
        }

        await refreshData();
        return true;
      } catch (err: any) {
        console.error('Error de red al actualizar ingreso:', err);
        return false;
      }
    }

    // Modo local offline
    setIncomes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
    return true;
  };

  /**
   * Elimina un ingreso de la tabla `incomes` de Supabase
   * @param id - UUID del ingreso a eliminar
   */
  const deleteIncome = async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('incomes')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error al eliminar ingreso en Supabase:', error);
          alert('Error al eliminar: ' + error.message);
          return false;
        }

        await refreshData();
        return true;
      } catch (err: any) {
        console.error('Error de red al eliminar ingreso:', err);
        return false;
      }
    }

    // Modo local offline
    setIncomes((prev) => prev.filter((item) => item.id !== id));
    return true;
  };

  /**
   * Inserta un nuevo egreso en la tabla `expenses` de Supabase
   * @param data - Datos del egreso (monto, categoría, descripción)
   */
  const addExpense = async (data: ExpenseInput): Promise<boolean> => {
    if (isSupabaseConfigured && user?.id) {
      try {
        const { error } = await supabase.from('expenses').insert([
          {
            amount: data.amount,
            category: data.category,
            description: data.description,
            created_by: user.id,
          },
        ]);

        if (error) {
          console.error('Error insertando expense en Supabase:', error);
          alert('Error al registrar en Supabase: ' + error.message);
          return false;
        }

        await refreshData();
        return true;
      } catch (err: any) {
        console.error('Error de red al registrar egreso:', err);
        alert('Error de conexión con la base de datos.');
        return false;
      }
    }

    // Modo local offline
    const newExpense: Expense = {
      ...data,
      id: `local-exp-${Date.now()}`,
      createdBy: user?.id || 'local-user',
      userName: user?.fullName || 'Usuario',
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return true;
  };

  /**
   * Actualiza un egreso en la tabla `expenses` de Supabase
   * @param id - UUID del egreso a actualizar
   * @param data - Campos a modificar
   */
  const updateExpense = async (id: string, data: Partial<ExpenseInput>): Promise<boolean> => {
    if (isSupabaseConfigured) {
      try {
        const updatePayload: Record<string, any> = {};
        if (data.amount !== undefined) updatePayload.amount = data.amount;
        if (data.category !== undefined) updatePayload.category = data.category;
        if (data.description !== undefined) updatePayload.description = data.description;

        const { error } = await supabase
          .from('expenses')
          .update(updatePayload)
          .eq('id', id);

        if (error) {
          console.error('Error al actualizar egreso en Supabase:', error);
          alert('Error al actualizar: ' + error.message);
          return false;
        }

        await refreshData();
        return true;
      } catch (err: any) {
        console.error('Error de red al actualizar egreso:', err);
        return false;
      }
    }

    // Modo local offline
    setExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
    return true;
  };

  /**
   * Elimina un egreso de la tabla `expenses` de Supabase
   * @param id - UUID del egreso a eliminar
   */
  const deleteExpense = async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error al eliminar egreso en Supabase:', error);
          alert('Error al eliminar: ' + error.message);
          return false;
        }

        await refreshData();
        return true;
      } catch (err: any) {
        console.error('Error de red al eliminar egreso:', err);
        return false;
      }
    }

    // Modo local offline
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    return true;
  };

  // =========================================================================
  // CÁLCULOS GLOBALES (ADMINISTRADOR)
  // =========================================================================

  const totalIncome = useMemo(() => {
    return incomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [incomes]);

  const totalExpense = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [expenses]);

  const netBalance = useMemo(() => {
    return totalIncome - totalExpense;
  }, [totalIncome, totalExpense]);

  const incomeByCash = useMemo(() => {
    return incomes
      .filter((item) => item.paymentMethod === 'efectivo')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [incomes]);

  const incomeByCard = useMemo(() => {
    return incomes
      .filter((item) => item.paymentMethod === 'tarjeta')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [incomes]);

  const incomeByTransfer = useMemo(() => {
    return incomes
      .filter((item) => item.paymentMethod === 'transferencia')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [incomes]);

  // =========================================================================
  // CÁLCULOS EXCLUSIVOS DEL DÍA DE HOY (TURNO DIARIO DE USUARIO)
  // =========================================================================

  const todayIncomes = useMemo(() => {
    return incomes.filter((item) => isToday(item.createdAt));
  }, [incomes]);

  const todayExpenses = useMemo(() => {
    return expenses.filter((item) => isToday(item.createdAt));
  }, [expenses]);

  const todayTotalIncome = useMemo(() => {
    return todayIncomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [todayIncomes]);

  const todayTotalExpense = useMemo(() => {
    return todayExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [todayExpenses]);

  const todayNetBalance = useMemo(() => {
    return todayTotalIncome - todayTotalExpense;
  }, [todayTotalIncome, todayTotalExpense]);

  const todayIncomeByCash = useMemo(() => {
    return todayIncomes
      .filter((item) => item.paymentMethod === 'efectivo')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [todayIncomes]);

  const todayIncomeByCard = useMemo(() => {
    return todayIncomes
      .filter((item) => item.paymentMethod === 'tarjeta')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [todayIncomes]);

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
        isLoading,
        refreshData,
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
 * Hook personalizado para acceder al contexto financiero
 */
export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance debe ser utilizado dentro de un <FinanceProvider>');
  }
  return context;
};

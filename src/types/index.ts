/**
 * DEFINICIÓN DE TIPOS E INTERFACES DEL SISTEMA DE CONTROL FINANCIERO (SUPABASE)
 * Modelos de datos para perfiles de usuarios, ingresos, egresos, cuadre de caja y transacciones.
 */

/**
 * Roles del sistema (controlados por CHECK en base de datos):
 * - 'admin': Acceso total a supervisión, dashboard y gestión con permisos de edición/eliminación.
 * - 'usuario': Operador con acceso exclusivo a registrar y ver su propio turno diario (reinicio a cero cada día).
 */
export type UserRole = 'admin' | 'usuario';

/**
 * Modelo de Usuario autenticado en sesión
 */
export interface User {
  id: string;             // UUID vinculado a auth.users y public.profiles
  email: string;          // Correo de acceso
  fullName: string;       // Nombre completo (desde profiles.full_name)
  role: UserRole;         // Rol ('admin' | 'usuario')
}

/**
 * Mapeo exacto de la fila de la tabla `profiles` en Supabase
 */
export interface ProfileRow {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

/**
 * Métodos de pago permitidos para los ingresos
 */
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

/**
 * Categorías permitidas para los egresos/gastos
 */
export type ExpenseCategory = 'servicios' | 'insumos' | 'salarios' | 'mantenimiento' | 'otros';

/**
 * Registro de un Ingreso (Modelo de frontend)
 */
export interface Income {
  id: string;                       // UUID
  amount: number;                   // Monto en Lempiras (L.)
  paymentMethod: PaymentMethod;     // 'efectivo' | 'tarjeta' | 'transferencia'
  description: string;              // Detalle del ingreso
  createdBy: string;                // UUID del usuario creador (FK profiles.id)
  createdAt: string;                // Fecha de registro ISO
  userName: string;                 // Nombre del creador (obtenido vía join o sesión)
}

/**
 * Mapeo de la fila de la tabla `incomes` en Supabase (snake_case)
 */
export interface IncomeRow {
  id: string;
  amount: number;
  payment_method: PaymentMethod;
  description: string | null;
  created_by: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

/**
 * Registro de un Egreso / Gasto (Modelo de frontend)
 */
export interface Expense {
  id: string;                       // UUID
  category: ExpenseCategory;        // Categoría del gasto
  amount: number;                   // Monto en Lempiras (L.)
  description: string;              // Detalle del gasto
  createdBy: string;                // UUID del usuario creador (FK profiles.id)
  createdAt: string;                // Fecha de registro ISO
  userName: string;                 // Nombre del creador
}

/**
 * Mapeo de la fila de la tabla `expenses` en Supabase (snake_case)
 */
export interface ExpenseRow {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
  created_by: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

/**
 * Transacción unificada para el historial combinado de movimientos
 */
export interface TransactionItem {
  id: string;
  type: 'ingreso' | 'egreso';
  description: string;
  amount: number;
  paymentMethodOrCategory: string;
  createdAt: string;
  userName: string;
}

/**
 * DTO para crear o editar un ingreso
 */
export type IncomeInput = Omit<Income, 'id' | 'createdBy' | 'createdAt' | 'userName'>;

/**
 * DTO para crear o editar un egreso
 */
export type ExpenseInput = Omit<Expense, 'id' | 'createdBy' | 'createdAt' | 'userName'>;

/**
 * Resultado de una operación de autenticación
 */
export interface LoginResult {
  success: boolean;
  message?: string;
}

/**
 * Contrato del Contexto de Autenticación conectado a Supabase
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (role: UserRole) => Promise<void> | void;
  loginWithCredentials: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  signUpWithCredentials?: (email: string, password: string, fullName: string) => Promise<LoginResult>;
}

/**
 * Contrato del Contexto Financiero con operaciones conectadas a Supabase
 */
export interface FinanceContextType {
  // Datos y acumulados totales (para el administrador)
  incomes: Income[];
  expenses: Expense[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  incomeByCash: number;          // Total en efectivo (L.)
  incomeByCard: number;          // Total en tarjeta (L.)
  incomeByTransfer: number;      // Total en transferencia (L.)

  // Datos y acumulados exclusivos del DÍA DE HOY (para el usuario estándar / cuadre diario)
  todayIncomes: Income[];
  todayExpenses: Expense[];
  todayTotalIncome: number;
  todayTotalExpense: number;
  todayNetBalance: number;
  todayIncomeByCash: number;
  todayIncomeByCard: number;
  todayIncomeByTransfer: number;

  // Estado de carga y sincronización
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // Operaciones CRUD asíncronas contra Supabase
  addIncome: (data: IncomeInput) => Promise<boolean | void>;
  updateIncome: (id: string, data: Partial<IncomeInput>) => Promise<boolean | void>;
  deleteIncome: (id: string) => Promise<boolean | void>;
  addExpense: (data: ExpenseInput) => Promise<boolean | void>;
  updateExpense: (id: string, data: Partial<ExpenseInput>) => Promise<boolean | void>;
  deleteExpense: (id: string) => Promise<boolean | void>;
}

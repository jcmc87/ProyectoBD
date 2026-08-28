/**
 * DEFINICIÓN DE TIPOS E INTERFACES DEL SISTEMA DE CONTROL FINANCIERO
 * Modelos de datos para usuarios, ingresos, egresos, cuadre de caja y transacciones.
 */

/**
 * Roles del sistema:
 * - 'admin': Vista de administración y supervisión global con acceso a históricos.
 * - 'usuario': Vista del operador con acceso exclusivo al día en curso (reinicio a cero cada día).
 */
export type UserRole = 'admin' | 'usuario';

/**
 * Modelo de Usuario autenticado
 */
export interface User {
  id: string;             // Identificador único
  email: string;          // Correo de acceso
  fullName: string;       // Nombre completo
  role: UserRole;         // Rol ('admin' | 'usuario')
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
 * Registro de un Ingreso
 */
export interface Income {
  id: string;                       // ID único
  amount: number;                   // Monto en Lempiras (L.)
  paymentMethod: PaymentMethod;     // 'efectivo' | 'tarjeta' | 'transferencia'
  description: string;              // Detalle del ingreso
  createdBy: string;                // ID del usuario creador
  createdAt: string;                // Fecha de registro ISO
  userName: string;                 // Nombre del usuario creador
}

/**
 * Registro de un Egreso / Gasto
 */
export interface Expense {
  id: string;                       // ID único
  category: ExpenseCategory;        // Categoría del gasto
  amount: number;                   // Monto en Lempiras (L.)
  description: string;              // Detalle del gasto
  createdBy: string;                // ID del usuario creador
  createdAt: string;                // Fecha de registro ISO
  userName: string;                 // Nombre del usuario creador
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
 * DTO para crear un ingreso
 */
export type IncomeInput = Omit<Income, 'id' | 'createdBy' | 'createdAt' | 'userName'>;

/**
 * DTO para crear un egreso
 */
export type ExpenseInput = Omit<Expense, 'id' | 'createdBy' | 'createdAt' | 'userName'>;

/**
 * Resultado de una operación de inicio de sesión con credenciales
 */
export interface LoginResult {
  success: boolean;
  message?: string;
}

/**
 * Contrato del Contexto de Autenticación
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (role: UserRole) => void;
  loginWithCredentials: (identifier: string, password: string) => LoginResult;
  logout: () => void;
}

/**
 * Contrato del Contexto Financiero con totales globales y métricas del día actual
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

  // Operaciones CRUD
  addIncome: (data: IncomeInput) => void;
  updateIncome: (id: string, data: Partial<IncomeInput>) => void;
  deleteIncome: (id: string) => void;
  addExpense: (data: ExpenseInput) => void;
  updateExpense: (id: string, data: Partial<ExpenseInput>) => void;
  deleteExpense: (id: string) => void;
}

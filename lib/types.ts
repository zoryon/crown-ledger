export type Account = {
  id: number;
  user_id: number | null;
  name: string;
  type: string;
  institution: string;
  balance: number;
  color: string;
  sort_order: number;
  monthly_change?: number;
  monthly_change_percent?: number | null;
  recent_transactions?: Transaction[];
  created_at: string;
};

export type Category = {
  id: number;
  name: string;
  group_name: string;
  color: string;
};

export type Transaction = {
  id: number;
  account_id: number;
  category_id: number;
  merchant: string;
  notes: string | null;
  amount: number;
  date: string;
  status: "cleared" | "pending";
  is_recurring: boolean;
  recurrence_frequency: "none" | "monthly";
  next_occurrence_date: string | null;
  recurring_parent_id: number | null;
  account_name: string;
  category_name: string;
  category_color: string;
};

export type RecurringRule = {
  id: number;
  account_id: number;
  transfer_to_account_id: number | null;
  category_id: number;
  merchant: string;
  notes: string | null;
  amount: number;
  status: "cleared" | "pending";
  frequency: "monthly";
  next_occurrence_date: string;
  end_month: string | null;
  created_at: string;
  updated_at: string;
  account_name: string;
  transfer_to_account_name: string | null;
  category_name: string;
  category_color: string;
};

export type SavingsInterestRule = {
  id: number;
  account_id: number;
  gross_annual_rate: number;
  tax_rate: number;
  start_date: string;
  end_date: string | null;
  last_accrual_date: string | null;
  accrued_gross_remainder: number;
  accrued_tax_remainder: number;
  created_at: string;
  updated_at: string;
};

export type Budget = {
  id: number;
  user_id: number | null;
  category_id: number;
  category_name: string;
  group_name: string;
  color: string;
  amount: number;
  spent: number;
  remaining: number;
};

export type Goal = {
  id: number;
  user_id: number | null;
  name: string;
  target_amount: number;
  current_amount: number;
  due_date: string;
  color: string;
};

export type UserRole = "superuser" | "user";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
};

export type CashFlowPoint = {
  month: string;
  income: number;
  expenses: number;
  net: number;
};

export type HighYieldInterestPoint = {
  month: string;
  gross: number;
  tax: number;
  net: number;
};

export type AccountDailyHistoryPoint = {
  date: string;
  balance: number;
  change: number;
  income: number;
  expenses: number;
};

export type AppSummary = {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  cashFlow: CashFlowPoint[];
  highYieldInterest: HighYieldInterestPoint[];
  accountDailyHistory: AccountDailyHistoryPoint[];
  recurring: RecurringRule[];
  savingsInterestRules: SavingsInterestRule[];
  totals: {
    netWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
    budgeted: number;
    budgetSpent: number;
  };
};

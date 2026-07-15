export type Account = {
  id: number;
  name: string;
  type: string;
  institution: string;
  balance: number;
  color: string;
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
  account_name: string;
  category_name: string;
  category_color: string;
};

export type Budget = {
  id: number;
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
  name: string;
  target_amount: number;
  current_amount: number;
  due_date: string;
  color: string;
};

export type CashFlowPoint = {
  month: string;
  income: number;
  expenses: number;
  net: number;
};

export type AppSummary = {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  cashFlow: CashFlowPoint[];
  recurring: Transaction[];
  totals: {
    netWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
    budgeted: number;
    budgetSpent: number;
  };
};

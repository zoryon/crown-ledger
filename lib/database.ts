import fs from "node:fs";
import path from "node:path";
import initSqlJs, {
  type BindParams,
  type Database,
  type SqlValue,
} from "sql.js";
import type {
  Account,
  AppSummary,
  Budget,
  CashFlowPoint,
  Category,
  Goal,
  Transaction,
} from "@/lib/types";

const dbDirectory = path.join(process.cwd(), "data");
const dbPath = path.join(dbDirectory, "monarch.sqlite");
const wasmPath = path.join(
  process.cwd(),
  "node_modules",
  "sql.js",
  "dist",
  "sql-wasm.wasm",
);

type Row = Record<string, SqlValue>;

function getMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function monthDate(monthOffset: number, day: number) {
  const date = addMonths(new Date(), monthOffset);
  date.setDate(Math.min(day, 28));
  return date.toISOString().slice(0, 10);
}

function rows<T>(db: Database, sql: string, params?: BindParams): T[] {
  const result = db.exec(sql, params);

  if (!result[0]) {
    return [];
  }

  const { columns, values } = result[0];
  return values.map((valueRow) =>
    columns.reduce<Row>((record, column, index) => {
      record[column] = valueRow[index];
      return record;
    }, {}) as T,
  );
}

function one<T>(db: Database, sql: string, params?: BindParams): T | undefined {
  return rows<T>(db, sql, params)[0];
}

function persist(db: Database) {
  fs.mkdirSync(dbDirectory, { recursive: true });
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

function lastInsertId(db: Database) {
  return Number(
    one<{ id: number }>(db, "select last_insert_rowid() as id")?.id ?? 0,
  );
}

function createSchema(db: Database) {
  db.run(`
    create table if not exists accounts (
      id integer primary key autoincrement,
      name text not null,
      type text not null,
      institution text not null,
      balance real not null default 0,
      color text not null,
      created_at text not null default current_timestamp
    );

    create table if not exists categories (
      id integer primary key autoincrement,
      name text not null unique,
      group_name text not null,
      color text not null
    );

    create table if not exists transactions (
      id integer primary key autoincrement,
      account_id integer not null references accounts(id) on delete cascade,
      category_id integer not null references categories(id),
      merchant text not null,
      notes text,
      amount real not null,
      date text not null,
      status text not null check(status in ('cleared', 'pending')),
      is_recurring integer not null default 0,
      created_at text not null default current_timestamp
    );

    create table if not exists budgets (
      id integer primary key autoincrement,
      category_id integer not null unique references categories(id) on delete cascade,
      amount real not null default 0
    );

    create table if not exists goals (
      id integer primary key autoincrement,
      name text not null,
      target_amount real not null,
      current_amount real not null default 0,
      due_date text not null,
      color text not null
    );
  `);
}

function ensureDefaultCategories(db: Database) {
  const categorySeed = [
    ["Paycheck", "Income", "#219a68"],
    ["Investments", "Income", "#4f7cff"],
    ["Housing", "Fixed", "#334155"],
    ["Groceries", "Flexible", "#ef7d3c"],
    ["Dining", "Flexible", "#d94864"],
    ["Transportation", "Flexible", "#1d9a9a"],
    ["Shopping", "Flexible", "#8b5cf6"],
    ["Travel", "Lifestyle", "#e0a928"],
    ["Subscriptions", "Fixed", "#64748b"],
    ["Utilities", "Fixed", "#0f766e"],
  ];

  for (const category of categorySeed) {
    db.run(
      "insert or ignore into categories (name, group_name, color) values (?, ?, ?)",
      category,
    );
  }
}

export function seedDatabase(db: Database) {
  ensureDefaultCategories(db);

  const categories = rows<Category>(db, "select * from categories");
  const categoryId = new Map(categories.map((category) => [category.name, category.id]));

  const accountSeed = [
    ["Everyday Checking", "Checking", "Northstar Bank", 12840.32, "#102a43"],
    ["High Yield Savings", "Savings", "Alto Reserve", 28620.88, "#219a68"],
    ["Travel Rewards Card", "Credit Card", "Copper Card", -1840.12, "#d94864"],
    ["Brokerage", "Investment", "Beacon Invest", 54890.5, "#4f7cff"],
    ["Mortgage", "Loan", "Homestead Lending", -243120.74, "#64748b"],
  ];

  for (const account of accountSeed) {
    db.run(
      "insert into accounts (name, type, institution, balance, color) values (?, ?, ?, ?, ?)",
      account,
    );
  }

  const accountRows = rows<Account>(db, "select * from accounts");
  const accountId = new Map(accountRows.map((account) => [account.name, account.id]));

  const currentTransactions = [
    ["Everyday Checking", "Paycheck", "Orbit Labs Payroll", 8700, daysAgo(3), "cleared", 1],
    ["Brokerage", "Investments", "Dividend Sweep", 242.18, daysAgo(7), "cleared", 1],
    ["Everyday Checking", "Housing", "Homestead Lending", -2850, daysAgo(1), "cleared", 1],
    ["Travel Rewards Card", "Groceries", "Olive Market", -162.42, daysAgo(2), "cleared", 0],
    ["Travel Rewards Card", "Dining", "Juniper Table", -84.3, daysAgo(5), "cleared", 0],
    ["Everyday Checking", "Utilities", "City Power", -142.16, daysAgo(6), "pending", 1],
    ["Travel Rewards Card", "Transportation", "Metro Pass", -74, daysAgo(8), "cleared", 1],
    ["Travel Rewards Card", "Shopping", "Oak & Thread", -236.9, daysAgo(10), "cleared", 0],
    ["Travel Rewards Card", "Subscriptions", "StreamBox", -22.99, daysAgo(11), "cleared", 1],
    ["Travel Rewards Card", "Travel", "BlueRail Weekend", -318.5, daysAgo(13), "cleared", 0],
    ["Everyday Checking", "Groceries", "Field Pantry", -94.74, daysAgo(16), "cleared", 0],
    ["Travel Rewards Card", "Dining", "North End Coffee", -18.2, daysAgo(18), "cleared", 0],
  ];

  for (const transaction of currentTransactions) {
    const [account, category, merchant, amount, date, status, recurring] = transaction;
    db.run(
      `insert into transactions
        (account_id, category_id, merchant, amount, date, status, is_recurring)
       values (?, ?, ?, ?, ?, ?, ?)`,
      [
        accountId.get(String(account)) ?? 1,
        categoryId.get(String(category)) ?? 1,
        merchant,
        amount,
        date,
        status,
        recurring,
      ],
    );
  }

  for (let month = -5; month < 0; month += 1) {
    const income = 8200 + Math.round(Math.random() * 600);
    const expenses = [
      ["Housing", "Homestead Lending", -2850, 1],
      ["Groceries", "Market Basket", -640 - Math.round(Math.random() * 180), 6],
      ["Dining", "Restaurants", -360 - Math.round(Math.random() * 120), 12],
      ["Transportation", "Transit & Fuel", -210 - Math.round(Math.random() * 90), 17],
      ["Shopping", "Household", -420 - Math.round(Math.random() * 280), 20],
      ["Utilities", "Utilities", -290 - Math.round(Math.random() * 80), 24],
    ];

    db.run(
      `insert into transactions
        (account_id, category_id, merchant, amount, date, status, is_recurring)
       values (?, ?, ?, ?, ?, 'cleared', 1)`,
      [
        accountId.get("Everyday Checking") ?? 1,
        categoryId.get("Paycheck") ?? 1,
        "Orbit Labs Payroll",
        income,
        monthDate(month, 3),
      ],
    );

    for (const [category, merchant, amount, day] of expenses) {
      db.run(
        `insert into transactions
          (account_id, category_id, merchant, amount, date, status, is_recurring)
         values (?, ?, ?, ?, ?, 'cleared', ?)`,
        [
          category === "Housing"
            ? (accountId.get("Everyday Checking") ?? 1)
            : (accountId.get("Travel Rewards Card") ?? 1),
          categoryId.get(String(category)) ?? 1,
          merchant,
          amount,
          monthDate(month, Number(day)),
          category === "Housing" ? 1 : 0,
        ],
      );
    }
  }

  const budgetSeed = [
    ["Housing", 2850],
    ["Groceries", 900],
    ["Dining", 550],
    ["Transportation", 330],
    ["Shopping", 700],
    ["Travel", 500],
    ["Subscriptions", 160],
    ["Utilities", 340],
  ];

  for (const [category, amount] of budgetSeed) {
    db.run("insert into budgets (category_id, amount) values (?, ?)", [
      categoryId.get(String(category)) ?? 1,
      amount,
    ]);
  }

  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const goals = [
    ["Emergency Fund", 45000, 28620.88, nextYear.toISOString().slice(0, 10), "#219a68"],
    ["Japan Spring Trip", 9000, 4100, monthDate(8, 15), "#e0a928"],
    ["Kitchen Refresh", 18000, 7200, monthDate(10, 1), "#d94864"],
  ];

  for (const goal of goals) {
    db.run(
      "insert into goals (name, target_amount, current_amount, due_date, color) values (?, ?, ?, ?, ?)",
      goal,
    );
  }
}

async function openDatabase() {
  fs.mkdirSync(dbDirectory, { recursive: true });
  const SQL = await initSqlJs({
    locateFile: () => wasmPath,
  });
  const db = fs.existsSync(dbPath)
    ? new SQL.Database(fs.readFileSync(dbPath))
    : new SQL.Database();

  db.run("pragma foreign_keys = on");
  createSchema(db);
  ensureDefaultCategories(db);
  persist(db);
  return db;
}

export async function getDb() {
  return openDatabase();
}

export async function getSummary(): Promise<AppSummary> {
  const db = await getDb();
  const accounts = rows<Account>(
    db,
    "select * from accounts order by case type when 'Checking' then 1 when 'Savings' then 2 when 'Credit Card' then 3 when 'Investment' then 4 else 5 end, name",
  );
  const categories = rows<Category>(db, "select * from categories order by group_name, name");
  const transactions = rows<Omit<Transaction, "is_recurring"> & { is_recurring: number }>(
    db,
    `select transactions.*, accounts.name as account_name,
      categories.name as category_name, categories.color as category_color
     from transactions
     join accounts on accounts.id = transactions.account_id
     join categories on categories.id = transactions.category_id
     order by date desc, transactions.id desc
     limit 80`,
  ).map((transaction) => ({
    ...transaction,
    is_recurring: Boolean(transaction.is_recurring),
  }));

  const currentMonth = getMonthKey();
  const spendingByCategory = new Map<number, number>();

  for (const transaction of transactions) {
    if (transaction.date.startsWith(currentMonth) && transaction.amount < 0) {
      spendingByCategory.set(
        transaction.category_id,
        (spendingByCategory.get(transaction.category_id) ?? 0) +
          Math.abs(transaction.amount),
      );
    }
  }

  const budgets = rows<
    Omit<Budget, "spent" | "remaining"> & {
      category_name: string;
      group_name: string;
      color: string;
    }
  >(
    db,
    `select budgets.id, budgets.category_id, budgets.amount,
      categories.name as category_name, categories.group_name, categories.color
     from budgets
     join categories on categories.id = budgets.category_id
     order by categories.group_name, categories.name`,
  ).map((budget) => {
    const spent = spendingByCategory.get(budget.category_id) ?? 0;
    return {
      ...budget,
      spent,
      remaining: budget.amount - spent,
    };
  });

  const goals = rows<Goal>(db, "select * from goals order by due_date");
  const cashFlow = buildCashFlow(transactions);
  const monthlyIncome = transactions
    .filter((transaction) => transaction.date.startsWith(currentMonth) && transaction.amount > 0)
    .reduce((total, transaction) => total + transaction.amount, 0);
  const monthlyExpenses = transactions
    .filter((transaction) => transaction.date.startsWith(currentMonth) && transaction.amount < 0)
    .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  const budgeted = budgets.reduce((total, budget) => total + budget.amount, 0);
  const budgetSpent = budgets.reduce((total, budget) => total + budget.spent, 0);

  return {
    accounts,
    categories,
    transactions,
    budgets,
    goals,
    cashFlow,
    recurring: transactions.filter((transaction) => transaction.is_recurring).slice(0, 8),
    totals: {
      netWorth: accounts.reduce((total, account) => total + account.balance, 0),
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
      budgeted,
      budgetSpent,
    },
  };
}

function buildCashFlow(transactions: Transaction[]): CashFlowPoint[] {
  const points: CashFlowPoint[] = [];

  for (let index = 5; index >= 0; index -= 1) {
    const date = addMonths(new Date(), -index);
    const key = getMonthKey(date);
    const monthTransactions = transactions.filter((transaction) =>
      transaction.date.startsWith(key),
    );
    const income = monthTransactions
      .filter((transaction) => transaction.amount > 0)
      .reduce((total, transaction) => total + transaction.amount, 0);
    const expenses = monthTransactions
      .filter((transaction) => transaction.amount < 0)
      .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);

    points.push({
      month: date.toLocaleDateString("en", { month: "short" }),
      income,
      expenses,
      net: income - expenses,
    });
  }

  return points;
}

export async function createAccount(input: Partial<Account>) {
  const db = await getDb();
  db.run(
    "insert into accounts (name, type, institution, balance, color) values (?, ?, ?, ?, ?)",
    [
      String(input.name ?? "New account"),
      String(input.type ?? "Checking"),
      String(input.institution ?? "Manual"),
      Number(input.balance ?? 0),
      String(input.color ?? "#219a68"),
    ],
  );
  persist(db);
  return one<Account>(db, "select * from accounts where id = ?", [lastInsertId(db)]);
}

export async function updateAccount(id: number, input: Partial<Account>) {
  const db = await getDb();
  db.run(
    "update accounts set name = ?, type = ?, institution = ?, balance = ?, color = ? where id = ?",
    [
      String(input.name ?? ""),
      String(input.type ?? "Checking"),
      String(input.institution ?? "Manual"),
      Number(input.balance ?? 0),
      String(input.color ?? "#219a68"),
      id,
    ],
  );
  persist(db);
  return one<Account>(db, "select * from accounts where id = ?", [id]);
}

export async function deleteAccount(id: number) {
  const db = await getDb();
  db.run("delete from accounts where id = ?", [id]);
  persist(db);
}

export async function createTransaction(input: Partial<Transaction>) {
  const db = await getDb();
  db.run(
    `insert into transactions
      (account_id, category_id, merchant, notes, amount, date, status, is_recurring)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      Number(input.account_id ?? 1),
      Number(input.category_id ?? 1),
      String(input.merchant ?? "Manual transaction"),
      input.notes ? String(input.notes) : null,
      Number(input.amount ?? 0),
      String(input.date ?? new Date().toISOString().slice(0, 10)),
      input.status === "pending" ? "pending" : "cleared",
      input.is_recurring ? 1 : 0,
    ],
  );
  persist(db);
  return one<{ id: number }>(db, "select last_insert_rowid() as id");
}

export async function updateTransaction(id: number, input: Partial<Transaction>) {
  const db = await getDb();
  db.run(
    `update transactions
     set account_id = ?, category_id = ?, merchant = ?, notes = ?, amount = ?,
      date = ?, status = ?, is_recurring = ?
     where id = ?`,
    [
      Number(input.account_id ?? 1),
      Number(input.category_id ?? 1),
      String(input.merchant ?? "Manual transaction"),
      input.notes ? String(input.notes) : null,
      Number(input.amount ?? 0),
      String(input.date ?? new Date().toISOString().slice(0, 10)),
      input.status === "pending" ? "pending" : "cleared",
      input.is_recurring ? 1 : 0,
      id,
    ],
  );
  persist(db);
}

export async function deleteTransaction(id: number) {
  const db = await getDb();
  db.run("delete from transactions where id = ?", [id]);
  persist(db);
}

export async function updateBudget(id: number, amount: number) {
  const db = await getDb();
  db.run("update budgets set amount = ? where id = ?", [amount, id]);
  persist(db);
}

export async function createBudget(input: Partial<Budget>) {
  const db = await getDb();
  const categoryId = Number(input.category_id ?? 0);
  const amount = Number(input.amount ?? 0);

  if (!categoryId || amount <= 0) {
    throw new Error("A category and positive amount are required.");
  }

  db.run("insert into budgets (category_id, amount) values (?, ?)", [
    categoryId,
    amount,
  ]);
  persist(db);
}

export async function importSnapshot(snapshot: AppSummary) {
  const db = await getDb();

  if (
    !Array.isArray(snapshot.accounts) ||
    !Array.isArray(snapshot.categories) ||
    !Array.isArray(snapshot.transactions) ||
    !Array.isArray(snapshot.budgets) ||
    !Array.isArray(snapshot.goals)
  ) {
    throw new Error("Invalid snapshot format.");
  }

  const accountIds = new Set(snapshot.accounts.map((account) => Number(account.id)));
  const categoryIds = new Set(snapshot.categories.map((category) => Number(category.id)));

  for (const transaction of snapshot.transactions) {
    if (
      !accountIds.has(Number(transaction.account_id)) ||
      !categoryIds.has(Number(transaction.category_id))
    ) {
      throw new Error(
        `Transaction "${transaction.merchant}" references a missing account or category.`,
      );
    }
  }

  for (const budget of snapshot.budgets) {
    if (!categoryIds.has(Number(budget.category_id))) {
      throw new Error(`Budget "${budget.category_name}" references a missing category.`);
    }
  }

  db.run("begin transaction");

  try {
    db.run(`
      delete from transactions;
      delete from budgets;
      delete from goals;
      delete from accounts;
      delete from categories;
      delete from sqlite_sequence
        where name in ('transactions', 'budgets', 'goals', 'accounts', 'categories');
    `);

    for (const category of snapshot.categories) {
      db.run(
        "insert into categories (id, name, group_name, color) values (?, ?, ?, ?)",
        [
          Number(category.id),
          String(category.name),
          String(category.group_name),
          String(category.color),
        ],
      );
    }

    if (snapshot.categories.length === 0) {
      ensureDefaultCategories(db);
    }

    for (const account of snapshot.accounts) {
      db.run(
        `insert into accounts
          (id, name, type, institution, balance, color, created_at)
         values (?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(account.id),
          String(account.name),
          String(account.type),
          String(account.institution),
          Number(account.balance),
          String(account.color),
          String(account.created_at ?? new Date().toISOString()),
        ],
      );
    }

    for (const goal of snapshot.goals) {
      db.run(
        `insert into goals
          (id, name, target_amount, current_amount, due_date, color)
         values (?, ?, ?, ?, ?, ?)`,
        [
          Number(goal.id),
          String(goal.name),
          Number(goal.target_amount),
          Number(goal.current_amount),
          String(goal.due_date),
          String(goal.color),
        ],
      );
    }

    for (const budget of snapshot.budgets) {
      db.run("insert into budgets (id, category_id, amount) values (?, ?, ?)", [
        Number(budget.id),
        Number(budget.category_id),
        Number(budget.amount),
      ]);
    }

    for (const transaction of snapshot.transactions) {
      db.run(
        `insert into transactions
          (id, account_id, category_id, merchant, notes, amount, date, status, is_recurring)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(transaction.id),
          Number(transaction.account_id),
          Number(transaction.category_id),
          String(transaction.merchant),
          transaction.notes ? String(transaction.notes) : null,
          Number(transaction.amount),
          String(transaction.date),
          transaction.status === "pending" ? "pending" : "cleared",
          transaction.is_recurring ? 1 : 0,
        ],
      );
    }

    db.run("commit");
  } catch (error) {
    db.run("rollback");
    throw error;
  }

  persist(db);
}

export async function createGoal(input: Partial<Goal>) {
  const db = await getDb();
  db.run(
    "insert into goals (name, target_amount, current_amount, due_date, color) values (?, ?, ?, ?, ?)",
    [
      String(input.name ?? "New goal"),
      Number(input.target_amount ?? 1000),
      Number(input.current_amount ?? 0),
      String(input.due_date ?? monthDate(6, 1)),
      String(input.color ?? "#e0a928"),
    ],
  );
  persist(db);
}

export async function updateGoal(id: number, input: Partial<Goal>) {
  const db = await getDb();
  db.run(
    "update goals set name = ?, target_amount = ?, current_amount = ?, due_date = ?, color = ? where id = ?",
    [
      String(input.name ?? "Goal"),
      Number(input.target_amount ?? 1000),
      Number(input.current_amount ?? 0),
      String(input.due_date ?? monthDate(6, 1)),
      String(input.color ?? "#e0a928"),
      id,
    ],
  );
  persist(db);
}

export async function deleteGoal(id: number) {
  const db = await getDb();
  db.run("delete from goals where id = ?", [id]);
  persist(db);
}

export async function clearWorkspaceData() {
  const db = await getDb();
  db.run(`
    delete from transactions;
    delete from budgets;
    delete from goals;
    delete from accounts;
    delete from sqlite_sequence
      where name in ('transactions', 'budgets', 'goals', 'accounts');
  `);
  ensureDefaultCategories(db);
  persist(db);
}

export async function removeDemoData() {
  const db = await getDb();
  db.run(`
    delete from transactions
      where merchant in (
        'Orbit Labs Payroll',
        'Dividend Sweep',
        'Homestead Lending',
        'Olive Market',
        'Juniper Table',
        'City Power',
        'Metro Pass',
        'Oak & Thread',
        'StreamBox',
        'BlueRail Weekend',
        'Field Pantry',
        'North End Coffee',
        'Market Basket',
        'Restaurants',
        'Transit & Fuel',
        'Household',
        'Utilities'
      );

    delete from budgets;

    delete from goals
      where name in ('Emergency Fund', 'Japan Spring Trip', 'Kitchen Refresh');

    delete from accounts
      where name in (
        'Everyday Checking',
        'High Yield Savings',
        'Travel Rewards Card',
        'Brokerage',
        'Mortgage'
      );
  `);
  ensureDefaultCategories(db);
  persist(db);
}

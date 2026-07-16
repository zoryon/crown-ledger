import fs from "node:fs";
import path from "node:path";
import initSqlJs, {
  type BindParams,
  type Database,
  type SqlValue,
} from "sql.js";
import type {
  Account,
  AccountDailyHistoryPoint,
  AppSummary,
  AuthUser,
  Budget,
  CashFlowPoint,
  Category,
  Goal,
  HighYieldInterestPoint,
  RecurringRule,
  SavingsInterestRule,
  Transaction,
  UserRole,
} from "@/lib/types";

const dbDirectory = path.join(process.cwd(), "data");
const dbPath = path.join(dbDirectory, "crown.sqlite");
const wasmPath = path.join(
  process.cwd(),
  "node_modules",
  "sql.js",
  "dist",
  "sql-wasm.wasm",
);
const sqliteHeader = Buffer.from("SQLite format 3\0", "binary");
const savingsInterestPostingHour = 4;
const legacyWorkspaceOwnerEmail = "gioelespata@gmail.com";

type Row = Record<string, SqlValue>;

type BackupUser = AuthUser & {
  password_hash: string;
};

type BackupAppMeta = {
  key: string;
  value: string;
};

type BackupSqliteSequence = {
  name: string;
  seq: number;
};

type BackupSnapshot = Omit<
  AppSummary,
  "cashFlow" | "highYieldInterest" | "accountDailyHistory" | "totals"
> & {
  backupVersion?: number;
  exportedAt?: string;
  users?: BackupUser[];
  appMeta?: BackupAppMeta[];
  sqliteSequence?: BackupSqliteSequence[];
};

function getMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function addDays(value: string, amount: number) {
  const date = parseDateString(value);
  date.setDate(date.getDate() + amount);
  return toDateString(date);
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

function toDateString(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseDateString(value: string) {
  return new Date(`${value}T00:00:00`);
}

function isDateString(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isMonthString(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value));
}

function isNetWorthAccount(account: Account) {
  return account.type !== "Investment" && account.type !== "PAC";
}

function isOccurrenceWithinEndMonth(date: string, endMonth: string | null) {
  return !endMonth || date.slice(0, 7) <= endMonth;
}

function addMonthlyOccurrence(value: string) {
  const current = parseDateString(value);
  const originalDay = current.getDate();
  const next = new Date(current);
  next.setDate(1);
  next.setMonth(next.getMonth() + 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(originalDay, lastDay));
  return toDateString(next);
}

function todayDateString() {
  return toDateString(new Date());
}

function daysInYear(date: Date) {
  const year = date.getFullYear();
  return new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
}

function savingsInterestLastEligibleDate(now = new Date()) {
  const date = new Date(now);
  date.setDate(date.getDate() - (date.getHours() >= savingsInterestPostingHour ? 1 : 2));
  return toDateString(date);
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

function isSQLiteDatabaseFile(filePath: string) {
  const header = Buffer.alloc(sqliteHeader.length);
  const file = fs.openSync(filePath, "r");

  try {
    const bytesRead = fs.readSync(
      file,
      header,
      0,
      sqliteHeader.length,
      0,
    );

    return bytesRead === sqliteHeader.length && header.equals(sqliteHeader);
  } finally {
    fs.closeSync(file);
  }
}

function moveInvalidDatabase(reason: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const invalidPath = `${dbPath}.invalid-${timestamp}`;

  fs.renameSync(dbPath, invalidPath);
  console.warn(
    `Moved invalid SQLite database (${reason}) to ${path.relative(
      process.cwd(),
      invalidPath,
    )}.`,
  );
}

function createSchema(db: Database) {
  db.run(`
    create table if not exists accounts (
      id integer primary key autoincrement,
      user_id integer references users(id) on delete cascade,
      name text not null,
      type text not null,
      institution text not null,
      balance real not null default 0,
      color text not null,
      sort_order integer not null default 0,
      created_at text not null default current_timestamp
    );

    create table if not exists categories (
      id integer primary key autoincrement,
      name text not null unique,
      group_name text not null,
      color text not null
    );

    create table if not exists app_meta (
      key text primary key,
      value text not null
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
      recurrence_frequency text not null default 'none'
        check(recurrence_frequency in ('none', 'monthly')),
      next_occurrence_date text,
      recurring_parent_id integer,
      created_at text not null default current_timestamp
    );

    create table if not exists recurring_rules (
      id integer primary key autoincrement,
      account_id integer not null references accounts(id) on delete cascade,
      transfer_to_account_id integer references accounts(id) on delete cascade,
      category_id integer not null references categories(id),
      merchant text not null,
      notes text,
      amount real not null,
      status text not null check(status in ('cleared', 'pending')),
      frequency text not null default 'monthly' check(frequency in ('monthly')),
      next_occurrence_date text not null,
      end_month text,
      created_at text not null default current_timestamp,
      updated_at text not null default current_timestamp
    );

    create table if not exists savings_interest_rules (
      id integer primary key autoincrement,
      account_id integer not null unique references accounts(id) on delete cascade,
      gross_annual_rate real not null,
      tax_rate real not null default 26,
      start_date text not null,
      end_date text,
      last_accrual_date text,
      accrued_gross_remainder real not null default 0,
      accrued_tax_remainder real not null default 0,
      created_at text not null default current_timestamp,
      updated_at text not null default current_timestamp
    );

    create table if not exists budgets (
      id integer primary key autoincrement,
      user_id integer references users(id) on delete cascade,
      category_id integer not null references categories(id) on delete cascade,
      amount real not null default 0,
      unique(user_id, category_id)
    );

    create table if not exists goals (
      id integer primary key autoincrement,
      user_id integer references users(id) on delete cascade,
      name text not null,
      target_amount real not null,
      current_amount real not null default 0,
      due_date text not null,
      color text not null
    );

    create table if not exists users (
      id integer primary key autoincrement,
      name text not null,
      email text not null unique,
      password_hash text not null,
      role text not null check(role in ('superuser', 'user')),
      created_at text not null default current_timestamp
    );

    create table if not exists sessions (
      token_hash text primary key,
      user_id integer not null references users(id) on delete cascade,
      expires_at text not null,
      created_at text not null default current_timestamp,
      last_seen_at text not null default current_timestamp
    );

    create index if not exists sessions_user_id_idx on sessions(user_id);
    create index if not exists accounts_user_id_idx on accounts(user_id);
    create index if not exists budgets_user_id_idx on budgets(user_id);
    create index if not exists goals_user_id_idx on goals(user_id);
    create index if not exists sessions_expires_at_idx on sessions(expires_at);
    create index if not exists recurring_rules_due_idx
      on recurring_rules(frequency, next_occurrence_date);
    create index if not exists savings_interest_rules_due_idx
      on savings_interest_rules(start_date, end_date, last_accrual_date);
  `);
}

function hasColumn(db: Database, table: string, column: string) {
  return rows<{ name: string }>(db, `pragma table_info(${table})`).some(
    (info) => info.name === column,
  );
}

function tableSql(db: Database, table: string) {
  return (
    one<{ sql: string }>(
      db,
      "select sql from sqlite_master where type = 'table' and name = ?",
      [table],
    )?.sql ?? ""
  );
}

function legacyWorkspaceOwnerId(db: Database) {
  return (
    one<{ id: number }>(
      db,
      `select id
       from users
       where lower(email) = lower(?)
       limit 1`,
      [legacyWorkspaceOwnerEmail],
    )?.id ?? null
  );
}

function assignUnownedWorkspaceDataToUser(db: Database, userId: number) {
  db.run("update accounts set user_id = ? where user_id is null", [userId]);
  db.run("update budgets set user_id = ? where user_id is null", [userId]);
  db.run("update goals set user_id = ? where user_id is null", [userId]);
}

function rebuildBudgetsForOwnership(db: Database) {
  const hasUserId = hasColumn(db, "budgets", "user_id");
  const fallbackOwnerId = legacyWorkspaceOwnerId(db);
  const userIdExpression = hasUserId
    ? "user_id"
    : fallbackOwnerId === null
      ? "null"
      : String(fallbackOwnerId);

  db.run(`
    create table budgets_next (
      id integer primary key autoincrement,
      user_id integer references users(id) on delete cascade,
      category_id integer not null references categories(id) on delete cascade,
      amount real not null default 0,
      unique(user_id, category_id)
    );

    insert into budgets_next (id, user_id, category_id, amount)
    select id, ${userIdExpression}, category_id, amount
    from budgets;

    drop table budgets;
    alter table budgets_next rename to budgets;
  `);
}

function migrateSchema(db: Database) {
  if (!hasColumn(db, "accounts", "user_id")) {
    db.run("alter table accounts add column user_id integer references users(id) on delete cascade");
  }

  if (!hasColumn(db, "accounts", "sort_order")) {
    db.run("alter table accounts add column sort_order integer not null default 0");
    db.run("update accounts set sort_order = id where sort_order = 0");
  }

  if (!hasColumn(db, "goals", "user_id")) {
    db.run("alter table goals add column user_id integer references users(id) on delete cascade");
  }

  if (
    !hasColumn(db, "budgets", "user_id") ||
    tableSql(db, "budgets").includes("category_id integer not null unique")
  ) {
    rebuildBudgetsForOwnership(db);
  }

  const workspaceOwnerId = legacyWorkspaceOwnerId(db);

  if (workspaceOwnerId !== null) {
    assignUnownedWorkspaceDataToUser(db, workspaceOwnerId);
  }

  if (!hasColumn(db, "transactions", "recurrence_frequency")) {
    db.run(
      "alter table transactions add column recurrence_frequency text not null default 'none'",
    );
  }

  if (!hasColumn(db, "transactions", "next_occurrence_date")) {
    db.run("alter table transactions add column next_occurrence_date text");
  }

  if (!hasColumn(db, "transactions", "recurring_parent_id")) {
    db.run("alter table transactions add column recurring_parent_id integer");
  }

  if (!hasColumn(db, "recurring_rules", "transfer_to_account_id")) {
    db.run("alter table recurring_rules add column transfer_to_account_id integer");
  }

  if (!hasColumn(db, "recurring_rules", "end_month")) {
    db.run("alter table recurring_rules add column end_month text");
  }

  db.run(`
    drop index if exists transactions_recurring_instance_idx;
    create index if not exists transactions_recurring_due_idx
      on transactions(is_recurring, recurrence_frequency, next_occurrence_date);
    create unique index if not exists transactions_recurring_instance_idx
      on transactions(recurring_parent_id, date, account_id);
    create index if not exists accounts_user_id_idx on accounts(user_id);
    create index if not exists budgets_user_id_idx on budgets(user_id);
    create index if not exists goals_user_id_idx on goals(user_id);
    create index if not exists recurring_rules_due_idx
      on recurring_rules(frequency, next_occurrence_date);
    create index if not exists savings_interest_rules_due_idx
      on savings_interest_rules(start_date, end_date, last_accrual_date);
  `);

  migrateRecurringRules(db);
}

function migrateRecurringRules(db: Database) {
  const migrationDone = one<{ value: string }>(
    db,
    "select value from app_meta where key = 'recurring_rules_migrated'",
  );

  if (migrationDone) {
    return;
  }

  const existingRules = Number(
    one<{ count: number }>(
      db,
      "select count(*) as count from recurring_rules",
    )?.count ?? 0,
  );

  if (existingRules > 0) {
    db.run(
      "insert or replace into app_meta (key, value) values ('recurring_rules_migrated', '1')",
    );
    return;
  }

  const recurringTransactions = rows<{
    id: number;
    account_id: number;
    category_id: number;
    merchant: string;
    notes: string | null;
    amount: number;
    date: string;
    status: "cleared" | "pending";
    next_occurrence_date: string | null;
  }>(
    db,
    `select id, account_id, category_id, merchant, notes, amount, date, status,
      next_occurrence_date
     from transactions
     where is_recurring = 1 and recurring_parent_id is null
     order by account_id, category_id, merchant, amount, date desc, id desc`,
  );
  const seen = new Set<string>();

  for (const transaction of recurringTransactions) {
    const key = [
      transaction.account_id,
      transaction.category_id,
      transaction.merchant,
      transaction.amount,
    ].join("|");

    if (seen.has(key)) {
      db.run(
        `update transactions
         set is_recurring = 0, recurrence_frequency = 'none', next_occurrence_date = null
         where id = ?`,
        [transaction.id],
      );
      continue;
    }

    seen.add(key);

    db.run(
      `insert into recurring_rules
        (account_id, category_id, merchant, notes, amount, status,
          frequency, next_occurrence_date)
       values (?, ?, ?, ?, ?, ?, 'monthly', ?)`,
      [
        transaction.account_id,
        transaction.category_id,
        transaction.merchant,
        transaction.notes,
        transaction.amount,
        transaction.status,
        isDateString(transaction.next_occurrence_date)
          ? transaction.next_occurrence_date
          : addMonthlyOccurrence(transaction.date),
      ],
    );
  }

  db.run(
    "insert or replace into app_meta (key, value) values ('recurring_rules_migrated', '1')",
  );
}

function ensureDefaultCategories(db: Database) {
  const categorySeed = [
    ["Paycheck", "Income", "#219a68"],
    ["Investments", "Income", "#4f7cff"],
    ["Interest", "Income", "#16a34a"],
    ["Housing", "Fixed", "#334155"],
    ["Groceries", "Flexible", "#ef7d3c"],
    ["Dining", "Flexible", "#d94864"],
    ["Transportation", "Flexible", "#1d9a9a"],
    ["Shopping", "Flexible", "#8b5cf6"],
    ["Travel", "Lifestyle", "#e0a928"],
    ["Subscriptions", "Fixed", "#64748b"],
    ["Utilities", "Fixed", "#0f766e"],
    ["Taxes", "Fixed", "#991b1b"],
    ["Transfers", "Internal", "#7c3aed"],
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
  let db: Database;

  if (fs.existsSync(dbPath) && isSQLiteDatabaseFile(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    if (fs.existsSync(dbPath)) {
      moveInvalidDatabase("missing SQLite header");
    }

    db = new SQL.Database();
  }

  try {
    db.run("pragma foreign_keys = on");
    createSchema(db);
    migrateSchema(db);
    ensureDefaultCategories(db);
  } catch (error) {
    if (fs.existsSync(dbPath)) {
      db.close();
      moveInvalidDatabase(error instanceof Error ? error.message : "unreadable database");
      db = new SQL.Database();
      db.run("pragma foreign_keys = on");
      createSchema(db);
      migrateSchema(db);
      ensureDefaultCategories(db);
    } else {
      throw error;
    }
  }

  persist(db);
  return db;
}

export async function getDb() {
  return openDatabase();
}

export async function hasUsers() {
  const db = await getDb();
  return Number(one<{ count: number }>(db, "select count(*) as count from users")?.count ?? 0) > 0;
}

export async function listUsers() {
  const db = await getDb();
  return rows<AuthUser>(
    db,
    "select id, name, email, role, created_at from users order by role desc, name",
  );
}

export async function createUserRecord(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}) {
  const db = await getDb();
  db.run(
    "insert into users (name, email, password_hash, role) values (?, ?, ?, ?)",
    [input.name, input.email, input.passwordHash, input.role],
  );
  const user = one<AuthUser>(
    db,
    "select id, name, email, role, created_at from users where id = ?",
    [lastInsertId(db)],
  );

  if (user && user.email.toLowerCase() === legacyWorkspaceOwnerEmail) {
    assignUnownedWorkspaceDataToUser(db, user.id);
  }

  persist(db);
  return user;
}

export async function getUserByEmailWithPassword(email: string) {
  const db = await getDb();
  return one<AuthUser & { password_hash: string }>(
    db,
    `select id, name, email, password_hash, role, created_at
     from users
     where lower(email) = lower(?)`,
    [email],
  );
}

export async function getUserBySessionTokenHash(tokenHash: string) {
  const db = await getDb();
  const now = new Date().toISOString();

  db.run("delete from sessions where expires_at <= ?", [now]);
  const user = one<AuthUser>(
    db,
    `select users.id, users.name, users.email, users.role, users.created_at
     from sessions
     join users on users.id = sessions.user_id
     where sessions.token_hash = ? and sessions.expires_at > ?`,
    [tokenHash, now],
  );

  if (user) {
    db.run("update sessions set last_seen_at = ? where token_hash = ?", [
      now,
      tokenHash,
    ]);
  }

  persist(db);
  return user;
}

export async function createSessionRecord(input: {
  userId: number;
  tokenHash: string;
  expiresAt: string;
}) {
  const db = await getDb();
  db.run("delete from sessions where expires_at <= ?", [new Date().toISOString()]);
  db.run(
    "insert into sessions (token_hash, user_id, expires_at) values (?, ?, ?)",
    [input.tokenHash, input.userId, input.expiresAt],
  );
  persist(db);
}

export async function deleteSessionRecord(tokenHash: string) {
  const db = await getDb();
  db.run("delete from sessions where token_hash = ?", [tokenHash]);
  persist(db);
}

export async function deleteUserRecord(id: number) {
  const db = await getDb();
  const user = one<AuthUser>(
    db,
    "select id, name, email, role, created_at from users where id = ?",
    [id],
  );

  if (!user) {
    return;
  }

  if (user.role === "superuser") {
    const superusers = Number(
      one<{ count: number }>(
        db,
        "select count(*) as count from users where role = 'superuser'",
      )?.count ?? 0,
    );

    if (superusers <= 1) {
      throw new Error("At least one superuser is required.");
    }
  }

  db.run("delete from users where id = ?", [id]);
  persist(db);
}

function applyDueRecurringTransactions(db: Database) {
  const today = todayDateString();
  const templates = rows<{
    id: number;
    account_id: number;
    category_id: number;
    merchant: string;
    notes: string | null;
    amount: number;
    status: "cleared" | "pending";
    next_occurrence_date: string | null;
    end_month: string | null;
    account_name: string;
    transfer_to_account_id: number | null;
    transfer_to_account_name: string | null;
    transfer_to_account_type: string | null;
  }>(
    db,
    `select recurring_rules.id, recurring_rules.account_id,
      recurring_rules.category_id, recurring_rules.merchant,
      recurring_rules.notes, recurring_rules.amount, recurring_rules.status,
      recurring_rules.next_occurrence_date,
      recurring_rules.end_month,
      recurring_rules.transfer_to_account_id,
      source.name as account_name,
      destination.name as transfer_to_account_name,
      destination.type as transfer_to_account_type
     from recurring_rules
     join accounts source
      on source.id = recurring_rules.account_id
     left join accounts destination
      on destination.id = recurring_rules.transfer_to_account_id
     where frequency = 'monthly'
      and next_occurrence_date <= ?
     order by next_occurrence_date, recurring_rules.id`,
    [today],
  );

  if (templates.length === 0) {
    return { generated: 0, advanced: 0 };
  }

  let changed = false;
  let generated = 0;
  let advanced = 0;
  let stopped = 0;

  db.run("begin transaction");

  try {
    for (const template of templates) {
      let nextDate = template.next_occurrence_date;
      let generatedCount = 0;
      const endMonth = isMonthString(template.end_month)
        ? template.end_month
        : null;

      while (
        isDateString(nextDate) &&
        nextDate <= today &&
        isOccurrenceWithinEndMonth(nextDate, endMonth) &&
        generatedCount < 120
      ) {
        const existing = one<{ id: number }>(
          db,
          `select id from transactions
           where date = ?
            and (
              recurring_parent_id = ?
              or (
                account_id = ?
                and category_id = ?
                and merchant = ?
                and amount = ?
                and recurring_parent_id is not null
              )
            )`,
          [
            nextDate,
            template.id,
            template.account_id,
            template.category_id,
            template.merchant,
            template.amount,
          ],
        );

        if (!existing) {
          if (template.transfer_to_account_id) {
            const isPacTransfer = template.transfer_to_account_type === "PAC";
            const transferId = `${isPacTransfer ? "pac" : "transfer"}-recurring-${template.id}-${nextDate}`;
            const destinationName =
              template.transfer_to_account_name ?? "destination";
            const outgoingMerchant = isPacTransfer
              ? `PAC contribution to ${destinationName}`
              : `Transfer to ${destinationName}`;
            const incomingMerchant = isPacTransfer
              ? `PAC contribution from ${template.account_name}`
              : `Transfer from ${template.account_name}`;

            db.run(
              `insert into transactions
                (account_id, category_id, merchant, notes, amount, date, status,
                  is_recurring, recurrence_frequency, next_occurrence_date,
                  recurring_parent_id)
               values (?, ?, ?, ?, ?, ?, ?, 0, 'none', null, ?)`,
              [
                template.account_id,
                template.category_id,
                outgoingMerchant,
                `internal_transfer:${transferId}`,
                -Math.abs(template.amount),
                nextDate,
                template.status,
                template.id,
              ],
            );
            db.run(
              `insert into transactions
                (account_id, category_id, merchant, notes, amount, date, status,
                  is_recurring, recurrence_frequency, next_occurrence_date,
                  recurring_parent_id)
               values (?, ?, ?, ?, ?, ?, ?, 0, 'none', null, ?)`,
              [
                template.transfer_to_account_id,
                template.category_id,
                incomingMerchant,
                `internal_transfer:${transferId}`,
                Math.abs(template.amount),
                nextDate,
                template.status,
                template.id,
              ],
            );

            if (template.status === "cleared") {
              db.run("update accounts set balance = balance - ? where id = ?", [
                Math.abs(template.amount),
                template.account_id,
              ]);
              db.run("update accounts set balance = balance + ? where id = ?", [
                Math.abs(template.amount),
                template.transfer_to_account_id,
              ]);
            }
          } else {
          db.run(
            `insert into transactions
              (account_id, category_id, merchant, notes, amount, date, status,
                is_recurring, recurrence_frequency, next_occurrence_date,
                recurring_parent_id)
             values (?, ?, ?, ?, ?, ?, ?, 0, 'none', null, ?)`,
            [
              template.account_id,
              template.category_id,
              template.merchant,
              template.notes,
              template.amount,
              nextDate,
              template.status,
              template.id,
            ],
          );

            if (template.status === "cleared") {
              db.run("update accounts set balance = balance + ? where id = ?", [
                template.amount,
                template.account_id,
              ]);
            }
          }

          changed = true;
          generated += 1;
        }

        nextDate = addMonthlyOccurrence(nextDate);
        generatedCount += 1;
      }

      if (isDateString(nextDate) && !isOccurrenceWithinEndMonth(nextDate, endMonth)) {
        db.run("delete from recurring_rules where id = ?", [template.id]);
        changed = true;
        stopped += 1;
      } else if (isDateString(nextDate) && nextDate !== template.next_occurrence_date) {
        db.run(
          `update recurring_rules
           set next_occurrence_date = ?, updated_at = current_timestamp
           where id = ?`,
          [nextDate, template.id],
        );
        changed = true;
        advanced += 1;
      }
    }

    db.run("commit");
  } catch (error) {
    db.run("rollback");
    throw error;
  }

  if (changed) {
    persist(db);
  }

  return { generated, advanced, stopped };
}

export async function runDueRecurringTransactions() {
  const db = await getDb();
  const recurring = applyDueRecurringTransactions(db);
  const pending = applyDuePendingTransactions(db);
  const savingsInterest = applyDueSavingsInterest(db);

  return {
    ...recurring,
    pendingCleared: pending.cleared,
    ...savingsInterest,
  };
}

type SummaryOptions = {
  projectionDate?: string | null;
};

type JoinedTransaction = Omit<Transaction, "is_recurring"> & { is_recurring: number };

type ProjectionRecurringRule = RecurringRule & {
  transfer_to_account_type: string | null;
};

function normalizeTransaction(transaction: JoinedTransaction): Transaction {
  return {
    ...transaction,
    is_recurring: Boolean(transaction.is_recurring),
  };
}

function sortTransactions(transactions: Transaction[]) {
  return [...transactions].sort((first, second) => {
    const dateOrder = second.date.localeCompare(first.date);

    if (dateOrder !== 0) {
      return dateOrder;
    }

    return second.id - first.id;
  });
}

function projectDashboardState(input: {
  accounts: Account[];
  transactions: Transaction[];
  recurring: ProjectionRecurringRule[];
  projectionDate: string;
}) {
  const accounts = input.accounts.map((account) => ({ ...account }));
  const transactions = input.transactions.map((transaction) => ({ ...transaction }));
  const accountBalances = new Map(accounts.map((account) => [account.id, account]));
  let projectedId = -1;

  const postProjectedTransaction = (transaction: Omit<Transaction, "id">) => {
    const projected = { ...transaction, id: projectedId } satisfies Transaction;
    projectedId -= 1;
    transactions.push(projected);

    const account = accountBalances.get(projected.account_id);

    if (account && projected.status === "cleared") {
      account.balance += projected.amount;
    }
  };

  for (const transaction of transactions) {
    const account = accountBalances.get(transaction.account_id);

    if (transaction.status === "cleared" && transaction.date > input.projectionDate) {
      if (account) {
        account.balance -= transaction.amount;
      }

      continue;
    }

    if (transaction.status === "pending" && transaction.date <= input.projectionDate) {
      if (account) {
        account.balance += transaction.amount;
      }

      transaction.status = "cleared";
    }
  }

  for (const rule of input.recurring) {
    let nextDate = rule.next_occurrence_date;
    let generatedCount = 0;
    const endMonth = isMonthString(rule.end_month) ? rule.end_month : null;

    while (
      isDateString(nextDate) &&
      nextDate <= input.projectionDate &&
      isOccurrenceWithinEndMonth(nextDate, endMonth) &&
      generatedCount < 120
    ) {
      if (rule.transfer_to_account_id) {
        const isPacTransfer = rule.transfer_to_account_type === "PAC";
        const destinationName = rule.transfer_to_account_name ?? "destination";
        const transferId = `${isPacTransfer ? "pac" : "transfer"}-projection-${rule.id}-${nextDate}`;
        const outgoingMerchant = isPacTransfer
          ? `PAC contribution to ${destinationName}`
          : `Transfer to ${destinationName}`;
        const incomingMerchant = isPacTransfer
          ? `PAC contribution from ${rule.account_name}`
          : `Transfer from ${rule.account_name}`;
        const amount = Math.abs(rule.amount);

        postProjectedTransaction({
          account_id: rule.account_id,
          category_id: rule.category_id,
          merchant: outgoingMerchant,
          notes: `internal_transfer:${transferId}`,
          amount: -amount,
          date: nextDate,
          status: "cleared",
          is_recurring: true,
          recurrence_frequency: "none",
          next_occurrence_date: null,
          recurring_parent_id: rule.id,
          account_name: rule.account_name,
          category_name: rule.category_name,
          category_color: rule.category_color,
        });
        postProjectedTransaction({
          account_id: rule.transfer_to_account_id,
          category_id: rule.category_id,
          merchant: incomingMerchant,
          notes: `internal_transfer:${transferId}`,
          amount,
          date: nextDate,
          status: "cleared",
          is_recurring: true,
          recurrence_frequency: "none",
          next_occurrence_date: null,
          recurring_parent_id: rule.id,
          account_name: rule.transfer_to_account_name ?? destinationName,
          category_name: rule.category_name,
          category_color: rule.category_color,
        });
      } else {
        postProjectedTransaction({
          account_id: rule.account_id,
          category_id: rule.category_id,
          merchant: rule.merchant,
          notes: rule.notes,
          amount: rule.amount,
          date: nextDate,
          status: "cleared",
          is_recurring: true,
          recurrence_frequency: "none",
          next_occurrence_date: null,
          recurring_parent_id: rule.id,
          account_name: rule.account_name,
          category_name: rule.category_name,
          category_color: rule.category_color,
        });
      }

      nextDate = addMonthlyOccurrence(nextDate);
      generatedCount += 1;
    }
  }

  return {
    accounts,
    transactions: sortTransactions(
      transactions.filter((transaction) => transaction.date <= input.projectionDate),
    ),
  };
}

export async function getSummary(
  userId: number,
  options: SummaryOptions = {},
): Promise<AppSummary> {
  const db = await getDb();
  applyDueRecurringTransactions(db);
  applyDuePendingTransactions(db);
  applyDueSavingsInterest(db);
  const today = todayDateString();
  const projectionDate =
    isDateString(options.projectionDate) && options.projectionDate > today
      ? options.projectionDate
      : null;
  const summaryDate = projectionDate ? parseDateString(projectionDate) : new Date();
  const baseAccounts = rows<Account>(
    db,
    `select * from accounts
     where user_id = ?
     order by sort_order, id`,
    [userId],
  );
  const categories = rows<Category>(db, "select * from categories order by group_name, name");
  const allTransactions = rows<JoinedTransaction>(
    db,
    `select transactions.*, accounts.name as account_name,
      categories.name as category_name, categories.color as category_color
     from transactions
     join accounts on accounts.id = transactions.account_id
     join categories on categories.id = transactions.category_id
     where accounts.user_id = ?
     order by date desc, transactions.id desc`,
    [userId],
  ).map(normalizeTransaction);
  const recurring = rows<RecurringRule>(
    db,
    `select recurring_rules.*, accounts.name as account_name,
      destination.name as transfer_to_account_name,
      categories.name as category_name, categories.color as category_color
     from recurring_rules
     join accounts on accounts.id = recurring_rules.account_id
     left join accounts destination
      on destination.id = recurring_rules.transfer_to_account_id
     join categories on categories.id = recurring_rules.category_id
     where accounts.user_id = ?
     order by recurring_rules.next_occurrence_date, recurring_rules.id
     limit 8`,
    [userId],
  );
  const projectionRecurring = rows<ProjectionRecurringRule>(
    db,
    `select recurring_rules.*, accounts.name as account_name,
      destination.name as transfer_to_account_name,
      destination.type as transfer_to_account_type,
      categories.name as category_name, categories.color as category_color
     from recurring_rules
     join accounts on accounts.id = recurring_rules.account_id
     left join accounts destination
      on destination.id = recurring_rules.transfer_to_account_id
     join categories on categories.id = recurring_rules.category_id
     where accounts.user_id = ?
     order by recurring_rules.next_occurrence_date, recurring_rules.id`,
    [userId],
  );
  const savingsInterestRules = rows<SavingsInterestRule>(
    db,
    `select savings_interest_rules.*
     from savings_interest_rules
     join accounts on accounts.id = savings_interest_rules.account_id
     where accounts.user_id = ?
     order by savings_interest_rules.account_id`,
    [userId],
  );
  const highYieldInterestTransactions = rows<{
    amount: number;
    category_name: string;
    date: string;
    merchant: string;
  }>(
    db,
    `select transactions.amount, transactions.date, transactions.merchant,
      categories.name as category_name
     from transactions
     join accounts on accounts.id = transactions.account_id
     join categories on categories.id = transactions.category_id
     left join savings_interest_rules
      on savings_interest_rules.account_id = accounts.id
     where accounts.user_id = ?
      and accounts.type = 'Savings'
      and (
        lower(accounts.name) like '%high yield%'
        or savings_interest_rules.id is not null
      )
      and (
        transactions.merchant in ('Savings interest', 'Withholding tax')
        or transactions.notes like 'savings_interest_rule:%'
      )
     order by transactions.date`,
    [userId],
  );

  const projectedState = projectionDate
    ? projectDashboardState({
        accounts: baseAccounts,
        transactions: allTransactions,
        recurring: projectionRecurring,
        projectionDate,
      })
    : { accounts: baseAccounts, transactions: allTransactions };
  const accounts = projectedState.accounts;
  const transactionsForSummary = projectedState.transactions;
  const currentMonth = getMonthKey(summaryDate);
  const spendingByCategory = new Map<number, number>();
  const monthlyChangeByAccount = new Map<number, number>();

  for (const transaction of transactionsForSummary) {
    if (transaction.status === "cleared" && transaction.date.startsWith(currentMonth)) {
      monthlyChangeByAccount.set(
        transaction.account_id,
        (monthlyChangeByAccount.get(transaction.account_id) ?? 0) + transaction.amount,
      );
    }
  }

  const accountsWithMonthlyChange = accounts.map((account) => {
    const monthlyChange = monthlyChangeByAccount.get(account.id) ?? 0;
    const startingBalance = account.balance - monthlyChange;
    const monthlyChangePercent =
      Math.abs(startingBalance) >= 0.01
        ? (monthlyChange / Math.abs(startingBalance)) * 100
        : monthlyChange === 0
          ? 0
          : null;

    return {
      ...account,
      monthly_change: monthlyChange,
      monthly_change_percent: monthlyChangePercent,
      recent_transactions: sortTransactions(
        transactionsForSummary.filter(
          (transaction) =>
            transaction.account_id === account.id &&
            transaction.status === "cleared",
        ),
      ).slice(0, 3),
    };
  });

  const externalTransactions = transactionsForSummary.filter(
    (transaction) => transaction.category_name !== "Transfers",
  );

  for (const transaction of externalTransactions) {
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
     where budgets.user_id = ?
     order by categories.group_name, categories.name`,
    [userId],
  ).map((budget) => {
    const spent = spendingByCategory.get(budget.category_id) ?? 0;
    return {
      ...budget,
      spent,
      remaining: budget.amount - spent,
    };
  });

  const goals = rows<Goal>(
    db,
    "select * from goals where user_id = ? order by due_date",
    [userId],
  );
  const cashFlow = buildCashFlow(externalTransactions, summaryDate);
  const highYieldInterest = buildHighYieldInterest(highYieldInterestTransactions, summaryDate);
  const accountDailyHistory = buildAccountDailyHistory(
    accounts,
    transactionsForSummary,
    summaryDate,
  );
  const monthlyIncome = externalTransactions
    .filter((transaction) => transaction.date.startsWith(currentMonth) && transaction.amount > 0)
    .reduce((total, transaction) => total + transaction.amount, 0);
  const monthlyExpenses = externalTransactions
    .filter((transaction) => transaction.date.startsWith(currentMonth) && transaction.amount < 0)
    .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  const budgeted = budgets.reduce((total, budget) => total + budget.amount, 0);
  const budgetSpent = budgets.reduce((total, budget) => total + budget.spent, 0);

  return {
    accounts: accountsWithMonthlyChange,
    categories,
    transactions: sortTransactions(transactionsForSummary).slice(0, 80),
    budgets,
    goals,
    cashFlow,
    highYieldInterest,
    accountDailyHistory,
    recurring,
    savingsInterestRules,
    totals: {
      netWorth: accounts
        .filter(isNetWorthAccount)
        .reduce((total, account) => total + account.balance, 0),
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
      budgeted,
      budgetSpent,
    },
  };
}

export async function getBackupSnapshot(): Promise<BackupSnapshot> {
  const db = await getDb();
  applyDueRecurringTransactions(db);
  applyDuePendingTransactions(db);
  applyDueSavingsInterest(db);

  return {
    backupVersion: 2,
    exportedAt: new Date().toISOString(),
    users: rows<BackupUser>(
      db,
      "select id, name, email, password_hash, role, created_at from users order by id",
    ),
    accounts: rows<Account>(db, "select * from accounts order by id"),
    categories: rows<Category>(db, "select * from categories order by id"),
    transactions: rows<Omit<Transaction, "is_recurring"> & { is_recurring: number }>(
      db,
      "select * from transactions order by id",
    ).map((transaction) => ({
      ...transaction,
      is_recurring: Boolean(transaction.is_recurring),
    })) as Transaction[],
    budgets: rows<Budget>(
      db,
      `select budgets.id, budgets.user_id, budgets.category_id, categories.name as category_name,
        categories.group_name, categories.color, budgets.amount,
        0 as spent, budgets.amount as remaining
       from budgets
       join categories on categories.id = budgets.category_id
       order by budgets.id`,
    ),
    goals: rows<Goal>(db, "select * from goals order by id"),
    recurring: rows<RecurringRule>(
      db,
      `select recurring_rules.*, source.name as account_name,
        destination.name as transfer_to_account_name,
        categories.name as category_name, categories.color as category_color
       from recurring_rules
       join accounts source on source.id = recurring_rules.account_id
       left join accounts destination
        on destination.id = recurring_rules.transfer_to_account_id
       join categories on categories.id = recurring_rules.category_id
       order by recurring_rules.id`,
    ),
    savingsInterestRules: rows<SavingsInterestRule>(
      db,
      "select * from savings_interest_rules order by id",
    ),
    appMeta: rows<BackupAppMeta>(db, "select key, value from app_meta order by key"),
    sqliteSequence: rows<BackupSqliteSequence>(
      db,
      "select name, seq from sqlite_sequence order by name",
    ),
  };
}

function buildCashFlow(transactions: Transaction[], anchorDate = new Date()): CashFlowPoint[] {
  const points: CashFlowPoint[] = [];

  for (let index = 5; index >= 0; index -= 1) {
    const date = addMonths(anchorDate, -index);
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

function buildHighYieldInterest(
  transactions: Array<{
    amount: number;
    category_name: string;
    date: string;
    merchant: string;
  }>,
  anchorDate = new Date(),
): HighYieldInterestPoint[] {
  const monthly = new Map<string, { gross: number; tax: number }>();

  for (const transaction of transactions) {
    const key = transaction.date.slice(0, 7);
    const current = monthly.get(key) ?? { gross: 0, tax: 0 };

    if (transaction.amount > 0) {
      current.gross += transaction.amount;
    } else {
      current.tax += Math.abs(transaction.amount);
    }

    monthly.set(key, current);
  }

  const points: HighYieldInterestPoint[] = [];

  for (let index = 11; index >= 0; index -= 1) {
    const date = addMonths(anchorDate, -index);
    const key = getMonthKey(date);
    const value = monthly.get(key) ?? { gross: 0, tax: 0 };

    points.push({
      month: date.toLocaleDateString("en", { month: "short" }),
      gross: value.gross,
      tax: value.tax,
      net: value.gross - value.tax,
    });
  }

  return points;
}

function buildAccountDailyHistory(
  accounts: Account[],
  transactions: Transaction[],
  anchorDate = new Date(),
): AccountDailyHistoryPoint[] {
  const today = toDateString(anchorDate);
  const clearedTransactions = transactions
    .filter((transaction) => transaction.status === "cleared" && transaction.date <= today)
    .sort((first, second) => first.date.localeCompare(second.date));
  const currentMonthStart = `${getMonthKey(anchorDate)}-01`;
  const firstTransactionDate = clearedTransactions[0]?.date;
  const startDate =
    firstTransactionDate && firstTransactionDate < currentMonthStart
      ? `${firstTransactionDate.slice(0, 7)}-01`
      : currentMonthStart;
  const daily = new Map<
    string,
    { change: number; income: number; expenses: number }
  >();

  for (const transaction of clearedTransactions) {
    const value = daily.get(transaction.date) ?? {
      change: 0,
      income: 0,
      expenses: 0,
    };

    value.change += transaction.amount;

    if (transaction.amount > 0) {
      value.income += transaction.amount;
    } else {
      value.expenses += Math.abs(transaction.amount);
    }

    daily.set(transaction.date, value);
  }

  const currentBalance = accounts.reduce((total, account) => total + account.balance, 0);
  const totalClearedChange = clearedTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );
  let balance = currentBalance - totalClearedChange;
  const points: AccountDailyHistoryPoint[] = [];
  const cursor = parseDateString(startDate);
  const end = parseDateString(today);

  while (cursor <= end) {
    const date = toDateString(cursor);
    const value = daily.get(date) ?? { change: 0, income: 0, expenses: 0 };

    balance += value.change;
    points.push({
      date,
      balance,
      change: value.change,
      income: value.income,
      expenses: value.expenses,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

export async function createAccount(userId: number, input: Partial<Account>) {
  const db = await getDb();
  const sortOrder =
    Number(
      one<{ sort_order: number }>(
        db,
        "select coalesce(max(sort_order), 0) + 1 as sort_order from accounts where user_id = ?",
        [userId],
      )?.sort_order ?? 1,
    );
  db.run(
    "insert into accounts (user_id, name, type, institution, balance, color, sort_order) values (?, ?, ?, ?, ?, ?, ?)",
    [
      userId,
      String(input.name ?? "New account"),
      String(input.type ?? "Checking"),
      String(input.institution ?? "Manual"),
      Number(input.balance ?? 0),
      String(input.color ?? "#219a68"),
      sortOrder,
    ],
  );
  const account = one<Account>(db, "select * from accounts where id = ?", [
    lastInsertId(db),
  ]);
  persist(db);
  return account;
}

export async function updateAccount(userId: number, id: number, input: Partial<Account>) {
  const db = await getDb();
  const current = one<Account>(
    db,
    "select * from accounts where id = ? and user_id = ?",
    [id, userId],
  );

  if (!current) {
    throw new Error("Account not found.");
  }

  const nextName = input.name === undefined ? current.name : String(input.name).trim();

  if (!nextName) {
    throw new Error("Account name is required.");
  }

  db.run(
    "update accounts set name = ?, type = ?, institution = ?, balance = ?, color = ? where id = ?",
    [
      nextName,
      String(input.type ?? current.type),
      String(input.institution ?? current.institution),
      Number(input.balance ?? current.balance),
      String(input.color ?? current.color),
      id,
    ],
  );
  persist(db);
  return one<Account>(db, "select * from accounts where id = ? and user_id = ?", [
    id,
    userId,
  ]);
}

export async function deleteAccount(userId: number, id: number) {
  const db = await getDb();
  db.run("delete from accounts where id = ? and user_id = ?", [id, userId]);
  persist(db);
}

export async function reorderAccounts(userId: number, accountIds: number[]) {
  const db = await getDb();
  const currentAccounts = rows<{ id: number }>(
    db,
    "select id from accounts where user_id = ? order by sort_order, id",
    [userId],
  );
  const currentIds = currentAccounts.map((account) => account.id);
  const currentIdSet = new Set(currentIds);
  const orderedIds = Array.from(
    new Set(
      accountIds
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  );

  if (orderedIds.some((id) => !currentIdSet.has(id))) {
    throw new Error("Account order contains an unknown account.");
  }

  const finalIds = [
    ...orderedIds,
    ...currentIds.filter((id) => !orderedIds.includes(id)),
  ];

  db.run("begin transaction");

  try {
    finalIds.forEach((id, index) => {
      db.run(
        "update accounts set sort_order = ? where id = ? and user_id = ?",
        [index + 1, id, userId],
      );
    });
    db.run("commit");
  } catch (error) {
    db.run("rollback");
    throw error;
  }

  persist(db);
}

export async function upsertSavingsInterestRule(
  userId: number,
  accountId: number,
  input: Partial<SavingsInterestRule>,
) {
  const db = await getDb();
  const account = one<Account>(
    db,
    "select * from accounts where id = ? and user_id = ?",
    [accountId, userId],
  );
  const grossAnnualRate = Number(input.gross_annual_rate);
  const taxRate = Number(input.tax_rate ?? 26);
  const startDate = String(input.start_date ?? todayDateString());
  const endDate = input.end_date ? String(input.end_date) : null;

  if (!account) {
    throw new Error("Account not found.");
  }

  if (!Number.isFinite(grossAnnualRate) || grossAnnualRate < 0) {
    throw new Error("A valid gross annual rate is required.");
  }

  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
    throw new Error("A valid tax rate is required.");
  }

  if (!isDateString(startDate)) {
    throw new Error("A valid start date is required.");
  }

  if (endDate && !isDateString(endDate)) {
    throw new Error("A valid end date is required.");
  }

  db.run(
    `insert into savings_interest_rules
      (account_id, gross_annual_rate, tax_rate, start_date, end_date,
        last_accrual_date, accrued_gross_remainder, accrued_tax_remainder)
     values (?, ?, ?, ?, ?, null, 0, 0)
     on conflict(account_id) do update set
      gross_annual_rate = excluded.gross_annual_rate,
      tax_rate = excluded.tax_rate,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      updated_at = current_timestamp`,
    [accountId, grossAnnualRate, taxRate, startDate, endDate],
  );
  persist(db);
}

export async function deleteSavingsInterestRule(userId: number, accountId: number) {
  const db = await getDb();
  db.run(
    `delete from savings_interest_rules
     where account_id in (
      select id from accounts where id = ? and user_id = ?
     )`,
    [accountId, userId],
  );
  persist(db);
}

type BalanceTransaction = {
  id: number;
  account_id: number;
  amount: number;
  status: "cleared" | "pending";
  notes: string | null;
};

function applyTransactionBalance(db: Database, transaction: BalanceTransaction) {
  if (transaction.status !== "cleared") {
    return;
  }

  db.run("update accounts set balance = balance + ? where id = ?", [
    transaction.amount,
    transaction.account_id,
  ]);
}

function reverseTransactionBalance(db: Database, transaction: BalanceTransaction) {
  if (transaction.status !== "cleared") {
    return;
  }

  db.run("update accounts set balance = balance - ? where id = ?", [
    transaction.amount,
    transaction.account_id,
  ]);
}

function internalTransferMarker(notes: string | null | undefined) {
  return notes?.startsWith("internal_transfer:") ? notes : null;
}

function applyDuePendingTransactions(db: Database) {
  const today = todayDateString();
  const dueTransactions = rows<BalanceTransaction>(
    db,
    `select id, account_id, amount, status, notes
     from transactions
     where status = 'pending' and date <= ?
     order by date, id`,
    [today],
  );

  if (dueTransactions.length === 0) {
    return { cleared: 0 };
  }

  db.run("begin transaction");

  try {
    for (const transaction of dueTransactions) {
      applyTransactionBalance(db, {
        ...transaction,
        status: "cleared",
      });
      db.run("update transactions set status = 'cleared' where id = ?", [
        transaction.id,
      ]);
    }

    db.run("commit");
  } catch (error) {
    db.run("rollback");
    throw error;
  }

  persist(db);
  return { cleared: dueTransactions.length };
}

function centsFloor(value: number) {
  return Math.floor((value + Number.EPSILON) * 100) / 100;
}

function applyDueSavingsInterest(db: Database) {
  const today = todayDateString();
  const defaultLastEligibleDate = savingsInterestLastEligibleDate();
  const rules = rows<SavingsInterestRule & { account_balance: number }>(
    db,
    `select savings_interest_rules.*, accounts.balance as account_balance
     from savings_interest_rules
     join accounts on accounts.id = savings_interest_rules.account_id
     where savings_interest_rules.start_date < ?
      and (
        savings_interest_rules.end_date is null
        or savings_interest_rules.last_accrual_date is null
        or savings_interest_rules.last_accrual_date < savings_interest_rules.end_date
      )
     order by savings_interest_rules.id`,
    [today],
  );

  if (rules.length === 0) {
    return { interestPayments: 0, taxPayments: 0 };
  }

  ensureDefaultCategories(db);
  const interestCategory = one<Category>(
    db,
    "select * from categories where name = 'Interest'",
  );
  const taxCategory = one<Category>(
    db,
    "select * from categories where name = 'Taxes'",
  );

  if (!interestCategory || !taxCategory) {
    throw new Error("Interest or tax category is missing.");
  }

  let interestPayments = 0;
  let taxPayments = 0;
  let changed = false;

  db.run("begin transaction");

  try {
    for (const rule of rules) {
      let accrualDate = rule.last_accrual_date
        ? addDays(rule.last_accrual_date, 1)
        : rule.start_date;
      const lastEligibleDate = rule.end_date && rule.end_date < defaultLastEligibleDate
        ? rule.end_date
        : defaultLastEligibleDate;
      let grossRemainder = Number(rule.accrued_gross_remainder ?? 0);
      let taxRemainder = Number(rule.accrued_tax_remainder ?? 0);
      let balance = Number(rule.account_balance ?? 0);
      let lastAccruedDate = rule.last_accrual_date;

      while (accrualDate <= lastEligibleDate) {
        const grossAccrued =
          balance * (Number(rule.gross_annual_rate) / 100) /
          daysInYear(parseDateString(accrualDate));
        const taxAccrued = grossAccrued * (Number(rule.tax_rate) / 100);

        grossRemainder += grossAccrued;
        taxRemainder += taxAccrued;

        const payableGross = centsFloor(grossRemainder);
        const payableTax = centsFloor(taxRemainder);

        if (payableGross >= 0.01) {
          const note = `savings_interest_rule:${rule.id}:gross`;
          db.run(
            `insert into transactions
              (account_id, category_id, merchant, notes, amount, date, status, is_recurring)
             values (?, ?, 'Savings interest', ?, ?, ?, 'cleared', 0)`,
            [rule.account_id, interestCategory.id, note, payableGross, accrualDate],
          );
          db.run("update accounts set balance = balance + ? where id = ?", [
            payableGross,
            rule.account_id,
          ]);
          balance += payableGross;
          grossRemainder -= payableGross;
          interestPayments += 1;
          changed = true;
        }

        if (payableTax >= 0.01) {
          const note = `savings_interest_rule:${rule.id}:tax`;
          db.run(
            `insert into transactions
              (account_id, category_id, merchant, notes, amount, date, status, is_recurring)
             values (?, ?, 'Withholding tax', ?, ?, ?, 'cleared', 0)`,
            [rule.account_id, taxCategory.id, note, -payableTax, accrualDate],
          );
          db.run("update accounts set balance = balance - ? where id = ?", [
            payableTax,
            rule.account_id,
          ]);
          balance -= payableTax;
          taxRemainder -= payableTax;
          taxPayments += 1;
          changed = true;
        }

        lastAccruedDate = accrualDate;
        accrualDate = addDays(accrualDate, 1);
      }

      if (lastAccruedDate !== rule.last_accrual_date) {
        db.run(
          `update savings_interest_rules
           set last_accrual_date = ?, accrued_gross_remainder = ?,
            accrued_tax_remainder = ?, updated_at = current_timestamp
           where id = ?`,
          [lastAccruedDate, grossRemainder, taxRemainder, rule.id],
        );
        changed = true;
      }
    }

    db.run("commit");
  } catch (error) {
    db.run("rollback");
    throw error;
  }

  if (changed) {
    persist(db);
  }

  return { interestPayments, taxPayments };
}

export async function createTransaction(
  userId: number,
  input: Partial<Transaction> & { end_month?: string | null },
) {
  const db = await getDb();
  const date = String(input.date ?? new Date().toISOString().slice(0, 10));
  const isRecurring = Boolean(input.is_recurring);
  const recurrenceFrequency = isRecurring ? "monthly" : "none";
  const nextOccurrenceDate = isRecurring
    ? String(input.next_occurrence_date ?? addMonthlyOccurrence(date))
    : null;
  const endMonth = isMonthString(input.end_month) ? input.end_month : null;
  const accountId = Number(input.account_id ?? 1);
  const categoryId = Number(input.category_id ?? 1);
  const amount = Number(input.amount ?? 0);
  const status = isRecurring
    ? "pending"
    : input.status === "pending"
      ? "pending"
      : "cleared";
  const account = one<Account>(
    db,
    "select * from accounts where id = ? and user_id = ?",
    [accountId, userId],
  );

  if (!account) {
    throw new Error("Account not found.");
  }

  db.run("begin transaction");

  try {
    db.run(
      `insert into transactions
        (account_id, category_id, merchant, notes, amount, date, status,
          is_recurring, recurrence_frequency, next_occurrence_date,
          recurring_parent_id)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null)`,
      [
        accountId,
        categoryId,
        String(input.merchant ?? "Manual transaction"),
        input.notes ? String(input.notes) : null,
        amount,
        date,
        status,
        isRecurring ? 1 : 0,
        recurrenceFrequency,
        nextOccurrenceDate,
      ],
    );
    const transaction = one<{ id: number }>(db, "select last_insert_rowid() as id");

    applyTransactionBalance(db, {
      id: Number(transaction?.id ?? 0),
      account_id: accountId,
      amount,
      status,
      notes: input.notes ? String(input.notes) : null,
    });

    if (isRecurring && nextOccurrenceDate) {
      db.run(
      `insert into recurring_rules
        (account_id, category_id, merchant, notes, amount, status,
          frequency, next_occurrence_date, end_month)
       values (?, ?, ?, ?, ?, ?, 'monthly', ?, ?)`,
        [
          accountId,
          categoryId,
          String(input.merchant ?? "Manual transaction"),
          input.notes ? String(input.notes) : null,
        amount,
        status,
        nextOccurrenceDate,
        endMonth,
      ],
    );
    }

    db.run("commit");
    persist(db);
    return transaction;
  } catch (error) {
    db.run("rollback");
    throw error;
  }
}

export async function updateTransaction(
  userId: number,
  id: number,
  input: Partial<Transaction>,
) {
  const db = await getDb();
  const current = one<BalanceTransaction & Transaction>(
    db,
    `select transactions.*
     from transactions
     join accounts on accounts.id = transactions.account_id
     where transactions.id = ? and accounts.user_id = ?`,
    [id, userId],
  );

  if (!current) {
    throw new Error("Transaction not found.");
  }

  if (internalTransferMarker(current.notes)) {
    throw new Error("Internal transfers must be recreated instead of edited one side at a time.");
  }

  const date = String(input.date ?? current.date);
  const isRecurring = Boolean(input.is_recurring ?? current.is_recurring);
  const recurrenceFrequency = isRecurring ? "monthly" : "none";
  const nextOccurrenceDate = isRecurring
    ? String(input.next_occurrence_date ?? addMonthlyOccurrence(date))
    : null;
  const accountId = Number(input.account_id ?? current.account_id);
  const categoryId = Number(input.category_id ?? current.category_id);
  const amount = Number(input.amount ?? current.amount);
  const status = isRecurring ? "pending" : (input.status ?? current.status);
  const account = one<Account>(
    db,
    "select * from accounts where id = ? and user_id = ?",
    [accountId, userId],
  );

  if (!account) {
    throw new Error("Account not found.");
  }

  db.run("begin transaction");

  try {
    reverseTransactionBalance(db, current);
    db.run(
      `update transactions
       set account_id = ?, category_id = ?, merchant = ?, notes = ?, amount = ?,
        date = ?, status = ?, is_recurring = ?, recurrence_frequency = ?,
        next_occurrence_date = ?
       where id = ?`,
      [
        accountId,
        categoryId,
        String(input.merchant ?? current.merchant),
        input.notes === undefined
          ? current.notes
          : input.notes
            ? String(input.notes)
            : null,
        amount,
        date,
        status,
        isRecurring ? 1 : 0,
        recurrenceFrequency,
        nextOccurrenceDate,
        id,
      ],
    );
    applyTransactionBalance(db, {
      id,
      account_id: accountId,
      amount,
      status,
      notes:
        input.notes === undefined
          ? current.notes
          : input.notes
            ? String(input.notes)
            : null,
    });
    db.run("commit");
  } catch (error) {
    db.run("rollback");
    throw error;
  }

  persist(db);
}

export async function deleteTransaction(userId: number, id: number) {
  const db = await getDb();
  const transaction = one<BalanceTransaction>(
    db,
    `select transactions.id, transactions.account_id, transactions.amount,
      transactions.status, transactions.notes
     from transactions
     join accounts on accounts.id = transactions.account_id
     where transactions.id = ? and accounts.user_id = ?`,
    [id, userId],
  );

  if (!transaction) {
    return;
  }

  const transferMarker = internalTransferMarker(transaction.notes);
  const transactions = transferMarker
    ? rows<BalanceTransaction>(
        db,
        `select transactions.id, transactions.account_id, transactions.amount,
          transactions.status, transactions.notes
         from transactions
         join accounts on accounts.id = transactions.account_id
         where transactions.notes = ? and accounts.user_id = ?`,
        [transferMarker, userId],
      )
    : [transaction];

  db.run("begin transaction");

  try {
    for (const item of transactions) {
      reverseTransactionBalance(db, item);
    }

    if (transferMarker) {
      db.run(
        `delete from transactions
         where notes = ?
          and account_id in (select id from accounts where user_id = ?)`,
        [transferMarker, userId],
      );
    } else {
      db.run("delete from transactions where id = ?", [id]);
    }

    db.run("commit");
  } catch (error) {
    db.run("rollback");
    throw error;
  }

  persist(db);
}

export async function updateRecurringRule(
  userId: number,
  id: number,
  input: Partial<RecurringRule>,
) {
  const db = await getDb();
  const current = one<RecurringRule>(
    db,
    `select recurring_rules.*, accounts.name as account_name,
      destination.name as transfer_to_account_name,
      categories.name as category_name, categories.color as category_color
     from recurring_rules
     join accounts on accounts.id = recurring_rules.account_id
     left join accounts destination
      on destination.id = recurring_rules.transfer_to_account_id
     join categories on categories.id = recurring_rules.category_id
     where recurring_rules.id = ? and accounts.user_id = ?`,
    [id, userId],
  );

  if (!current) {
    throw new Error("Recurring rule not found.");
  }

  const merchant = String(input.merchant ?? current.merchant).trim();
  const amount = Number(input.amount ?? current.amount);
  const nextOccurrenceDate = String(
    input.next_occurrence_date ?? current.next_occurrence_date,
  );
  const status = "pending";
  const endMonth =
    input.end_month === undefined
      ? current.end_month
      : isMonthString(input.end_month)
        ? input.end_month
        : null;

  if (!merchant) {
    throw new Error("Merchant is required.");
  }

  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error("A non-zero amount is required.");
  }

  if (!isDateString(nextOccurrenceDate)) {
    throw new Error("A valid next occurrence date is required.");
  }

  const nextAccountId = Number(input.account_id ?? current.account_id);
  const nextAccount = one<Account>(
    db,
    "select * from accounts where id = ? and user_id = ?",
    [nextAccountId, userId],
  );

  if (!nextAccount) {
    throw new Error("Account not found.");
  }

  const nextTransferToAccountId =
    input.transfer_to_account_id === undefined
      ? current.transfer_to_account_id
      : input.transfer_to_account_id
        ? Number(input.transfer_to_account_id)
        : null;

  if (nextTransferToAccountId) {
    const destination = one<Account>(db, "select * from accounts where id = ? and user_id = ?", [
      nextTransferToAccountId,
      userId,
    ]);

    if (!destination) {
      throw new Error("Transfer destination account not found.");
    }

    if (nextAccountId === nextTransferToAccountId) {
      throw new Error("Choose two different accounts.");
    }
  }

  db.run(
    `update recurring_rules
     set account_id = ?, transfer_to_account_id = ?, category_id = ?,
      merchant = ?, notes = ?, amount = ?, status = ?,
      next_occurrence_date = ?, end_month = ?, updated_at = current_timestamp
     where id = ?`,
    [
      nextAccountId,
      nextTransferToAccountId,
      Number(input.category_id ?? current.category_id),
      merchant,
      input.notes === undefined
        ? current.notes
        : input.notes
          ? String(input.notes)
          : null,
      amount,
      status,
      nextOccurrenceDate,
      endMonth,
      id,
    ],
  );
  persist(db);
}

export async function deleteRecurringRule(userId: number, id: number) {
  const db = await getDb();
  db.run(
    `delete from recurring_rules
     where id = ?
      and account_id in (select id from accounts where user_id = ?)`,
    [id, userId],
  );
  persist(db);
}

async function createInternalTransfer(input: {
  userId: number;
  sourceAccountId: number;
  destinationAccountId: number;
  amount: number;
  date?: string;
  status?: "cleared" | "pending";
  isRecurring?: boolean;
  endMonth?: string | null;
  requirePacDestination?: boolean;
}) {
  const db = await getDb();
  const sourceAccount = one<Account>(db, "select * from accounts where id = ? and user_id = ?", [
    input.sourceAccountId,
    input.userId,
  ]);
  const destinationAccount = one<Account>(db, "select * from accounts where id = ? and user_id = ?", [
    input.destinationAccountId,
    input.userId,
  ]);
  const amount = Number(input.amount);
  const status = input.isRecurring
    ? "pending"
    : input.status === "pending"
      ? "pending"
      : "cleared";

  if (!sourceAccount) {
    throw new Error("Source account not found.");
  }

  if (!destinationAccount) {
    throw new Error("Destination account not found.");
  }

  if (sourceAccount.id === destinationAccount.id) {
    throw new Error("Choose two different accounts.");
  }

  if (input.requirePacDestination && destinationAccount.type !== "PAC") {
    throw new Error("The destination account must be a PAC.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("A positive amount is required.");
  }

  ensureDefaultCategories(db);
  const transferCategory = one<Category>(
    db,
    "select * from categories where name = 'Transfers'",
  );

  if (!transferCategory) {
    throw new Error("Transfer category is missing.");
  }

  const date = String(input.date ?? todayDateString());
  const isFutureRecurring = Boolean(input.isRecurring) && date > todayDateString();
  const endMonth = isMonthString(input.endMonth) ? input.endMonth : null;
  const isPacTransfer = destinationAccount.type === "PAC";
  const transferId = `${isPacTransfer ? "pac" : "transfer"}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const outgoingMerchant = isPacTransfer
    ? `PAC contribution to ${destinationAccount.name}`
    : `Transfer to ${destinationAccount.name}`;
  const incomingMerchant = isPacTransfer
    ? `PAC contribution from ${sourceAccount.name}`
    : `Transfer from ${sourceAccount.name}`;
  const recurringMerchant = isPacTransfer
    ? sourceAccount.name
    : `Transfer to ${destinationAccount.name}`;

  db.run("begin transaction");

  try {
    if (!isFutureRecurring) {
      if (status === "cleared") {
        db.run("update accounts set balance = balance - ? where id = ?", [
          amount,
          sourceAccount.id,
        ]);
        db.run("update accounts set balance = balance + ? where id = ?", [
          amount,
          destinationAccount.id,
        ]);
      }
      db.run(
        `insert into transactions
          (account_id, category_id, merchant, notes, amount, date, status, is_recurring)
         values (?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          sourceAccount.id,
          transferCategory.id,
          outgoingMerchant,
          `internal_transfer:${transferId}`,
          -amount,
          date,
          status,
        ],
      );
      db.run(
        `insert into transactions
          (account_id, category_id, merchant, notes, amount, date, status, is_recurring)
         values (?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          destinationAccount.id,
          transferCategory.id,
          incomingMerchant,
          `internal_transfer:${transferId}`,
          amount,
          date,
          status,
        ],
      );
    }

    if (input.isRecurring) {
      db.run(
        `insert into recurring_rules
          (account_id, transfer_to_account_id, category_id, merchant, notes,
            amount, status, frequency, next_occurrence_date, end_month)
         values (?, ?, ?, ?, ?, ?, ?, 'monthly', ?, ?)`,
        [
          sourceAccount.id,
          destinationAccount.id,
          transferCategory.id,
          recurringMerchant,
          outgoingMerchant,
          amount,
          status,
          isFutureRecurring ? date : addMonthlyOccurrence(date),
          endMonth,
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

export async function createPacContribution(input: {
  userId: number;
  sourceAccountId: number;
  pacAccountId: number;
  amount: number;
  date?: string;
  isRecurring?: boolean;
  endMonth?: string | null;
}) {
  await createInternalTransfer({
    userId: input.userId,
    sourceAccountId: input.sourceAccountId,
    destinationAccountId: input.pacAccountId,
    amount: input.amount,
    date: input.date,
    status: "cleared",
    isRecurring: input.isRecurring,
    endMonth: input.endMonth,
    requirePacDestination: true,
  });
}

export async function createAccountTransfer(input: {
  userId: number;
  sourceAccountId: number;
  destinationAccountId: number;
  amount: number;
  date?: string;
  status?: "cleared" | "pending";
  isRecurring?: boolean;
  endMonth?: string | null;
}) {
  await createInternalTransfer(input);
}

export async function updateBudget(userId: number, id: number, amount: number) {
  const db = await getDb();
  db.run("update budgets set amount = ? where id = ? and user_id = ?", [
    amount,
    id,
    userId,
  ]);
  persist(db);
}

export async function createBudget(userId: number, input: Partial<Budget>) {
  const db = await getDb();
  const categoryId = Number(input.category_id ?? 0);
  const amount = Number(input.amount ?? 0);

  if (!categoryId || amount <= 0) {
    throw new Error("A category and positive amount are required.");
  }

  db.run("insert into budgets (user_id, category_id, amount) values (?, ?, ?)", [
    userId,
    categoryId,
    amount,
  ]);
  persist(db);
}

export async function importSnapshot(
  snapshot: BackupSnapshot,
  options: { requireUsers?: boolean } = {},
) {
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
  const users = Array.isArray(snapshot.users) ? snapshot.users : null;
  const snapshotUserId = (value: unknown) => {
    const userId = Number(value);

    return Number.isFinite(userId) && userId > 0 ? userId : legacyWorkspaceOwnerId(db);
  };

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

  if (options.requireUsers && !users) {
    throw new Error("This backup does not include users. Export a new full backup first.");
  }

  if (users) {
    if (
      users.length === 0 ||
      !users.some((user) => user.role === "superuser")
    ) {
      throw new Error("The backup must include at least one superuser.");
    }

    for (const user of users) {
      if (
        !Number.isFinite(Number(user.id)) ||
        !String(user.name ?? "").trim() ||
        !String(user.email ?? "").trim() ||
        !String(user.password_hash ?? "").trim() ||
        (user.role !== "superuser" && user.role !== "user")
      ) {
        throw new Error("The backup contains an invalid user.");
      }
    }
  }

  db.run("begin transaction");

  try {
    db.run(`
      delete from sessions;
      delete from recurring_rules;
      delete from savings_interest_rules;
      delete from transactions;
      delete from budgets;
      delete from goals;
      delete from accounts;
      delete from categories;
      ${users ? "delete from users;" : ""}
      delete from app_meta;
      delete from sqlite_sequence
        where name in (
          'users',
          'recurring_rules',
          'savings_interest_rules',
          'transactions',
          'budgets',
          'goals',
          'accounts',
          'categories'
        );
    `);

    if (users) {
      for (const user of users) {
        db.run(
          `insert into users
            (id, name, email, password_hash, role, created_at)
           values (?, ?, ?, ?, ?, ?)`,
          [
            Number(user.id),
            String(user.name),
            String(user.email),
            String(user.password_hash),
            user.role === "superuser" ? "superuser" : "user",
            String(user.created_at ?? new Date().toISOString()),
          ],
        );
      }
    }

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
          (id, user_id, name, type, institution, balance, color, sort_order, created_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(account.id),
          snapshotUserId(account.user_id),
          String(account.name),
          String(account.type),
          String(account.institution),
          Number(account.balance),
          String(account.color),
          Number(account.sort_order ?? account.id),
          String(account.created_at ?? new Date().toISOString()),
        ],
      );
    }

    for (const goal of snapshot.goals) {
      db.run(
        `insert into goals
          (id, user_id, name, target_amount, current_amount, due_date, color)
         values (?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(goal.id),
          snapshotUserId(goal.user_id),
          String(goal.name),
          Number(goal.target_amount),
          Number(goal.current_amount),
          String(goal.due_date),
          String(goal.color),
        ],
      );
    }

    for (const budget of snapshot.budgets) {
      db.run("insert into budgets (id, user_id, category_id, amount) values (?, ?, ?, ?)", [
        Number(budget.id),
        snapshotUserId(budget.user_id),
        Number(budget.category_id),
        Number(budget.amount),
      ]);
    }

    for (const transaction of snapshot.transactions) {
      const isRecurring = Boolean(transaction.is_recurring);
      const frequency = isRecurring ? "monthly" : "none";
      const nextOccurrenceDate = isRecurring
        ? (isDateString(transaction.next_occurrence_date)
            ? transaction.next_occurrence_date
            : addMonthlyOccurrence(transaction.date))
        : null;

      db.run(
        `insert into transactions
          (id, account_id, category_id, merchant, notes, amount, date, status,
            is_recurring, recurrence_frequency, next_occurrence_date,
            recurring_parent_id)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(transaction.id),
          Number(transaction.account_id),
          Number(transaction.category_id),
          String(transaction.merchant),
          transaction.notes ? String(transaction.notes) : null,
          Number(transaction.amount),
          String(transaction.date),
          transaction.status === "pending" ? "pending" : "cleared",
          isRecurring ? 1 : 0,
          frequency,
          nextOccurrenceDate,
          transaction.recurring_parent_id ? Number(transaction.recurring_parent_id) : null,
        ],
      );
    }

    if (Array.isArray(snapshot.recurring)) {
      for (const rule of snapshot.recurring) {
        if (!accountIds.has(Number(rule.account_id)) || !categoryIds.has(Number(rule.category_id))) {
          continue;
        }

        db.run(
          `insert into recurring_rules
            (id, account_id, transfer_to_account_id, category_id, merchant,
              notes, amount, status, frequency, next_occurrence_date,
              end_month, created_at, updated_at)
           values (?, ?, ?, ?, ?, ?, ?, ?, 'monthly', ?, ?, ?, ?)`,
          [
            Number(rule.id),
            Number(rule.account_id),
            rule.transfer_to_account_id ? Number(rule.transfer_to_account_id) : null,
            Number(rule.category_id),
            String(rule.merchant),
            rule.notes ? String(rule.notes) : null,
            Number(rule.amount),
            rule.status === "pending" ? "pending" : "cleared",
            isDateString(rule.next_occurrence_date)
              ? rule.next_occurrence_date
              : addMonthlyOccurrence(todayDateString()),
            isMonthString(rule.end_month) ? rule.end_month : null,
            String(rule.created_at ?? new Date().toISOString()),
            String(rule.updated_at ?? new Date().toISOString()),
          ],
        );
      }
      db.run(
        "insert or replace into app_meta (key, value) values ('recurring_rules_migrated', '1')",
      );
    } else {
      migrateRecurringRules(db);
    }

    if (Array.isArray(snapshot.savingsInterestRules)) {
      for (const rule of snapshot.savingsInterestRules) {
        if (!accountIds.has(Number(rule.account_id))) {
          continue;
        }

        db.run(
          `insert into savings_interest_rules
            (id, account_id, gross_annual_rate, tax_rate, start_date, end_date,
              last_accrual_date, accrued_gross_remainder,
              accrued_tax_remainder, created_at, updated_at)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            Number(rule.id),
            Number(rule.account_id),
            Number(rule.gross_annual_rate),
            Number(rule.tax_rate ?? 26),
            isDateString(rule.start_date) ? rule.start_date : todayDateString(),
            isDateString(rule.end_date) ? rule.end_date : null,
            isDateString(rule.last_accrual_date) ? rule.last_accrual_date : null,
            Number(rule.accrued_gross_remainder ?? 0),
            Number(rule.accrued_tax_remainder ?? 0),
            String(rule.created_at ?? new Date().toISOString()),
            String(rule.updated_at ?? new Date().toISOString()),
          ],
        );
      }
    }

    if (Array.isArray(snapshot.appMeta)) {
      for (const item of snapshot.appMeta) {
        db.run("insert or replace into app_meta (key, value) values (?, ?)", [
          String(item.key),
          String(item.value),
        ]);
      }
    }

    if (Array.isArray(snapshot.sqliteSequence)) {
      for (const item of snapshot.sqliteSequence) {
        db.run("delete from sqlite_sequence where name = ?", [String(item.name)]);
        db.run("insert into sqlite_sequence (name, seq) values (?, ?)", [
          String(item.name),
          Number(item.seq),
        ]);
      }
    }

    db.run("commit");
  } catch (error) {
    db.run("rollback");
    throw error;
  }

  persist(db);
}

export async function createGoal(userId: number, input: Partial<Goal>) {
  const db = await getDb();
  db.run(
    "insert into goals (user_id, name, target_amount, current_amount, due_date, color) values (?, ?, ?, ?, ?, ?)",
    [
      userId,
      String(input.name ?? "New goal"),
      Number(input.target_amount ?? 1000),
      Number(input.current_amount ?? 0),
      String(input.due_date ?? monthDate(6, 1)),
      String(input.color ?? "#e0a928"),
    ],
  );
  persist(db);
}

export async function updateGoal(userId: number, id: number, input: Partial<Goal>) {
  const db = await getDb();
  db.run(
    "update goals set name = ?, target_amount = ?, current_amount = ?, due_date = ?, color = ? where id = ? and user_id = ?",
    [
      String(input.name ?? "Goal"),
      Number(input.target_amount ?? 1000),
      Number(input.current_amount ?? 0),
      String(input.due_date ?? monthDate(6, 1)),
      String(input.color ?? "#e0a928"),
      id,
      userId,
    ],
  );
  persist(db);
}

export async function deleteGoal(userId: number, id: number) {
  const db = await getDb();
  db.run("delete from goals where id = ? and user_id = ?", [id, userId]);
  persist(db);
}

export async function clearWorkspaceData() {
  const db = await getDb();
  db.run(`
    delete from recurring_rules;
    delete from savings_interest_rules;
    delete from transactions;
    delete from budgets;
    delete from goals;
    delete from accounts;
    delete from sqlite_sequence
      where name in (
        'recurring_rules',
        'savings_interest_rules',
        'transactions',
        'budgets',
        'goals',
        'accounts'
      );
  `);
  ensureDefaultCategories(db);
  persist(db);
}

export async function removeDemoData() {
  const db = await getDb();
  db.run(`
    delete from recurring_rules
      where merchant in (
        'Orbit Labs Payroll',
        'Dividend Sweep',
        'Homestead Lending',
        'City Power',
        'Metro Pass',
        'StreamBox'
      );

    delete from savings_interest_rules
      where account_id in (
        select id from accounts
        where name in (
          'Everyday Checking',
          'High Yield Savings',
          'Travel Rewards Card',
          'Brokerage',
          'Mortgage'
        )
      );

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

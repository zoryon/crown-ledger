"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Goal as GoalIcon,
  Home,
  LayoutDashboard,
  LineChart,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Settings,
  Target,
  Trash2,
  Upload,
  WalletCards,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import type { AppSummary, Budget, Goal, Transaction } from "@/lib/types";

type View = "overview" | "transactions" | "budgets" | "goals" | "accounts";

type Props = {
  initialData: AppSummary;
};

type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const moneyExact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const nav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: ReceiptText },
  { id: "budgets", label: "Budgets", icon: Target },
  { id: "goals", label: "Goals", icon: GoalIcon },
  { id: "accounts", label: "Accounts", icon: WalletCards },
] satisfies { id: View; label: string; icon: typeof LayoutDashboard }[];

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

async function sendJson(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string | number | boolean | null) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function transactionsCsv(transactions: Transaction[]) {
  const header = [
    "date",
    "merchant",
    "amount",
    "account",
    "category",
    "status",
    "recurring",
    "notes",
  ];
  const lines = transactions.map((transaction) =>
    [
      transaction.date,
      transaction.merchant,
      transaction.amount,
      transaction.account_name,
      transaction.category_name,
      transaction.status,
      transaction.is_recurring,
      transaction.notes,
    ]
      .map(csvEscape)
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

export function MoneyApp({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);

  async function refresh() {
    const response = await fetch("/api/summary", { cache: "no-store" });
    setData(await response.json());
  }

  async function mutate(task: () => Promise<unknown>) {
    setBusy(true);
    try {
      await task();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const filteredTransactions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return data.transactions;
    }

    return data.transactions.filter((transaction) =>
      [
        transaction.merchant,
        transaction.category_name,
        transaction.account_name,
        transaction.notes ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [data.transactions, query]);

  function exportJson() {
    downloadFile(
      `crown-ledger-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(data, null, 2),
      "application/json",
    );
  }

  function exportCsv() {
    downloadFile(
      `transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      transactionsCsv(data.transactions),
      "text/csv",
    );
  }

  function requestImportJson(snapshot: unknown) {
    setConfirmRequest({
      title: "Overwrite SQLite database?",
      message:
        "Importing this JSON replaces the current local SQLite data with the accounts, categories, budgets, goals, and transactions from the selected file. Export a backup first if you need to keep the current data.",
      confirmLabel: "Import JSON",
      onConfirm: () => mutate(() => sendJson("/api/settings/import", "POST", snapshot)),
    });
  }

  return (
    <div className="min-h-screen bg-[#f6f4ee] text-[#151815]">
      <div className="grid min-h-screen lg:grid-cols-[276px_1fr]">
        <aside className="hidden border-r border-black/10 bg-[#171b18] px-5 py-5 text-white lg:block">
          <div className="flex items-center gap-3 px-2">
            <div className="grid size-11 place-items-center rounded-md bg-[#f4b63f] text-[#171b18]">
              <BadgeDollarSign className="size-6" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-[0.01em]">Crown Ledger</p>
              <p className="text-xs text-white/55">Personal finance</p>
            </div>
          </div>

          <nav className="mt-9 space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={cx(
                    "flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-white/72 transition",
                    view === item.id && "bg-[#2a302b] text-white shadow-sm",
                    view !== item.id && "hover:bg-white/9 hover:text-white",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-9 rounded-md border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Monthly pulse</p>
              <LineChart className="size-4 text-[#f4b63f]" />
            </div>
            <p className="mt-4 text-3xl font-semibold">
              {money.format(data.totals.monthlySavings)}
            </p>
            <p className="mt-1 text-xs text-white/55">Income less spending this month</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#38b487]"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      8,
                      (data.totals.monthlySavings / Math.max(data.totals.monthlyIncome, 1)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-black/10 bg-[#f6f4ee]/88 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="grid size-10 place-items-center rounded-md bg-[#171b18] text-white lg:hidden">
                  <BadgeDollarSign className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold sm:text-2xl">
                    {nav.find((item) => item.id === view)?.label}
                  </p>
                  <p className="text-xs text-black/50">
                    {new Date().toLocaleDateString("en", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="hidden h-10 min-w-[260px] items-center gap-2 rounded-md border border-black/10 bg-white px-3 shadow-sm md:flex">
                <Search className="size-4 text-black/35" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-black/35"
                />
              </div>

              <button
                onClick={exportJson}
                className="grid size-10 place-items-center rounded-md border border-black/10 bg-white text-black/70 shadow-sm transition hover:text-black"
                title="Export"
              >
                <Download className="size-4" />
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="grid size-10 place-items-center rounded-md border border-black/10 bg-white text-black/70 shadow-sm transition hover:text-black"
                title="Settings"
              >
                <Settings className="size-4" />
              </button>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={cx(
                      "flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium",
                      view === item.id
                        ? "border-[#171b18] bg-[#171b18] text-white"
                        : "border-black/10 bg-white text-black/64",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </header>

          <div className="px-4 py-5 sm:px-6 lg:px-8">
            {view === "overview" && (
              <Overview
                data={data}
                busy={busy}
                onMutate={mutate}
                onViewChange={setView}
              />
            )}
            {view === "transactions" && (
              <Transactions
                data={data}
                transactions={filteredTransactions}
                busy={busy}
                onMutate={mutate}
                onRequestConfirm={setConfirmRequest}
                query={query}
                setQuery={setQuery}
              />
            )}
            {view === "budgets" && (
              <Budgets data={data} busy={busy} onMutate={mutate} />
            )}
            {view === "goals" && (
              <Goals
                data={data}
                busy={busy}
                onMutate={mutate}
                onRequestConfirm={setConfirmRequest}
              />
            )}
            {view === "accounts" && (
              <Accounts
                data={data}
                busy={busy}
                onMutate={mutate}
                onRequestConfirm={setConfirmRequest}
              />
            )}
          </div>
        </main>
      </div>

      {settingsOpen && (
        <SettingsPanel
          data={data}
          busy={busy}
          onClose={() => setSettingsOpen(false)}
          onExportJson={exportJson}
          onExportCsv={exportCsv}
          onImportJson={requestImportJson}
          onRefresh={() => mutate(refresh)}
          onReset={() => mutate(() => sendJson("/api/settings/reset", "POST"))}
          onRemoveDemo={() =>
            mutate(() => sendJson("/api/settings/remove-demo", "POST"))
          }
          onRequestConfirm={setConfirmRequest}
        />
      )}

      {confirmRequest && (
        <ConfirmModal
          request={confirmRequest}
          busy={busy}
          onCancel={() => setConfirmRequest(null)}
          onConfirm={async () => {
            await confirmRequest.onConfirm();
            setConfirmRequest(null);
          }}
        />
      )}
    </div>
  );
}

function ConfirmModal({
  request,
  busy,
  onCancel,
  onConfirm,
}: {
  request: ConfirmRequest;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-md border border-black/10 bg-[#f8f7f2] p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[#d94864]/10 text-[#d94864]">
            <Trash2 className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{request.title}</h2>
            <p className="mt-2 text-sm leading-6 text-black/58">{request.message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="h-10 rounded-md border border-black/10 bg-white px-4 text-sm font-semibold text-black/70 disabled:opacity-55"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="h-10 rounded-md bg-[#d94864] px-4 text-sm font-semibold text-white disabled:opacity-55"
          >
            {request.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function SettingsPanel({
  data,
  busy,
  onClose,
  onExportJson,
  onExportCsv,
  onImportJson,
  onRefresh,
  onReset,
  onRemoveDemo,
  onRequestConfirm,
}: {
  data: AppSummary;
  busy: boolean;
  onClose: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImportJson: (snapshot: unknown) => void;
  onRefresh: () => Promise<void>;
  onReset: () => Promise<void>;
  onRemoveDemo: () => Promise<void>;
  onRequestConfirm: (request: ConfirmRequest) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImportFile(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      onImportJson(JSON.parse(await file.text()));
    } catch {
      window.alert("That file is not valid JSON.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <section className="w-full max-w-xl rounded-md border border-black/10 bg-[#f8f7f2] shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 p-5">
          <div>
            <h2 className="text-lg font-semibold">Settings</h2>
            <p className="text-sm text-black/50">Local SQLite workspace</p>
          </div>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-md border border-black/10 bg-white text-black/60"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              void handleImportFile(event.target.files?.[0]);
            }}
          />
          <ActionButton
            icon={<FileJson className="size-4" />}
            label="Export JSON"
            detail="Full app snapshot"
            onClick={onExportJson}
          />
          <ActionButton
            icon={<Upload className="size-4" />}
            label="Import JSON"
            detail="Restore snapshot"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          />
          <ActionButton
            icon={<FileSpreadsheet className="size-4" />}
            label="Export CSV"
            detail="Transactions only"
            onClick={onExportCsv}
          />
          <ActionButton
            icon={<RefreshCw className="size-4" />}
            label="Refresh"
            detail="Reload SQLite data"
            onClick={onRefresh}
            disabled={busy}
          />
          <ActionButton
            icon={<Database className="size-4" />}
            label="Remove Demo"
            detail="Keep your entries"
            onClick={() =>
              onRequestConfirm({
                title: "Remove demo data?",
                message:
                  "This removes the sample accounts, transactions, budgets, and goals that came with the app. Your own entries are kept.",
                confirmLabel: "Remove demo",
                onConfirm: onRemoveDemo,
              })
            }
            disabled={busy}
          />
          <ActionButton
            icon={<Trash2 className="size-4" />}
            label="Clear Data"
            detail="Delete all your entries"
            onClick={() =>
              onRequestConfirm({
                title: "Clear all data?",
                message:
                  "This deletes every account, transaction, budget, and goal from your local SQLite database.",
                confirmLabel: "Clear data",
                onConfirm: onReset,
              })
            }
            disabled={busy}
            danger
          />
        </div>

        <div className="border-t border-black/10 p-5">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-black/45">Accounts</p>
              <p className="mt-1 font-semibold">{data.accounts.length}</p>
            </div>
            <div>
              <p className="text-black/45">Transactions</p>
              <p className="mt-1 font-semibold">{data.transactions.length}</p>
            </div>
            <div>
              <p className="text-black/45">Budgets</p>
              <p className="mt-1 font-semibold">{data.budgets.length}</p>
            </div>
          </div>
          <p className="mt-4 rounded-md border border-black/10 bg-white p-3 text-xs text-black/55">
            Database file: data/monarch.sqlite
          </p>
        </div>
      </section>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  detail,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "flex min-h-[76px] items-center gap-3 rounded-md border bg-white p-4 text-left shadow-sm transition disabled:opacity-55",
        danger
          ? "border-[#d94864]/30 hover:border-[#d94864]"
          : "border-black/10 hover:border-[#171b18]",
      )}
    >
      <span
        className={cx(
          "grid size-10 shrink-0 place-items-center rounded-md",
          danger ? "bg-[#d94864]/10 text-[#d94864]" : "bg-[#171b18] text-white",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block truncate text-xs text-black/45">{detail}</span>
      </span>
    </button>
  );
}

function Overview({
  data,
  busy,
  onMutate,
  onViewChange,
}: {
  data: AppSummary;
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  onViewChange: (view: View) => void;
}) {
  const maxFlow = Math.max(
    1,
    ...data.cashFlow.flatMap((point) => [point.income, point.expenses]),
  );

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-md border border-black/10 bg-[#171b18] p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white/55">Net worth</p>
              <p className="mt-2 text-4xl font-semibold sm:text-5xl">
                {money.format(data.totals.netWorth)}
              </p>
            </div>
            <div className="rounded-md bg-white/10 px-3 py-2 text-sm text-white/75">
              {data.accounts.length} accounts
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Metric
              label="Income"
              value={money.format(data.totals.monthlyIncome)}
              icon={<ArrowDownLeft className="size-4" />}
              tone="green"
            />
            <Metric
              label="Spending"
              value={money.format(data.totals.monthlyExpenses)}
              icon={<ArrowUpRight className="size-4" />}
              tone="coral"
            />
            <Metric
              label="Saved"
              value={money.format(data.totals.monthlySavings)}
              icon={<CircleDollarSign className="size-4" />}
              tone="gold"
            />
          </div>
        </div>

        <QuickTransactionForm data={data} busy={busy} onMutate={onMutate} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Cash flow</h2>
            <BarChart3 className="size-4 text-black/45" />
          </div>
          <div className="mt-6 flex h-64 items-end gap-3">
            {data.cashFlow.map((point) => (
              <div key={point.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-48 w-full items-end justify-center gap-1">
                  <div
                    className="w-[38%] rounded-t-sm bg-[#38b487]"
                    title={`Income ${money.format(point.income)}`}
                    style={{ height: `${Math.max(8, (point.income / maxFlow) * 100)}%` }}
                  />
                  <div
                    className="w-[38%] rounded-t-sm bg-[#e46f54]"
                    title={`Expenses ${money.format(point.expenses)}`}
                    style={{ height: `${Math.max(8, (point.expenses / maxFlow) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-black/50">{point.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent transactions</h2>
            <button
              onClick={() => onViewChange("transactions")}
              className="flex h-8 items-center gap-1 rounded-md border border-black/10 px-2 text-sm text-black/60"
            >
              View <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mt-4 divide-y divide-black/8">
            {data.transactions.slice(0, 7).map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-md border border-black/10 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Budgets</h2>
            <button
              onClick={() => onViewChange("budgets")}
              className="grid size-8 place-items-center rounded-md border border-black/10"
              title="Open budgets"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.budgets.slice(0, 4).map((budget) => (
              <BudgetLine key={budget.id} budget={budget} />
            ))}
          </div>
        </div>

        <div className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recurring</h2>
            <CalendarClock className="size-4 text-black/45" />
          </div>
          <div className="mt-4 space-y-3">
            {data.recurring.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{transaction.merchant}</p>
                  <p className="text-xs text-black/45">{transaction.category_name}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold">
                  {moneyExact.format(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "green" | "coral" | "gold";
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-4">
      <div
        className={cx(
          "grid size-8 place-items-center rounded-md",
          tone === "green" && "bg-[#38b487]/18 text-[#70d8aa]",
          tone === "coral" && "bg-[#e46f54]/18 text-[#ffae9b]",
          tone === "gold" && "bg-[#f4b63f]/18 text-[#ffd477]",
        )}
      >
        {icon}
      </div>
      <p className="mt-4 text-xs text-white/55">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function QuickTransactionForm({
  data,
  busy,
  onMutate,
}: {
  data: AppSummary;
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
}) {
  if (data.accounts.length === 0) {
    return (
      <div className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Add transaction</h2>
          <Plus className="size-4 text-black/45" />
        </div>
        <p className="mt-4 text-sm text-black/55">
          Add one of your accounts first, then transactions can be assigned to it.
        </p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const kind = String(formData.get("kind"));
    const amount = Number(formData.get("amount") ?? 0);

    await onMutate(() =>
      sendJson("/api/transactions", "POST", {
        merchant: formData.get("merchant"),
        account_id: Number(formData.get("account_id")),
        category_id: Number(formData.get("category_id")),
        amount: kind === "expense" ? -Math.abs(amount) : Math.abs(amount),
        date: formData.get("date"),
        status: formData.get("status"),
        is_recurring: formData.get("is_recurring") === "on",
      }),
    );

    form.reset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-black/10 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Add transaction</h2>
        <Plus className="size-4 text-black/45" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field name="merchant" placeholder="Merchant" required />
        <Field name="amount" type="number" step="0.01" placeholder="Amount" required />
        <Select name="kind" defaultValue="expense">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </Select>
        <Select name="status" defaultValue="cleared">
          <option value="cleared">Cleared</option>
          <option value="pending">Pending</option>
        </Select>
        <Select name="account_id" defaultValue={data.accounts[0]?.id}>
          {data.accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
        <Select name="category_id" defaultValue={data.categories[0]?.id}>
          {data.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Field
          name="date"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
        <label className="flex h-11 items-center gap-2 rounded-md border border-black/10 bg-[#f7f7f3] px-3 text-sm text-black/70">
          <input name="is_recurring" type="checkbox" className="size-4 accent-[#171b18]" />
          Recurring
        </label>
      </div>
      <button
        disabled={busy}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#171b18] px-4 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
      >
        <Check className="size-4" />
        Save
      </button>
    </form>
  );
}

function Transactions({
  data,
  transactions,
  busy,
  onMutate,
  onRequestConfirm,
  query,
  setQuery,
}: {
  data: AppSummary;
  transactions: Transaction[];
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  onRequestConfirm: (request: ConfirmRequest) => void;
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <QuickTransactionForm data={data} busy={busy} onMutate={onMutate} />
      <section className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Transactions</h2>
          <div className="flex h-10 w-full items-center gap-2 rounded-md border border-black/10 bg-[#f7f7f3] px-3 sm:w-[300px]">
            <Search className="size-4 text-black/35" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-sm outline-none placeholder:text-black/35"
            />
          </div>
        </div>
        <div className="mt-4 divide-y divide-black/8">
          {transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              onDelete={() =>
                onRequestConfirm({
                  title: "Delete transaction?",
                  message: `${transaction.merchant} (${moneyExact.format(
                    transaction.amount,
                  )}) will be removed from your ledger.`,
                  confirmLabel: "Delete transaction",
                  onConfirm: () =>
                    onMutate(() =>
                      sendJson(`/api/transactions/${transaction.id}`, "DELETE"),
                    ),
                })
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function TransactionRow({
  transaction,
  compact,
  onDelete,
}: {
  transaction: Transaction;
  compact?: boolean;
  onDelete?: () => void;
}) {
  const isIncome = transaction.amount > 0;

  return (
    <div className="flex min-h-[64px] items-center gap-3 py-3">
      <div
        className="grid size-10 shrink-0 place-items-center rounded-md text-white"
        style={{ backgroundColor: transaction.category_color }}
      >
        {isIncome ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{transaction.merchant}</p>
        <p className="truncate text-xs text-black/45">
          {transaction.category_name} · {transaction.account_name}
        </p>
      </div>
      {!compact && (
        <p className="hidden w-24 shrink-0 text-sm text-black/45 sm:block">
          {new Date(`${transaction.date}T00:00:00`).toLocaleDateString("en", {
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
      <p className={cx("shrink-0 text-sm font-semibold", isIncome && "text-[#177b55]")}>
        {moneyExact.format(transaction.amount)}
      </p>
      {onDelete && (
        <button
          onClick={onDelete}
          className="grid size-8 shrink-0 place-items-center rounded-md border border-black/10 text-black/45 transition hover:text-[#d94864]"
          title="Delete"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}

function Budgets({
  data,
  busy,
  onMutate,
}: {
  data: AppSummary;
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
}) {
  const budgetedCategoryIds = new Set(
    data.budgets.map((budget) => budget.category_id),
  );
  const availableCategories = data.categories.filter(
    (category) => !budgetedCategoryIds.has(category.id),
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <BudgetCreateForm
        categories={availableCategories}
        busy={busy}
        onMutate={onMutate}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {data.budgets.length === 0 && (
          <div className="rounded-md border border-black/10 bg-white p-5 text-sm text-black/55 shadow-sm">
            No budgets yet. Add one by choosing a category and monthly amount.
          </div>
        )}
        {data.budgets.map((budget) => (
          <BudgetEditor key={budget.id} budget={budget} busy={busy} onMutate={onMutate} />
        ))}
      </section>
    </div>
  );
}

function BudgetCreateForm({
  categories,
  busy,
  onMutate,
}: {
  categories: AppSummary["categories"];
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
}) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (categories.length === 0) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    await onMutate(() =>
      sendJson("/api/budgets", "POST", {
        category_id: Number(formData.get("category_id")),
        amount: Number(formData.get("amount")),
      }),
    );
    form.reset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-black/10 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Add budget</h2>
        <Target className="size-4 text-black/45" />
      </div>

      {categories.length === 0 ? (
        <p className="mt-4 text-sm text-black/55">
          Every category already has a budget.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <Select name="category_id" defaultValue={categories[0]?.id}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Field
            name="amount"
            type="number"
            min="1"
            step="0.01"
            placeholder="Monthly amount"
            required
          />
          <button
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#171b18] text-sm font-semibold text-white disabled:opacity-60"
          >
            <Plus className="size-4" />
            Add
          </button>
        </div>
      )}
    </form>
  );
}

function BudgetEditor({
  budget,
  busy,
  onMutate,
}: {
  budget: Budget;
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
}) {
  const [amount, setAmount] = useState(String(Math.round(budget.amount)));

  return (
    <div className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
      <BudgetLine budget={{ ...budget, amount: Number(amount) || 0 }} />
      <div className="mt-5 flex gap-2">
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          type="number"
          className="h-10 min-w-0 flex-1 rounded-md border border-black/10 bg-[#f7f7f3] px-3 text-sm outline-none focus:border-[#171b18]"
        />
        <button
          disabled={busy}
          onClick={() =>
            onMutate(() =>
              sendJson(`/api/budgets/${budget.id}`, "PATCH", { amount: Number(amount) }),
            )
          }
          className="grid size-10 place-items-center rounded-md bg-[#171b18] text-white disabled:opacity-60"
          title="Save"
        >
          <Check className="size-4" />
        </button>
      </div>
    </div>
  );
}

function BudgetLine({ budget }: { budget: Budget }) {
  const percent = Math.min(100, (budget.spent / Math.max(budget.amount, 1)) * 100);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{budget.category_name}</p>
          <p className="text-xs text-black/45">{budget.group_name}</p>
        </div>
        <p className="shrink-0 text-sm font-semibold">{money.format(budget.amount)}</p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/8">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: budget.color }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-black/50">
        <span>{money.format(budget.spent)} spent</span>
        <span>{money.format(budget.remaining)} left</span>
      </div>
    </div>
  );
}

function Goals({
  data,
  busy,
  onMutate,
  onRequestConfirm,
}: {
  data: AppSummary;
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  onRequestConfirm: (request: ConfirmRequest) => void;
}) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    await onMutate(() =>
      sendJson("/api/goals", "POST", {
        name: formData.get("name"),
        target_amount: Number(formData.get("target_amount")),
        current_amount: Number(formData.get("current_amount")),
        due_date: formData.get("due_date"),
        color: formData.get("color"),
      }),
    );
    form.reset();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-md border border-black/10 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Add goal</h2>
          <Target className="size-4 text-black/45" />
        </div>
        <div className="mt-4 space-y-3">
          <Field name="name" placeholder="Goal name" required />
          <Field name="target_amount" type="number" placeholder="Target" required />
          <Field name="current_amount" type="number" placeholder="Saved" required />
          <Field name="due_date" type="date" required />
          <Field name="color" type="color" defaultValue="#e0a928" />
        </div>
        <button
          disabled={busy}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#171b18] text-sm font-semibold text-white disabled:opacity-60"
        >
          <Plus className="size-4" />
          Add
        </button>
      </form>

      <section className="grid gap-4 lg:grid-cols-2">
        {data.goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onDelete={() =>
              onRequestConfirm({
                title: "Delete goal?",
                message: `${goal.name} will be removed from your goals.`,
                confirmLabel: "Delete goal",
                onConfirm: () =>
                  onMutate(() => sendJson(`/api/goals/${goal.id}`, "DELETE")),
              })
            }
          />
        ))}
      </section>
    </div>
  );
}

function GoalCard({ goal, onDelete }: { goal: Goal; onDelete: () => void }) {
  const percent = Math.min(100, (goal.current_amount / Math.max(goal.target_amount, 1)) * 100);

  return (
    <div className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{goal.name}</p>
          <p className="mt-1 text-xs text-black/45">
            {new Date(`${goal.due_date}T00:00:00`).toLocaleDateString("en", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="grid size-8 place-items-center rounded-md border border-black/10 text-black/45 transition hover:text-[#d94864]"
          title="Delete"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="mt-7 flex items-end justify-between gap-4">
        <p className="text-3xl font-semibold">{Math.round(percent)}%</p>
        <p className="text-sm text-black/55">
          {money.format(goal.current_amount)} / {money.format(goal.target_amount)}
        </p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/8">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: goal.color }}
        />
      </div>
    </div>
  );
}

function Accounts({
  data,
  busy,
  onMutate,
  onRequestConfirm,
}: {
  data: AppSummary;
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  onRequestConfirm: (request: ConfirmRequest) => void;
}) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    await onMutate(() =>
      sendJson("/api/accounts", "POST", {
        name: formData.get("name"),
        type: formData.get("type"),
        institution: formData.get("institution"),
        balance: Number(formData.get("balance")),
        color: formData.get("color"),
      }),
    );
    form.reset();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-md border border-black/10 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Add account</h2>
          <Banknote className="size-4 text-black/45" />
        </div>
        <div className="mt-4 space-y-3">
          <Field name="name" placeholder="Account name" required />
          <Field name="institution" placeholder="Institution" required />
          <Select name="type" defaultValue="Checking">
            <option>Checking</option>
            <option>Savings</option>
            <option>Credit Card</option>
            <option>Investment</option>
            <option>Loan</option>
          </Select>
          <Field name="balance" type="number" step="0.01" placeholder="Balance" required />
          <Field name="color" type="color" defaultValue="#219a68" />
        </div>
        <button
          disabled={busy}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#171b18] text-sm font-semibold text-white disabled:opacity-60"
        >
          <Plus className="size-4" />
          Add
        </button>
      </form>

      <section className="grid gap-4 lg:grid-cols-2">
        {data.accounts.map((account) => (
          <div
            key={account.id}
            className="rounded-md border border-black/10 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="grid size-11 shrink-0 place-items-center rounded-md text-white"
                  style={{ backgroundColor: account.color }}
                >
                  {account.type === "Credit Card" ? (
                    <CreditCard className="size-5" />
                  ) : account.type === "Loan" ? (
                    <Home className="size-5" />
                  ) : (
                    <WalletCards className="size-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{account.name}</p>
                  <p className="truncate text-xs text-black/45">
                    {account.institution} · {account.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  onRequestConfirm({
                    title: "Delete account?",
                    message: `${account.name} and all transactions assigned to it will be deleted.`,
                    confirmLabel: "Delete account",
                    onConfirm: () =>
                      onMutate(() =>
                        sendJson(`/api/accounts/${account.id}`, "DELETE"),
                      ),
                  })
                }
                className="grid size-8 shrink-0 place-items-center rounded-md border border-black/10 text-black/45 transition hover:text-[#d94864]"
                title="Delete"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <p className="mt-8 text-3xl font-semibold">{moneyExact.format(account.balance)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "h-11 w-full rounded-md border border-black/10 bg-[#f7f7f3] px-3 text-sm outline-none transition placeholder:text-black/35 focus:border-[#171b18]",
        props.type === "color" && "p-1",
        props.className,
      )}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(
        "h-11 w-full rounded-md border border-black/10 bg-[#f7f7f3] px-3 text-sm outline-none transition focus:border-[#171b18]",
        props.className,
      )}
    />
  );
}

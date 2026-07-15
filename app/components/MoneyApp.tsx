"use client";

import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  BadgeEuro,
  Banknote,
  BarChart3,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  CircleEuroSign,
  CreditCard,
  Database,
  FileJson,
  FileSpreadsheet,
  Goal as GoalIcon,
  Home,
  LayoutDashboard,
  LineChart,
  LogOut,
  Languages,
  Moon,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Settings,
  Sun,
  Target,
  Trash2,
  Upload,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  usePreferences,
  type Language,
  type ThemeMode,
} from "@/app/components/Preferences";
import type {
  AppSummary,
  AuthUser,
  Budget,
  Goal,
  RecurringRule,
  Transaction,
} from "@/lib/types";

type View = "overview" | "transactions" | "budgets" | "goals" | "accounts";

type Props = {
  initialData: AppSummary;
  currentUser: AuthUser;
  logoutAction: (formData: FormData) => Promise<void>;
};

type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
};

const appCurrency = "EUR";

const nav = [
  { id: "overview", icon: LayoutDashboard },
  { id: "transactions", icon: ReceiptText },
  { id: "budgets", icon: Target },
  { id: "goals", icon: GoalIcon },
  { id: "accounts", icon: WalletCards },
] satisfies { id: View; icon: typeof LayoutDashboard }[];

const ui = {
  en: {
    accounts: "Accounts",
    accountGroupAll: "All",
    accountGroupDebt: "Debt",
    accountGroupInvesting: "Investing",
    accountGroupLiquid: "Cash",
    add: "Add",
    addAccount: "Add account",
    addBudget: "Add budget",
    addGoal: "Add goal",
    addPacContribution: "Add PAC contribution",
    addTransaction: "Add transaction",
    addTransfer: "Add transfer",
    allCategoriesBudgeted: "Every category already has a budget.",
    amount: "Amount",
    appearance: "Appearance",
    automaticInterest: "Automatic interest",
    balance: "Balance",
    budgeted: "Budgets",
    budgets: "Budgets",
    cancel: "Cancel",
    cashFlow: "Cash flow",
    clearData: "Clear Data",
    clearDataConfirm: "Clear data",
    clearDataDetail: "Delete all your entries",
    clearDataMessage: "This deletes every account, transaction, budget, and goal from your local SQLite database.",
    clearDataTitle: "Clear all data?",
    close: "Close",
    databaseFile: "Database file: data/crown.sqlite",
    deleteAccountConfirm: "Delete account",
    deleteAccountMessage: (name: string) => `${name} and all transactions assigned to it will be deleted.`,
    deleteAccountTitle: "Delete account?",
    deleteGoalConfirm: "Delete goal",
    deleteGoalMessage: (name: string) => `${name} will be removed from your goals.`,
    deleteGoalTitle: "Delete goal?",
    deleteTransactionConfirm: "Delete transaction",
    deleteTransactionMessage: (merchant: string, amount: string) => `${merchant} (${amount}) will be removed from your ledger.`,
    deleteTransactionTitle: "Delete transaction?",
    deleteRecurringConfirm: "Stop recurring",
    deleteRecurringMessage: (merchant: string) => `${merchant} will stop generating future transactions. Existing transactions stay in your ledger.`,
    deleteRecurringTitle: "Stop this recurring transaction?",
    dining: "Dining",
    editAccount: "Edit account",
    editRecurring: "Edit recurring",
    endDate: "End date",
    expense: "Expense",
    export: "Export",
    exportCsv: "Export CSV",
    exportCsvDetail: "Transactions only",
    exportJson: "Export JSON",
    exportJsonDetail: "Full backup with users",
    finalMonth: "Final month",
    fromAccount: "From account",
    grossAnnualRate: "Gross p.a.",
    goals: "Goals",
    income: "Income",
    interestActive: "Active",
    interestTaxNote: "Daily gross interest with tax withheld before credit.",
    configureInterest: "Configure",
    stopInterest: "Stop interest",
    stopInterestMessage: (name: string) => `Automatic interest for ${name} will stop. Existing interest and tax transactions will stay in your ledger.`,
    stopInterestTitle: "Stop automatic interest?",
    importJson: "Import JSON",
    importJsonDetail: "Restore full backup",
    importMessage: "Importing this JSON replaces the current local SQLite data with the backup contents. Full backups also replace users and password hashes. Export a backup first if you need to keep the current data.",
    importTitle: "Overwrite SQLite database?",
    institution: "Institution",
    localWorkspace: "Local SQLite workspace",
    dark: "Dark",
    language: "Language",
    light: "Light",
    logOut: "Log out",
    logOutDetail: "End this browser session",
    merchant: "Merchant",
    monthlyAmount: "Monthly amount",
    monthlyPulse: "Monthly pulse",
    monthlyPulseDetail: "Income less spending this month",
    netWorth: "Net worth",
    nextPayment: "Next",
    normalTransaction: "Transaction",
    noAccountForTransaction: "Add one of your accounts first, then transactions can be assigned to it.",
    noBudgets: "No budgets yet. Add one by choosing a category and monthly amount.",
    noPacAccount: "Create a PAC account first, then you can add contributions to it.",
    noTransferAccounts: "Add at least two accounts before creating a transfer.",
    openBudgets: "Open budgets",
    overview: "Overview",
    personalFinance: "Personal finance",
    recurring: "Recurring",
    repeatMonthly: "Repeat monthly",
    refresh: "Refresh",
    refreshDetail: "Reload SQLite data",
    remaining: "left",
    removeDemo: "Remove Demo",
    removeDemoConfirm: "Remove demo",
    removeDemoDetail: "Keep your entries",
    removeDemoMessage: "This removes the sample accounts, transactions, budgets, and goals that came with the app. Your own entries are kept.",
    removeDemoTitle: "Remove demo data?",
    saved: "Saved",
    savedGoal: "Saved",
    save: "Save",
    search: "Search",
    settings: "Settings",
    spending: "Spending",
    spent: "spent",
    startDate: "Start date",
    target: "Target",
    taxRate: "Tax rate",
    toPac: "To PAC",
    toAccount: "To account",
    transfer: "Transfer",
    transactions: "Transactions",
    untilMonth: "Until",
    users: "Users",
    view: "View",
  },
  it: {
    accounts: "Conti",
    accountGroupAll: "Tutti",
    accountGroupDebt: "Debiti",
    accountGroupInvesting: "Investimenti",
    accountGroupLiquid: "Liquidità",
    add: "Aggiungi",
    addAccount: "Aggiungi conto",
    addBudget: "Aggiungi budget",
    addGoal: "Aggiungi obiettivo",
    addPacContribution: "Aggiungi versamento PAC",
    addTransaction: "Aggiungi transazione",
    addTransfer: "Aggiungi trasferimento",
    allCategoriesBudgeted: "Ogni categoria ha gia un budget.",
    amount: "Importo",
    appearance: "Aspetto",
    automaticInterest: "Interessi automatici",
    balance: "Saldo",
    budgeted: "Budget",
    budgets: "Budget",
    cancel: "Annulla",
    cashFlow: "Flusso di cassa",
    clearData: "Cancella dati",
    clearDataConfirm: "Cancella dati",
    clearDataDetail: "Elimina tutte le voci",
    clearDataMessage: "Elimina ogni conto, transazione, budget e obiettivo dal database SQLite locale.",
    clearDataTitle: "Cancellare tutti i dati?",
    close: "Chiudi",
    databaseFile: "File database: data/crown.sqlite",
    deleteAccountConfirm: "Elimina conto",
    deleteAccountMessage: (name: string) => `${name} e tutte le transazioni assegnate verranno eliminati.`,
    deleteAccountTitle: "Eliminare il conto?",
    deleteGoalConfirm: "Elimina obiettivo",
    deleteGoalMessage: (name: string) => `${name} verra rimosso dagli obiettivi.`,
    deleteGoalTitle: "Eliminare l'obiettivo?",
    deleteTransactionConfirm: "Elimina transazione",
    deleteTransactionMessage: (merchant: string, amount: string) => `${merchant} (${amount}) verra rimossa dal ledger.`,
    deleteTransactionTitle: "Eliminare la transazione?",
    deleteRecurringConfirm: "Ferma ricorrente",
    deleteRecurringMessage: (merchant: string) => `${merchant} non generera piu transazioni future. Le transazioni gia create restano nello storico.`,
    deleteRecurringTitle: "Fermare questa transazione ricorrente?",
    dining: "Ristoranti",
    editAccount: "Modifica conto",
    editRecurring: "Modifica ricorrente",
    endDate: "Data fine",
    expense: "Uscita",
    export: "Esporta",
    exportCsv: "Esporta CSV",
    exportCsvDetail: "Solo transazioni",
    exportJson: "Esporta JSON",
    exportJsonDetail: "Backup completo con utenti",
    finalMonth: "Mese finale",
    fromAccount: "Da conto",
    grossAnnualRate: "Lordo p.a.",
    goals: "Obiettivi",
    income: "Entrata",
    interestActive: "Attivo",
    interestTaxNote: "Interesse lordo giornaliero con trattenuta prima dell'accredito.",
    configureInterest: "Configura",
    stopInterest: "Ferma interessi",
    stopInterestMessage: (name: string) => `Gli interessi automatici per ${name} verranno fermati. Le transazioni interessi e tasse gia create restano nello storico.`,
    stopInterestTitle: "Fermare gli interessi automatici?",
    importJson: "Importa JSON",
    importJsonDetail: "Ripristina backup completo",
    importMessage: "Importare questo JSON sostituisce i dati SQLite locali con il contenuto del backup. I backup completi sostituiscono anche utenti e hash password. Esporta prima un backup se vuoi conservare i dati attuali.",
    importTitle: "Sovrascrivere il database SQLite?",
    institution: "Istituto",
    localWorkspace: "Workspace SQLite locale",
    dark: "Scuro",
    language: "Lingua",
    light: "Chiaro",
    logOut: "Esci",
    logOutDetail: "Termina questa sessione nel browser",
    merchant: "Esercente",
    monthlyAmount: "Importo mensile",
    monthlyPulse: "Andamento mensile",
    monthlyPulseDetail: "Entrate meno spese di questo mese",
    netWorth: "Patrimonio netto",
    nextPayment: "Prossima",
    normalTransaction: "Transazione",
    noAccountForTransaction: "Aggiungi prima un conto, poi potrai assegnargli le transazioni.",
    noBudgets: "Nessun budget. Aggiungine uno scegliendo categoria e importo mensile.",
    noPacAccount: "Crea prima un conto PAC, poi potrai aggiungere versamenti.",
    noTransferAccounts: "Aggiungi almeno due conti prima di creare un trasferimento.",
    openBudgets: "Apri budget",
    overview: "Panoramica",
    personalFinance: "Finanza personale",
    recurring: "Ricorrenti",
    repeatMonthly: "Ripeti ogni mese",
    refresh: "Aggiorna",
    refreshDetail: "Ricarica dati SQLite",
    remaining: "rimasti",
    removeDemo: "Rimuovi demo",
    removeDemoConfirm: "Rimuovi demo",
    removeDemoDetail: "Mantieni le tue voci",
    removeDemoMessage: "Rimuove conti, transazioni, budget e obiettivi di esempio. Le tue voci vengono mantenute.",
    removeDemoTitle: "Rimuovere i dati demo?",
    saved: "Risparmiato",
    savedGoal: "Accantonato",
    save: "Salva",
    search: "Cerca",
    settings: "Impostazioni",
    spending: "Spese",
    spent: "spesi",
    startDate: "Data inizio",
    target: "Obiettivo",
    taxRate: "Tassazione",
    toPac: "Verso PAC",
    toAccount: "A conto",
    transfer: "Trasferimento",
    transactions: "Transazioni",
    untilMonth: "Fino a",
    users: "Utenti",
    view: "Vedi",
  },
} satisfies Record<Language, Record<string, string | ((...args: string[]) => string)>>;

type UiText = typeof ui.en;

const systemValueTranslations: Record<"it", Record<string, string>> = {
  it: {
    Checking: "Conto corrente",
    Savings: "Risparmio",
    "Credit Card": "Carta di credito",
    Investment: "Investimento",
    Loan: "Prestito",
    PAC: "PAC",
    Income: "Entrate",
    Fixed: "Fisse",
    Flexible: "Variabili",
    Lifestyle: "Stile di vita",
    Paycheck: "Stipendio",
    Investments: "Investimenti",
    Interest: "Interessi",
    Housing: "Casa",
    Groceries: "Spesa",
    Dining: "Ristoranti",
    Transportation: "Trasporti",
    Shopping: "Shopping",
    Travel: "Viaggi",
    Subscriptions: "Abbonamenti",
    Utilities: "Utenze",
    Taxes: "Tasse",
    Transfers: "Trasferimenti",
    Internal: "Interni",
    cleared: "Contabilizzata",
    pending: "In sospeso",
  },
};

function translateSystemValue(value: string | null | undefined, language: Language) {
  if (!value || language === "en") {
    return value ?? "";
  }

  return systemValueTranslations.it[value] ?? value;
}

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

function transactionsCsv(transactions: Transaction[], language: Language) {
  const header =
    language === "it"
      ? [
          "data",
          "esercente",
          "importo",
          "conto",
          "categoria",
          "stato",
          "ricorrente",
          "note",
        ]
      : [
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
      translateSystemValue(transaction.category_name, language),
      translateSystemValue(transaction.status, language),
      transaction.is_recurring,
      transaction.notes,
    ]
      .map(csvEscape)
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

export function MoneyApp({ initialData, currentUser, logoutAction }: Props) {
  const { language, theme, setLanguage, setTheme } = usePreferences();
  const t = ui[language];
  const isSuperuser = currentUser.role === "superuser";
  const dateLocale = language === "it" ? "it-IT" : "en";
  const money = useMemo(
    () =>
      new Intl.NumberFormat(language === "it" ? "it-IT" : "en-US", {
        style: "currency",
        currency: appCurrency,
        currencyDisplay: "narrowSymbol",
        maximumFractionDigits: 0,
      }),
    [language],
  );
  const moneyExact = useMemo(
    () =>
      new Intl.NumberFormat(language === "it" ? "it-IT" : "en-US", {
        style: "currency",
        currency: appCurrency,
        currencyDisplay: "narrowSymbol",
      }),
    [language],
  );
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const pollingRefreshRef = useRef(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/summary", { cache: "no-store" });
    setData(await response.json());
  }, []);

  useEffect(() => {
    async function poll() {
      if (document.visibilityState !== "visible" || pollingRefreshRef.current) {
        return;
      }

      pollingRefreshRef.current = true;

      try {
        await refresh();
      } finally {
        pollingRefreshRef.current = false;
      }
    }

    const interval = window.setInterval(poll, 5 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void poll();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [refresh]);

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
        translateSystemValue(transaction.category_name, language),
        transaction.account_name,
        transaction.notes ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [data.transactions, language, query]);

  async function exportJson() {
    if (!isSuperuser) {
      return;
    }

    const response = await fetch("/api/settings/export", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    downloadFile(
      `crown-ledger-full-${new Date().toISOString().slice(0, 10)}.json`,
      await response.text(),
      "application/json",
    );
  }

  function exportCsv() {
    if (!isSuperuser) {
      return;
    }

    downloadFile(
      `transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      transactionsCsv(data.transactions, language),
      "text/csv",
    );
  }

  function requestImportJson(snapshot: unknown) {
    if (!isSuperuser) {
      return;
    }

    setConfirmRequest({
      title: t.importTitle,
      message: t.importMessage,
      confirmLabel: t.importJson,
      onConfirm: () => mutate(() => sendJson("/api/settings/import", "POST", snapshot)),
    });
  }

  return (
    <div className="min-h-screen bg-[#f6f4ee] text-[#151815]">
      <div className="grid min-h-screen lg:grid-cols-[276px_1fr]">
        <aside className="hidden border-r border-black/10 bg-[#171b18] px-5 py-5 text-white lg:block">
          <div className="flex items-center gap-3 px-2">
            <div className="grid size-11 place-items-center rounded-md bg-[#f4b63f] text-[#171b18]">
              <BadgeEuro className="size-6" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-[0.01em]">Crown Ledger</p>
              <p className="text-xs text-white/55">{t.personalFinance}</p>
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
                  {t[item.id]}
                </button>
              );
            })}
          </nav>

          <div className="mt-9 rounded-md border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{t.monthlyPulse}</p>
              <LineChart className="size-4 text-[#f4b63f]" />
            </div>
            <p className="mt-4 text-3xl font-semibold">
              {money.format(data.totals.monthlySavings)}
            </p>
            <p className="mt-1 text-xs text-white/55">{t.monthlyPulseDetail}</p>
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
                  <BadgeEuro className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold sm:text-2xl">
                    {t[view]}
                  </p>
                  <p className="text-xs text-black/50">
                    {new Date().toLocaleDateString(dateLocale, {
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
                  placeholder={t.search}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-black/35"
                />
              </div>

              {isSuperuser && (
                <Link
                  href="/users"
                  className="grid size-10 place-items-center rounded-md border border-black/10 bg-white text-black/70 shadow-sm transition hover:text-black"
                  title={t.users}
                >
                  <Users className="size-4" />
                </Link>
              )}
              <button
                onClick={() => setSettingsOpen(true)}
                className="grid size-10 place-items-center rounded-md border border-black/10 bg-white text-black/70 shadow-sm transition hover:text-black"
                title={t.settings}
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
                    {t[item.id]}
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
                onRequestConfirm={setConfirmRequest}
                onViewChange={setView}
                t={t}
                money={money}
                moneyExact={moneyExact}
                dateLocale={dateLocale}
                language={language}
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
                t={t}
                moneyExact={moneyExact}
                dateLocale={dateLocale}
                language={language}
              />
            )}
            {view === "budgets" && (
              <Budgets
                data={data}
                busy={busy}
                onMutate={mutate}
                t={t}
                money={money}
                language={language}
              />
            )}
            {view === "goals" && (
              <Goals
                data={data}
                busy={busy}
                onMutate={mutate}
                onRequestConfirm={setConfirmRequest}
                t={t}
                money={money}
                dateLocale={dateLocale}
              />
            )}
            {view === "accounts" && (
              <Accounts
                data={data}
                busy={busy}
                onMutate={mutate}
                onRequestConfirm={setConfirmRequest}
                t={t}
                moneyExact={moneyExact}
                language={language}
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
          t={t}
          theme={theme}
          language={language}
          setTheme={setTheme}
          setLanguage={setLanguage}
          logoutAction={logoutAction}
          currentUserEmail={currentUser.email}
          isSuperuser={isSuperuser}
        />
      )}

      {confirmRequest && (
        <ConfirmModal
          request={confirmRequest}
          busy={busy}
          cancelLabel={t.cancel}
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
  cancelLabel,
  onCancel,
  onConfirm,
}: {
  request: ConfirmRequest;
  busy: boolean;
  cancelLabel: string;
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
            {cancelLabel}
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
  t,
  theme,
  language,
  setTheme,
  setLanguage,
  logoutAction,
  currentUserEmail,
  isSuperuser,
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
  t: UiText;
  theme: ThemeMode;
  language: Language;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  logoutAction: (formData: FormData) => Promise<void>;
  currentUserEmail: string;
  isSuperuser: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImportFile(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      onImportJson(JSON.parse(await file.text()));
    } catch {
      window.alert(
        t === ui.it
          ? "Quel file non contiene JSON valido."
          : "That file is not valid JSON.",
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <section className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-md border border-black/10 bg-[#f8f7f2] shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 p-5">
          <div>
            <h2 className="text-lg font-semibold">{t.settings}</h2>
            <p className="text-sm text-black/50">{t.localWorkspace}</p>
          </div>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-md border border-black/10 bg-white text-black/60"
            title={t.close}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="border-b border-black/10 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">{t.appearance}</h3>
              <p className="mt-1 text-xs text-black/50">{t.language}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <SegmentedControl
                icon={
                  theme === "dark" ? (
                    <Moon className="size-4" />
                  ) : (
                    <Sun className="size-4" />
                  )
                }
                value={theme}
                options={[
                  { value: "light", label: t.light },
                  { value: "dark", label: t.dark },
                ]}
                onChange={(value) => setTheme(value as ThemeMode)}
              />
              <SegmentedControl
                icon={<Languages className="size-4" />}
                value={language}
                options={[
                  { value: "en", label: "EN" },
                  { value: "it", label: "IT" },
                ]}
                onChange={(value) => setLanguage(value as Language)}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {isSuperuser && (
            <>
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
                label={t.exportJson}
                detail={t.exportJsonDetail}
                onClick={onExportJson}
              />
              <ActionButton
                icon={<Upload className="size-4" />}
                label={t.importJson}
                detail={t.importJsonDetail}
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
              />
              <ActionButton
                icon={<FileSpreadsheet className="size-4" />}
                label={t.exportCsv}
                detail={t.exportCsvDetail}
                onClick={onExportCsv}
              />
              <ActionButton
                icon={<RefreshCw className="size-4" />}
                label={t.refresh}
                detail={t.refreshDetail}
                onClick={onRefresh}
                disabled={busy}
              />
            </>
          )}
          <form action={logoutAction} className="contents">
            <ActionSubmitButton
              icon={<LogOut className="size-4" />}
              label={t.logOut}
              detail={`${currentUserEmail} - ${t.logOutDetail}`}
            />
          </form>
          {isSuperuser && (
            <>
              <ActionButton
                icon={<Database className="size-4" />}
                label={t.removeDemo}
                detail={t.removeDemoDetail}
                onClick={() =>
                  onRequestConfirm({
                    title: t.removeDemoTitle,
                    message: t.removeDemoMessage,
                    confirmLabel: t.removeDemoConfirm,
                    onConfirm: onRemoveDemo,
                  })
                }
                disabled={busy}
              />
              <ActionButton
                icon={<Trash2 className="size-4" />}
                label={t.clearData}
                detail={t.clearDataDetail}
                onClick={() =>
                  onRequestConfirm({
                    title: t.clearDataTitle,
                    message: t.clearDataMessage,
                    confirmLabel: t.clearDataConfirm,
                    onConfirm: onReset,
                  })
                }
                disabled={busy}
                danger
              />
            </>
          )}
        </div>

        <div className="border-t border-black/10 p-5">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-black/45">{t.accounts}</p>
              <p className="mt-1 font-semibold">{data.accounts.length}</p>
            </div>
            <div>
              <p className="text-black/45">{t.transactions}</p>
              <p className="mt-1 font-semibold">{data.transactions.length}</p>
            </div>
            <div>
              <p className="text-black/45">{t.budgets}</p>
              <p className="mt-1 font-semibold">{data.budgets.length}</p>
            </div>
          </div>
          <p className="mt-4 rounded-md border border-black/10 bg-white p-3 text-xs text-black/55">
            {t.databaseFile}
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
      type="button"
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

function ActionSubmitButton({
  icon,
  label,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <button
      className="flex min-h-[76px] items-center gap-3 rounded-md border border-black/10 bg-white p-4 text-left shadow-sm transition hover:border-[#171b18]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#171b18] text-white">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block truncate text-xs text-black/45">{detail}</span>
      </span>
    </button>
  );
}

function SegmentedControl({
  icon,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex h-10 items-center gap-1 rounded-md border border-black/10 bg-white p-1 shadow-sm">
      <span className="grid size-8 shrink-0 place-items-center text-black/45">
        {icon}
      </span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cx(
            "h-8 rounded px-3 text-sm font-semibold transition",
            value === option.value
              ? "bg-[#171b18] text-white"
              : "text-black/55 hover:text-black",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Overview({
  data,
  busy,
  onMutate,
  onRequestConfirm,
  onViewChange,
  t,
  money,
  moneyExact,
  dateLocale,
  language,
}: {
  data: AppSummary;
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  onRequestConfirm: (request: ConfirmRequest) => void;
  onViewChange: (view: View) => void;
  t: UiText;
  money: Intl.NumberFormat;
  moneyExact: Intl.NumberFormat;
  dateLocale: string;
  language: Language;
}) {
  const [editingRecurringId, setEditingRecurringId] = useState<number | null>(null);
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
              <p className="text-sm text-white/55">{t.netWorth}</p>
              <p className="mt-2 text-4xl font-semibold sm:text-5xl">
                {money.format(data.totals.netWorth)}
              </p>
            </div>
            <div className="rounded-md bg-white/10 px-3 py-2 text-sm text-white/75">
              {data.accounts.length} {t.accounts.toLowerCase()}
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Metric
              label={t.income}
              value={money.format(data.totals.monthlyIncome)}
              icon={<ArrowDownLeft className="size-4" />}
              tone="green"
            />
            <Metric
              label={t.spending}
              value={money.format(data.totals.monthlyExpenses)}
              icon={<ArrowUpRight className="size-4" />}
              tone="coral"
            />
            <Metric
              label={t.saved}
              value={money.format(data.totals.monthlySavings)}
              icon={<CircleEuroSign className="size-4" />}
              tone="gold"
            />
          </div>
        </div>

        <QuickTransactionForm
          data={data}
          busy={busy}
          onMutate={onMutate}
          t={t}
          language={language}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t.cashFlow}</h2>
            <BarChart3 className="size-4 text-black/45" />
          </div>
          <div className="mt-6 flex h-64 items-end gap-3">
            {data.cashFlow.map((point) => (
              <div key={point.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-48 w-full items-end justify-center gap-1">
                  <div
                    className="w-[38%] rounded-t-sm bg-[#38b487]"
                    title={`${t.income} ${money.format(point.income)}`}
                    style={{ height: `${Math.max(8, (point.income / maxFlow) * 100)}%` }}
                  />
                  <div
                    className="w-[38%] rounded-t-sm bg-[#e46f54]"
                    title={`${t.spending} ${money.format(point.expenses)}`}
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
            <h2 className="text-base font-semibold">{t.transactions}</h2>
            <button
              onClick={() => onViewChange("transactions")}
              className="flex h-8 items-center gap-1 rounded-md border border-black/10 px-2 text-sm text-black/60"
            >
              {t.view} <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mt-4 divide-y divide-black/8">
            {data.transactions.slice(0, 7).map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                compact
                moneyExact={moneyExact}
                dateLocale={dateLocale}
                language={language}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-md border border-black/10 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t.budgets}</h2>
            <button
              onClick={() => onViewChange("budgets")}
              className="grid size-8 place-items-center rounded-md border border-black/10"
              title={t.openBudgets}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.budgets.slice(0, 4).map((budget) => (
              <BudgetLine
                key={budget.id}
                budget={budget}
                t={t}
                money={money}
                language={language}
              />
            ))}
          </div>
        </div>

        <div className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t.recurring}</h2>
            <CalendarClock className="size-4 text-black/45" />
          </div>
          <div className="mt-4 space-y-3">
            {data.recurring.slice(0, 5).map((transaction) => (
              <RecurringRuleRow
                key={transaction.id}
                rule={transaction}
                data={data}
                busy={busy}
                editing={editingRecurringId === transaction.id}
                onEdit={() => setEditingRecurringId(transaction.id)}
                onCancelEdit={() => setEditingRecurringId(null)}
                onMutate={onMutate}
                onRequestConfirm={onRequestConfirm}
                t={t}
                moneyExact={moneyExact}
                dateLocale={dateLocale}
                language={language}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function RecurringRuleRow({
  rule,
  data,
  busy,
  editing,
  onEdit,
  onCancelEdit,
  onMutate,
  onRequestConfirm,
  t,
  moneyExact,
  dateLocale,
  language,
}: {
  rule: RecurringRule;
  data: AppSummary;
  busy: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  onRequestConfirm: (request: ConfirmRequest) => void;
  t: UiText;
  moneyExact: Intl.NumberFormat;
  dateLocale: string;
  language: Language;
}) {
  const destinationAccount = data.accounts.find(
    (account) => account.id === rule.transfer_to_account_id,
  );
  const isTransferRule = Boolean(rule.transfer_to_account_id);
  const isPacRule = isTransferRule && destinationAccount?.type === "PAC";
  const transactionCategories = data.categories.filter(
    (category) => category.name !== "Transfers",
  );
  const pacAccounts = data.accounts.filter((account) => account.type === "PAC");
  const sourceAccounts = isPacRule
    ? data.accounts.filter((account) => account.type !== "PAC")
    : data.accounts;
  const destinationAccounts = isPacRule ? pacAccounts : data.accounts;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const kind = String(formData.get("kind"));
    const amount = Number(formData.get("amount") ?? 0);

    await onMutate(() =>
      sendJson(`/api/recurring/${rule.id}`, "PATCH", {
        merchant: formData.get("merchant"),
        account_id: Number(formData.get("account_id")),
        transfer_to_account_id: isTransferRule
          ? Number(formData.get("transfer_to_account_id"))
          : null,
        category_id: isTransferRule ? rule.category_id : Number(formData.get("category_id")),
        amount: isTransferRule
          ? Math.abs(amount)
          : kind === "expense"
            ? -Math.abs(amount)
            : Math.abs(amount),
        status: formData.get("status"),
        next_occurrence_date: formData.get("next_occurrence_date"),
        end_month: formData.get("end_month") || null,
      }),
    );
    onCancelEdit();
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3 border-t border-black/8 pt-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {isTransferRule ? (
            <input type="hidden" name="merchant" value={rule.merchant} />
          ) : (
            <Field name="merchant" defaultValue={rule.merchant} placeholder={t.merchant} required />
          )}
          <Field
            name="amount"
            type="number"
            step="0.01"
            defaultValue={Math.abs(rule.amount)}
            placeholder={t.amount}
            required
          />
          {!isTransferRule && (
            <Select name="kind" defaultValue={rule.amount < 0 ? "expense" : "income"}>
              <option value="expense">{t.expense}</option>
              <option value="income">{t.income}</option>
            </Select>
          )}
          <Select name="status" defaultValue={rule.status}>
            <option value="cleared">{translateSystemValue("cleared", language)}</option>
            <option value="pending">{translateSystemValue("pending", language)}</option>
          </Select>
          <Select name="account_id" defaultValue={rule.account_id}>
            {sourceAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
          {isTransferRule ? (
            <Select
              name="transfer_to_account_id"
              defaultValue={rule.transfer_to_account_id ?? undefined}
            >
              {destinationAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          ) : (
            <Select name="category_id" defaultValue={rule.category_id}>
              {transactionCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {translateSystemValue(category.name, language)}
                </option>
              ))}
            </Select>
          )}
          <Field
            name="next_occurrence_date"
            type="date"
            defaultValue={rule.next_occurrence_date}
            required
          />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-black/45">
              {t.finalMonth}
            </span>
            <Field
              name="end_month"
              type="month"
              defaultValue={rule.end_month ?? ""}
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            disabled={busy}
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-[#171b18] px-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Check className="size-4" />
            {t.save}
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            className="grid size-9 place-items-center rounded-md border border-black/10 text-black/55"
            title={t.cancel}
          >
            <X className="size-4" />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-black/8 pt-3 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{rule.merchant}</p>
        <p className="text-xs text-black/45">
          {isTransferRule
            ? `${rule.account_name} -> ${rule.transfer_to_account_name ?? t.toAccount}`
            : translateSystemValue(rule.category_name, language)}
          {" - "}
          {t.nextPayment}{" "}
          {new Date(`${rule.next_occurrence_date}T00:00:00`).toLocaleDateString(
            dateLocale,
            {
              month: "short",
              day: "numeric",
            },
          )}
          {rule.end_month
            ? ` - ${t.untilMonth} ${new Date(
                `${rule.end_month}-01T00:00:00`,
              ).toLocaleDateString(dateLocale, {
                month: "short",
                year: "numeric",
              })}`
            : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <p className="text-sm font-semibold">{moneyExact.format(rule.amount)}</p>
        <button
          onClick={onEdit}
          className="grid size-8 place-items-center rounded-md border border-black/10 text-black/45 transition hover:text-black"
          title={t.editRecurring}
        >
          <Pencil className="size-4" />
        </button>
        <button
          onClick={() =>
            onRequestConfirm({
              title: t.deleteRecurringTitle,
              message: t.deleteRecurringMessage(rule.merchant),
              confirmLabel: t.deleteRecurringConfirm,
              onConfirm: () =>
                onMutate(() => sendJson(`/api/recurring/${rule.id}`, "DELETE")),
            })
          }
          className="grid size-8 place-items-center rounded-md border border-black/10 text-black/45 transition hover:text-[#d94864]"
          title={t.deleteRecurringConfirm}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
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
  t,
  language,
}: {
  data: AppSummary;
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  t: UiText;
  language: Language;
}) {
  const [mode, setMode] = useState<"standard" | "pac" | "transfer">("standard");
  const transactionCategories = data.categories.filter(
    (category) => category.name !== "Transfers",
  );

  if (data.accounts.length === 0) {
    return (
      <div className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t.addTransaction}</h2>
          <Plus className="size-4 text-black/45" />
        </div>
        <p className="mt-4 text-sm text-black/55">
          {t.noAccountForTransaction}
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
        end_month: formData.get("end_month") || null,
      }),
    );

    form.reset();
  }

  return (
    <div className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t.addTransaction}</h2>
        <Plus className="size-4 text-black/45" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1 rounded-md bg-black/6 p-1">
        <button
          type="button"
          onClick={() => setMode("standard")}
          className={cx(
            "h-9 rounded-sm text-sm font-semibold transition",
            mode === "standard"
              ? "bg-white text-black shadow-sm"
              : "text-black/55 hover:text-black",
          )}
        >
          {t.normalTransaction}
        </button>
        <button
          type="button"
          onClick={() => setMode("pac")}
          className={cx(
            "h-9 rounded-sm text-sm font-semibold transition",
            mode === "pac"
              ? "bg-white text-black shadow-sm"
              : "text-black/55 hover:text-black",
          )}
        >
          PAC
        </button>
        <button
          type="button"
          onClick={() => setMode("transfer")}
          className={cx(
            "h-9 rounded-sm text-sm font-semibold transition",
            mode === "transfer"
              ? "bg-white text-black shadow-sm"
              : "text-black/55 hover:text-black",
          )}
        >
          {t.transfer}
        </button>
      </div>

      {mode === "pac" ? (
        <PacContributionForm
          accounts={data.accounts}
          busy={busy}
          onMutate={onMutate}
          t={t}
          embedded
        />
      ) : mode === "transfer" ? (
        <AccountTransferForm
          accounts={data.accounts}
          busy={busy}
          onMutate={onMutate}
          t={t}
          language={language}
          embedded
        />
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field name="merchant" placeholder={t.merchant} required />
        <Field name="amount" type="number" step="0.01" placeholder={t.amount} required />
        <Select name="kind" defaultValue="expense">
          <option value="expense">{t.expense}</option>
          <option value="income">{t.income}</option>
        </Select>
        <Select name="status" defaultValue="cleared">
          <option value="cleared">{translateSystemValue("cleared", language)}</option>
          <option value="pending">{translateSystemValue("pending", language)}</option>
        </Select>
        <Select name="account_id" defaultValue={data.accounts[0]?.id}>
          {data.accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
        <Select name="category_id" defaultValue={transactionCategories[0]?.id}>
          {transactionCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {translateSystemValue(category.name, language)}
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
          {t.repeatMonthly}
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-black/45">
            {t.finalMonth}
          </span>
          <Field name="end_month" type="month" />
        </label>
          </div>
          <button
            disabled={busy}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#171b18] px-4 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
          >
            <Check className="size-4" />
            {t.save}
          </button>
        </form>
      )}
    </div>
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
  t,
  moneyExact,
  dateLocale,
  language,
}: {
  data: AppSummary;
  transactions: Transaction[];
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  onRequestConfirm: (request: ConfirmRequest) => void;
  query: string;
  setQuery: (value: string) => void;
  t: UiText;
  moneyExact: Intl.NumberFormat;
  dateLocale: string;
  language: Language;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <QuickTransactionForm
        data={data}
        busy={busy}
        onMutate={onMutate}
        t={t}
        language={language}
      />
      <section className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{t.transactions}</h2>
          <div className="flex h-10 w-full items-center gap-2 rounded-md border border-black/10 bg-[#f7f7f3] px-3 sm:w-[300px]">
            <Search className="size-4 text-black/35" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.search}
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
                  title: t.deleteTransactionTitle,
                  message: t.deleteTransactionMessage(transaction.merchant, moneyExact.format(
                    transaction.amount,
                  )),
                  confirmLabel: t.deleteTransactionConfirm,
                  onConfirm: () =>
                    onMutate(() =>
                      sendJson(`/api/transactions/${transaction.id}`, "DELETE"),
                    ),
                })
              }
              moneyExact={moneyExact}
              dateLocale={dateLocale}
              language={language}
              deleteLabel={t.deleteTransactionConfirm}
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
  moneyExact,
  dateLocale,
  language,
  deleteLabel,
}: {
  transaction: Transaction;
  compact?: boolean;
  onDelete?: () => void;
  moneyExact: Intl.NumberFormat;
  dateLocale: string;
  language: Language;
  deleteLabel?: string;
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
          {translateSystemValue(transaction.category_name, language)} -{" "}
          {transaction.account_name}
        </p>
      </div>
      {!compact && (
        <p className="hidden w-24 shrink-0 text-sm text-black/45 sm:block">
          {new Date(`${transaction.date}T00:00:00`).toLocaleDateString(dateLocale, {
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
          title={deleteLabel ?? "Delete"}
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
  t,
  money,
  language,
}: {
  data: AppSummary;
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  t: UiText;
  money: Intl.NumberFormat;
  language: Language;
}) {
  const budgetedCategoryIds = new Set(
    data.budgets.map((budget) => budget.category_id),
  );
  const availableCategories = data.categories.filter(
    (category) =>
      category.name !== "Transfers" && !budgetedCategoryIds.has(category.id),
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <BudgetCreateForm
        categories={availableCategories}
        busy={busy}
        onMutate={onMutate}
        t={t}
        language={language}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {data.budgets.length === 0 && (
          <div className="rounded-md border border-black/10 bg-white p-5 text-sm text-black/55 shadow-sm">
            {t.noBudgets}
          </div>
        )}
        {data.budgets.map((budget) => (
          <BudgetEditor
            key={budget.id}
            budget={budget}
            busy={busy}
            onMutate={onMutate}
            t={t}
            money={money}
            language={language}
          />
        ))}
      </section>
    </div>
  );
}

function BudgetCreateForm({
  categories,
  busy,
  onMutate,
  t,
  language,
}: {
  categories: AppSummary["categories"];
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  t: UiText;
  language: Language;
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
        <h2 className="text-base font-semibold">{t.addBudget}</h2>
        <Target className="size-4 text-black/45" />
      </div>

      {categories.length === 0 ? (
        <p className="mt-4 text-sm text-black/55">
          {t.allCategoriesBudgeted}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <Select name="category_id" defaultValue={categories[0]?.id}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {translateSystemValue(category.name, language)}
              </option>
            ))}
          </Select>
          <Field
            name="amount"
            type="number"
            min="1"
            step="0.01"
            placeholder={t.monthlyAmount}
            required
          />
          <button
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#171b18] text-sm font-semibold text-white disabled:opacity-60"
          >
            <Plus className="size-4" />
            {t.add}
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
  t,
  money,
  language,
}: {
  budget: Budget;
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  t: UiText;
  money: Intl.NumberFormat;
  language: Language;
}) {
  const [amount, setAmount] = useState(String(Math.round(budget.amount)));

  return (
    <div className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
      <BudgetLine
        budget={{ ...budget, amount: Number(amount) || 0 }}
        t={t}
        money={money}
        language={language}
      />
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
          title={t.save}
        >
          <Check className="size-4" />
        </button>
      </div>
    </div>
  );
}

function BudgetLine({
  budget,
  t,
  money,
  language,
}: {
  budget: Budget;
  t: UiText;
  money: Intl.NumberFormat;
  language: Language;
}) {
  const percent = Math.min(100, (budget.spent / Math.max(budget.amount, 1)) * 100);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {translateSystemValue(budget.category_name, language)}
          </p>
          <p className="text-xs text-black/45">
            {translateSystemValue(budget.group_name, language)}
          </p>
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
        <span>{money.format(budget.spent)} {t.spent}</span>
        <span>{money.format(budget.remaining)} {t.remaining}</span>
      </div>
    </div>
  );
}

function Goals({
  data,
  busy,
  onMutate,
  onRequestConfirm,
  t,
  money,
  dateLocale,
}: {
  data: AppSummary;
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  onRequestConfirm: (request: ConfirmRequest) => void;
  t: UiText;
  money: Intl.NumberFormat;
  dateLocale: string;
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
          <h2 className="text-base font-semibold">{t.addGoal}</h2>
          <Target className="size-4 text-black/45" />
        </div>
        <div className="mt-4 space-y-3">
          <Field name="name" placeholder={t.addGoal} required />
          <Field name="target_amount" type="number" placeholder={t.target} required />
          <Field name="current_amount" type="number" placeholder={t.savedGoal} required />
          <Field name="due_date" type="date" required />
          <Field name="color" type="color" defaultValue="#e0a928" />
        </div>
        <button
          disabled={busy}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#171b18] text-sm font-semibold text-white disabled:opacity-60"
        >
          <Plus className="size-4" />
          {t.add}
        </button>
      </form>

      <section className="grid gap-4 lg:grid-cols-2">
        {data.goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onDelete={() =>
              onRequestConfirm({
                title: t.deleteGoalTitle,
                message: t.deleteGoalMessage(goal.name),
                confirmLabel: t.deleteGoalConfirm,
                onConfirm: () =>
                  onMutate(() => sendJson(`/api/goals/${goal.id}`, "DELETE")),
              })
            }
            money={money}
            dateLocale={dateLocale}
            deleteLabel={t.deleteGoalConfirm}
          />
        ))}
      </section>
    </div>
  );
}

function GoalCard({
  goal,
  onDelete,
  money,
  dateLocale,
  deleteLabel,
}: {
  goal: Goal;
  onDelete: () => void;
  money: Intl.NumberFormat;
  dateLocale: string;
  deleteLabel: string;
}) {
  const percent = Math.min(100, (goal.current_amount / Math.max(goal.target_amount, 1)) * 100);

  return (
    <div className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{goal.name}</p>
          <p className="mt-1 text-xs text-black/45">
            {new Date(`${goal.due_date}T00:00:00`).toLocaleDateString(dateLocale, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="grid size-8 place-items-center rounded-md border border-black/10 text-black/45 transition hover:text-[#d94864]"
          title={deleteLabel}
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

function PacContributionForm({
  accounts,
  busy,
  onMutate,
  t,
  embedded = false,
}: {
  accounts: AppSummary["accounts"];
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  t: UiText;
  embedded?: boolean;
}) {
  const pacAccounts = accounts.filter((account) => account.type === "PAC");
  const sourceAccounts = accounts.filter((account) => account.type !== "PAC");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pacAccounts.length === 0 || sourceAccounts.length === 0) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    await onMutate(() =>
      sendJson("/api/accounts/pac-contributions", "POST", {
        source_account_id: Number(formData.get("source_account_id")),
        pac_account_id: Number(formData.get("pac_account_id")),
        amount: Number(formData.get("amount")),
        date: formData.get("date"),
        is_recurring: formData.get("is_recurring") === "on",
        end_month: formData.get("end_month") || null,
      }),
    );
    form.reset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cx(
        embedded ? "pt-4" : "rounded-md border border-black/10 bg-white p-5 shadow-sm",
      )}
    >
      {!embedded && (
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t.addPacContribution}</h2>
          <LineChart className="size-4 text-black/45" />
        </div>
      )}

      {pacAccounts.length === 0 ? (
        <p className="mt-4 text-sm text-black/55">{t.noPacAccount}</p>
      ) : sourceAccounts.length === 0 ? (
        <p className="mt-4 text-sm text-black/55">{t.noAccountForTransaction}</p>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-black/45">
              {t.fromAccount}
            </span>
            <Select name="source_account_id" defaultValue={sourceAccounts[0]?.id}>
              {sourceAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-black/45">
              {t.toPac}
            </span>
            <Select name="pac_account_id" defaultValue={pacAccounts[0]?.id}>
              {pacAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </label>
          <Field name="amount" type="number" min="0.01" step="0.01" placeholder={t.amount} required />
          <Field
            name="date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
          <label className="flex h-11 items-center gap-2 rounded-md border border-black/10 bg-[#f7f7f3] px-3 text-sm text-black/70">
            <input name="is_recurring" type="checkbox" className="size-4 accent-[#171b18]" />
            {t.repeatMonthly}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-black/45">
              {t.finalMonth}
            </span>
            <Field name="end_month" type="month" />
          </label>
          <button
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#171b18] text-sm font-semibold text-white disabled:opacity-60"
          >
            <Plus className="size-4" />
            {t.add}
          </button>
        </div>
      )}
    </form>
  );
}

function AccountTransferForm({
  accounts,
  busy,
  onMutate,
  t,
  language,
  embedded = false,
}: {
  accounts: AppSummary["accounts"];
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  t: UiText;
  language: Language;
  embedded?: boolean;
}) {
  const [selectedSourceAccountId, setSelectedSourceAccountId] = useState(
    accounts[0]?.id ?? 0,
  );
  const sourceAccountId = accounts.some(
    (account) => account.id === selectedSourceAccountId,
  )
    ? selectedSourceAccountId
    : accounts[0]?.id ?? 0;
  const destinationOptions = useMemo(
    () => accounts.filter((account) => account.id !== sourceAccountId),
    [accounts, sourceAccountId],
  );
  const defaultDestinationAccountId = destinationOptions[0]?.id ?? 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (accounts.length < 2) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    await onMutate(() =>
      sendJson("/api/accounts/transfers", "POST", {
        source_account_id: Number(formData.get("source_account_id")),
        destination_account_id: Number(formData.get("destination_account_id")),
        amount: Number(formData.get("amount")),
        date: formData.get("date"),
        status: formData.get("status"),
        is_recurring: formData.get("is_recurring") === "on",
        end_month: formData.get("end_month") || null,
      }),
    );
    form.reset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cx(
        embedded ? "pt-4" : "rounded-md border border-black/10 bg-white p-5 shadow-sm",
      )}
    >
      {!embedded && (
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t.addTransfer}</h2>
          <ArrowRightLeft className="size-4 text-black/45" />
        </div>
      )}

      {accounts.length < 2 ? (
        <p className="mt-4 text-sm text-black/55">{t.noTransferAccounts}</p>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-black/45">
              {t.fromAccount}
            </span>
            <Select
              name="source_account_id"
              value={sourceAccountId}
              onChange={(event) =>
                setSelectedSourceAccountId(Number(event.target.value))
              }
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-black/45">
              {t.toAccount}
            </span>
            <Select
              key={sourceAccountId}
              name="destination_account_id"
              defaultValue={defaultDestinationAccountId}
            >
              {destinationOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </label>
          <Field name="amount" type="number" min="0.01" step="0.01" placeholder={t.amount} required />
          <Select name="status" defaultValue="cleared">
            <option value="cleared">{translateSystemValue("cleared", language)}</option>
            <option value="pending">{translateSystemValue("pending", language)}</option>
          </Select>
          <Field
            name="date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
          <label className="flex h-11 items-center gap-2 rounded-md border border-black/10 bg-[#f7f7f3] px-3 text-sm text-black/70">
            <input name="is_recurring" type="checkbox" className="size-4 accent-[#171b18]" />
            {t.repeatMonthly}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-black/45">
              {t.finalMonth}
            </span>
            <Field name="end_month" type="month" />
          </label>
          <button
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#171b18] text-sm font-semibold text-white disabled:opacity-60"
          >
            <Plus className="size-4" />
            {t.add}
          </button>
        </div>
      )}
    </form>
  );
}

function Accounts({
  data,
  busy,
  onMutate,
  onRequestConfirm,
  t,
  moneyExact,
  language,
}: {
  data: AppSummary;
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  onRequestConfirm: (request: ConfirmRequest) => void;
  t: UiText;
  moneyExact: Intl.NumberFormat;
  language: Language;
}) {
  type AccountGroup = "all" | "liquid" | "investing" | "debt";
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [accountNameDraft, setAccountNameDraft] = useState("");
  const [accountBalanceDraft, setAccountBalanceDraft] = useState("");
  const [accountGroup, setAccountGroup] = useState<AccountGroup>("all");
  const accountGroups = [
    {
      id: "all",
      label: t.accountGroupAll,
      types: null,
    },
    {
      id: "liquid",
      label: t.accountGroupLiquid,
      types: new Set(["Checking", "Savings"]),
    },
    {
      id: "investing",
      label: t.accountGroupInvesting,
      types: new Set(["Investment", "PAC"]),
    },
    {
      id: "debt",
      label: t.accountGroupDebt,
      types: new Set(["Credit Card", "Loan"]),
    },
  ] satisfies Array<{
    id: AccountGroup;
    label: string;
    types: Set<string> | null;
  }>;
  const selectedAccountGroup = accountGroups.find((group) => group.id === accountGroup);
  const visibleAccounts = selectedAccountGroup?.types
    ? data.accounts.filter((account) => selectedAccountGroup.types?.has(account.type))
    : data.accounts;

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

  async function saveAccount(id: number) {
    const name = accountNameDraft.trim();
    const balance = Number(accountBalanceDraft);

    if (!name || !Number.isFinite(balance)) {
      return;
    }

    await onMutate(() => sendJson(`/api/accounts/${id}`, "PATCH", { name, balance }));
    setEditingAccountId(null);
    setAccountNameDraft("");
    setAccountBalanceDraft("");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <div className="space-y-5">
        <form
          onSubmit={handleSubmit}
          className="rounded-md border border-black/10 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t.addAccount}</h2>
            <Banknote className="size-4 text-black/45" />
          </div>
          <div className="mt-4 space-y-3">
            <Field name="name" placeholder={t.addAccount} required />
            <Field name="institution" placeholder={t.institution} required />
            <Select name="type" defaultValue="Checking">
              {["Checking", "Savings", "Credit Card", "Investment", "Loan", "PAC"].map(
                (type) => (
                  <option key={type} value={type}>
                    {translateSystemValue(type, language)}
                  </option>
                ),
              )}
            </Select>
            <Field name="balance" type="number" step="0.01" placeholder={t.amount} required />
            <Field name="color" type="color" defaultValue="#219a68" />
          </div>
          <button
            disabled={busy}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#171b18] text-sm font-semibold text-white disabled:opacity-60"
          >
            <Plus className="size-4" />
            {t.add}
          </button>
        </form>
      </div>

      <section>
        <div className="mb-4 rounded-md border border-black/10 bg-white p-3 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-4">
            {accountGroups.map((group) => {
              const accounts = group.types
                ? data.accounts.filter((account) => group.types?.has(account.type))
                : data.accounts;
              const total = accounts.reduce((sum, account) => sum + account.balance, 0);

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setAccountGroup(group.id)}
                  className={cx(
                    "rounded-md border px-3 py-2 text-left transition",
                    accountGroup === group.id
                      ? "border-[#171b18] bg-[#171b18] text-white"
                      : "border-black/10 bg-[#f7f7f3] text-black/70 hover:border-black/20 hover:bg-white",
                  )}
                >
                  <span className="block text-xs font-semibold uppercase opacity-65">
                    {group.label}
                  </span>
                  <span className="mt-1 block text-sm font-semibold">
                    {moneyExact.format(total)}
                  </span>
                  <span className="mt-0.5 block text-xs opacity-55">
                    {accounts.length} {t.accounts.toLowerCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
        {visibleAccounts.map((account) => (
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
                  {account.type === "PAC" ? (
                    <LineChart className="size-5" />
                  ) : account.type === "Credit Card" ? (
                    <CreditCard className="size-5" />
                  ) : account.type === "Loan" ? (
                    <Home className="size-5" />
                  ) : (
                    <WalletCards className="size-5" />
                  )}
                </div>
                <div className="min-w-0">
                  {editingAccountId === account.id ? (
                    <div className="flex min-w-0 items-center gap-2">
                      <input
                        value={accountNameDraft}
                        onChange={(event) => setAccountNameDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void saveAccount(account.id);
                          }

                          if (event.key === "Escape") {
                            setEditingAccountId(null);
                            setAccountNameDraft("");
                            setAccountBalanceDraft("");
                          }
                        }}
                        className="h-9 min-w-0 flex-1 rounded-md border border-black/10 bg-[#f7f7f3] px-3 text-sm font-semibold outline-none focus:border-[#171b18]"
                        autoFocus
                      />
                      <button
                        type="button"
                        disabled={
                          busy ||
                          accountNameDraft.trim().length === 0 ||
                          !Number.isFinite(Number(accountBalanceDraft))
                        }
                        onClick={() => {
                          void saveAccount(account.id);
                        }}
                        className="grid size-9 shrink-0 place-items-center rounded-md bg-[#171b18] text-white disabled:opacity-55"
                        title={t.save}
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditingAccountId(null);
                          setAccountNameDraft("");
                          setAccountBalanceDraft("");
                        }}
                        className="grid size-9 shrink-0 place-items-center rounded-md border border-black/10 text-black/45 transition hover:text-black disabled:opacity-55"
                        title={t.cancel}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="truncate font-semibold">{account.name}</p>
                  )}
                  <p className="truncate text-xs text-black/45">
                    {account.institution} - {translateSystemValue(account.type, language)}
                  </p>
                </div>
              </div>
              {editingAccountId !== account.id && (
                <button
                  onClick={() => {
                    setEditingAccountId(account.id);
                    setAccountNameDraft(account.name);
                    setAccountBalanceDraft(String(account.balance));
                  }}
                  className="grid size-8 shrink-0 place-items-center rounded-md border border-black/10 text-black/45 transition hover:text-black"
                  title={t.editAccount}
                >
                  <Pencil className="size-4" />
                </button>
              )}
              <button
                onClick={() =>
                  onRequestConfirm({
                    title: t.deleteAccountTitle,
                    message: t.deleteAccountMessage(account.name),
                    confirmLabel: t.deleteAccountConfirm,
                    onConfirm: () =>
                      onMutate(() =>
                        sendJson(`/api/accounts/${account.id}`, "DELETE"),
                      ),
                  })
                }
                className="grid size-8 shrink-0 place-items-center rounded-md border border-black/10 text-black/45 transition hover:text-[#d94864]"
                title={t.deleteAccountConfirm}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            {editingAccountId === account.id ? (
              <label className="mt-6 block">
                <span className="mb-1 block text-xs font-semibold text-black/45">
                  {t.balance}
                </span>
                <Field
                  type="number"
                  step="0.01"
                  value={accountBalanceDraft}
                  onChange={(event) => setAccountBalanceDraft(event.target.value)}
                />
              </label>
            ) : (
              <p className="mt-8 text-3xl font-semibold">
                {moneyExact.format(account.balance)}
              </p>
            )}
            {account.type === "Savings" && (
              <SavingsInterestSettings
                account={account}
                rule={data.savingsInterestRules.find(
                  (rule) => rule.account_id === account.id,
                )}
                busy={busy}
                onMutate={onMutate}
                onRequestConfirm={onRequestConfirm}
                t={t}
              />
            )}
          </div>
        ))}
        </div>
      </section>
    </div>
  );
}

function SavingsInterestSettings({
  account,
  rule,
  busy,
  onMutate,
  onRequestConfirm,
  t,
}: {
  account: AppSummary["accounts"][number];
  rule: AppSummary["savingsInterestRules"][number] | undefined;
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  onRequestConfirm: (request: ConfirmRequest) => void;
  t: UiText;
}) {
  const [editing, setEditing] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await onMutate(() =>
      sendJson(`/api/accounts/${account.id}/interest`, "PATCH", {
        gross_annual_rate: Number(formData.get("gross_annual_rate")),
        tax_rate: Number(formData.get("tax_rate")),
        start_date: formData.get("start_date"),
        end_date: formData.get("end_date") || null,
      }),
    );
    setEditing(false);
  }

  return (
    <div className="mt-5 rounded-md border border-black/10 bg-[#f7f7f3] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{t.automaticInterest}</p>
          <p className="mt-1 text-xs leading-5 text-black/45">
            {rule ? t.interestActive : t.interestTaxNote}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setEditing((value) => !value)}
            className="grid size-8 place-items-center rounded-md border border-black/10 bg-white text-black/45 transition hover:text-black disabled:opacity-55"
            title={rule ? t.editAccount : t.configureInterest}
          >
            {editing ? <X className="size-4" /> : rule ? <Pencil className="size-4" /> : <Plus className="size-4" />}
          </button>
          {rule && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onRequestConfirm({
                  title: t.stopInterestTitle,
                  message: t.stopInterestMessage(account.name),
                  confirmLabel: t.stopInterest,
                  onConfirm: () =>
                    onMutate(() =>
                      sendJson(`/api/accounts/${account.id}/interest`, "DELETE"),
                    ),
                })
              }
              className="grid size-8 place-items-center rounded-md border border-black/10 bg-white text-black/45 transition hover:text-[#d94864] disabled:opacity-55"
              title={t.stopInterest}
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {!editing && rule && (
        <div className="mt-3 grid gap-2 text-xs text-black/58 sm:grid-cols-2">
          <p>
            <span className="font-semibold text-black/70">{t.grossAnnualRate}:</span>{" "}
            {rule.gross_annual_rate}%
          </p>
          <p>
            <span className="font-semibold text-black/70">{t.taxRate}:</span>{" "}
            {rule.tax_rate}%
          </p>
          <p>
            <span className="font-semibold text-black/70">{t.startDate}:</span>{" "}
            {rule.start_date}
          </p>
          <p>
            <span className="font-semibold text-black/70">{t.endDate}:</span>{" "}
            {rule.end_date ?? "-"}
          </p>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSubmit}>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-black/45">
                {t.grossAnnualRate}
              </span>
              <Field
                name="gross_annual_rate"
                type="number"
                step="0.01"
                min="0"
                defaultValue={rule?.gross_annual_rate ?? 2}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-black/45">
                {t.taxRate}
              </span>
              <Field
                name="tax_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={rule?.tax_rate ?? 26}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-black/45">
                {t.startDate}
              </span>
              <Field
                name="start_date"
                type="date"
                defaultValue={rule?.start_date ?? new Date().toISOString().slice(0, 10)}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-black/45">
                {t.endDate}
              </span>
              <Field name="end_date" type="date" defaultValue={rule?.end_date ?? ""} />
            </label>
          </div>
          <button
            disabled={busy}
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#171b18] px-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Check className="size-4" />
            {t.save}
          </button>
        </form>
      )}
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

function optionText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(optionText).join("");
  }

  return "";
}

function Select({
  className,
  children,
  defaultValue,
  disabled,
  name,
  onChange,
  value,
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const options = useMemo(
    () =>
      Children.toArray(children).flatMap((child) => {
        if (!isValidElement<React.OptionHTMLAttributes<HTMLOptionElement>>(child)) {
          return [];
        }

        const label = optionText(child.props.children);

        return [
          {
            disabled: Boolean(child.props.disabled),
            label,
            value: String(child.props.value ?? label),
          },
        ];
      }),
    [children],
  );
  const fallbackValue =
    defaultValue !== undefined
      ? String(defaultValue)
      : options.find((option) => !option.disabled)?.value ?? "";
  const [internalValue, setInternalValue] = useState(fallbackValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedValue = value !== undefined ? String(value) : internalValue;
  const effectiveValue = options.some((option) => option.value === selectedValue)
    ? selectedValue
    : fallbackValue;
  const selectedOption =
    options.find((option) => option.value === effectiveValue) ?? options[0];

  function commit(nextValue: string) {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    const event = {
      currentTarget: { name, value: nextValue },
      target: { name, value: nextValue },
    } as React.ChangeEvent<HTMLSelectElement>;

    onChange?.(event);
    setOpen(false);
  }

  function selectedIndex() {
    const index = options.findIndex(
      (option) => option.value === effectiveValue && !option.disabled,
    );

    return index >= 0 ? index : 0;
  }

  function openMenu() {
    setActiveIndex(selectedIndex());
    setOpen(true);
  }

  function moveActive(direction: 1 | -1) {
    if (options.length === 0) {
      return;
    }

    setActiveIndex((current) => {
      for (let step = 1; step <= options.length; step += 1) {
        const nextIndex =
          (current + direction * step + options.length) % options.length;

        if (!options[nextIndex]?.disabled) {
          return nextIndex;
        }
      }

      return current;
    });
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const form = inputRef.current?.form;

    if (!form || value !== undefined) {
      return;
    }

    function handleReset() {
      window.requestAnimationFrame(() => setInternalValue(fallbackValue));
    }

    form.addEventListener("reset", handleReset);

    return () => {
      form.removeEventListener("reset", handleReset);
    };
  }, [fallbackValue, value]);

  return (
    <span ref={rootRef} className="relative block w-full">
      {name && (
        <input
          ref={inputRef}
          type="hidden"
          name={name}
          value={effectiveValue}
          disabled={disabled}
        />
      )}
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }

          openMenu();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!open) {
              openMenu();
              return;
            }
            moveActive(1);
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) {
              openMenu();
              return;
            }
            moveActive(-1);
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!open) {
              openMenu();
              return;
            }

            const option = options[activeIndex];
            if (option && !option.disabled) {
              commit(option.value);
            }
          }
        }}
        className={cx(
          "relative flex h-11 w-full items-center rounded-md border border-black/10 bg-[#f7f7f3] px-3 pr-10 text-left text-sm font-medium text-black/76 outline-none transition hover:border-black/20 hover:bg-white focus:border-[#171b18] focus:bg-white focus:ring-2 focus:ring-[#171b18]/10 disabled:cursor-not-allowed disabled:opacity-55",
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate">
          {selectedOption?.label ?? ""}
        </span>
        <ChevronDown
          className={cx(
            "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-black/38 transition",
            open && "rotate-180 text-black/60",
          )}
        />
      </button>
      {open && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-64 overflow-auto rounded-md border border-black/10 bg-[#f8f7f2] p-1 shadow-[0_16px_40px_rgba(23,27,24,0.16)]"
        >
          {options.map((option, index) => {
            const selected = option.value === effectiveValue;
            const active = index === activeIndex;

            return (
              <button
                key={`${option.value}-${index}`}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(option.value)}
                className={cx(
                  "flex min-h-9 w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left text-sm font-medium transition duration-150 disabled:cursor-not-allowed disabled:opacity-40",
                  selected
                    ? active
                      ? "translate-x-0.5 bg-white text-[#151815] shadow-sm ring-1 ring-[var(--accent)]"
                      : "bg-white text-[#151815] shadow-sm ring-1 ring-black/10"
                    : active
                      ? "translate-x-0.5 bg-white text-[#151815] shadow-sm ring-1 ring-[var(--accent)]"
                      : "text-[#151815] hover:bg-white",
                )}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {selected && <Check className="size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}

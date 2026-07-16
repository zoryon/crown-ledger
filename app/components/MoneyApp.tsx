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
  MoreHorizontal,
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
const cardShell =
  "rounded-md border border-black/10 bg-white/[0.94] shadow-[0_1px_2px_rgba(23,27,24,0.035),0_8px_24px_rgba(23,27,24,0.05)]";
const compactCardShell =
  "rounded-md border border-black/10 bg-white/[0.9] shadow-[0_1px_2px_rgba(23,27,24,0.03),0_6px_18px_rgba(23,27,24,0.04)]";
const panelPadding = "p-3.5 xl:p-4";

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
    actions: "Actions",
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
    availableToSpend: "Available to spend",
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
    deleteAction: "Delete",
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
    editAction: "Edit",
    editAccount: "Edit account",
    dragAccount: "Drag account",
    editRecurring: "Edit recurring",
    editTransaction: "Edit transaction",
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
    highYieldInterest: "High Yield interest",
    highYieldInterestDetail: "Gross, tax, and net interest by month",
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
    notes: "Notes",
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
    noRecentTransactions: "No recent transactions.",
    openBudgets: "Open budgets",
    overview: "Overview",
    personalFinance: "Personal finance",
    projectedAsOf: "Projected as of",
    projectionDate: "Dashboard date",
    projectionLoading: "Projecting...",
    projectionToday: "Today",
    projectedImpact: "Projected impact",
    projectedAccountBalances: "Account balances at date",
    projectedBalance: "Projected balance",
    changeSinceToday: "Change vs today",
    noUpcomingCommitments: "No pending or recurring commitments in the next 30 days.",
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
    transactionType: "Type",
    category: "Category",
    statusLabel: "Status",
    date: "Date",
    upcomingCommitments: "Upcoming commitments",
    next30Days: "Next 30 days",
    toPac: "To PAC",
    toAccount: "To account",
    transfer: "Transfer",
    transactions: "Transactions",
    latestTransactions: "Latest transactions",
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
    actions: "Azioni",
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
    availableToSpend: "Spendibile",
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
    deleteAction: "Elimina",
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
    editAction: "Modifica",
    editAccount: "Modifica conto",
    dragAccount: "Trascina conto",
    editRecurring: "Modifica ricorrente",
    editTransaction: "Modifica transazione",
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
    highYieldInterest: "Interessi High Yield",
    highYieldInterestDetail: "Lordo, tasse e netto mese per mese",
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
    notes: "Note",
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
    noRecentTransactions: "Nessuna transazione recente.",
    openBudgets: "Apri budget",
    overview: "Panoramica",
    personalFinance: "Finanza personale",
    projectedAsOf: "Proiezione al",
    projectionDate: "Data dashboard",
    projectionLoading: "Calcolo...",
    projectionToday: "Oggi",
    projectedImpact: "Impatto previsto",
    projectedAccountBalances: "Saldi conti alla data",
    projectedBalance: "Saldo previsto",
    changeSinceToday: "Variazione da oggi",
    noUpcomingCommitments: "Nessun movimento in sospeso o ricorrente nei prossimi 30 giorni.",
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
    transactionType: "Tipo",
    category: "Categoria",
    statusLabel: "Stato",
    date: "Data",
    upcomingCommitments: "Prossimi impegni",
    next30Days: "Prossimi 30 giorni",
    toPac: "Verso PAC",
    toAccount: "A conto",
    transfer: "Trasferimento",
    transactions: "Transazioni",
    latestTransactions: "Ultime transazioni",
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

function inputDateString(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function isInternalTransfer(transaction: Transaction) {
  return transaction.notes?.startsWith("internal_transfer:") ?? false;
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
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
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
      <div className="min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col overflow-y-auto border-r border-black/10 bg-[#171b18] px-4 py-5 text-white 2xl:w-[276px] 2xl:px-5 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="grid size-9 place-items-center rounded-md bg-[#f4b63f] text-[#171b18]">
              <BadgeEuro className="size-5" />
            </div>
            <div>
              <p className="text-base font-semibold">Crown Ledger</p>
              <p className="text-xs text-white/55">{t.personalFinance}</p>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={cx(
                    "flex h-10 w-full items-center gap-2.5 rounded-md px-3 text-xs font-medium text-white/72 transition",
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

          <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.07] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{t.monthlyPulse}</p>
              <LineChart className="size-4 text-[#f4b63f]" />
            </div>
            <p className="mt-3 text-2xl font-semibold">
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

        <main className="min-w-0 lg:pl-[240px] 2xl:pl-[276px]">
          <header className="sticky top-0 z-20 border-b border-black/10 bg-[#f6f4ee]/88 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-5 2xl:px-8">
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

          <div className="px-4 py-4 sm:px-6 lg:px-5 lg:py-5 2xl:px-8">
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
  const today = inputDateString();
  const [projectionDate, setProjectionDate] = useState(today);
  const [projectedData, setProjectedData] = useState<AppSummary | null>(null);
  const [projectionBusy, setProjectionBusy] = useState(false);
  const isProjection = projectionDate > today;
  const displayData = isProjection ? (projectedData ?? data) : data;
  const availableToSpend = displayData.accounts
    .filter((account) => account.type === "Checking" || account.type === "Savings")
    .reduce((total, account) => total + Math.max(0, account.balance), 0);
  const maxFlow = Math.max(
    1,
    ...displayData.cashFlow.flatMap((point) => [point.income, point.expenses]),
  );

  useEffect(() => {
    if (!isProjection) {
      return;
    }

    const controller = new AbortController();

    async function fetchProjection() {
      setProjectionBusy(true);

      try {
        const response = await fetch(`/api/summary?as_of=${projectionDate}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        setProjectedData(await response.json());
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setProjectedData(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setProjectionBusy(false);
        }
      }
    }

    void fetchProjection();

    return () => controller.abort();
  }, [data, isProjection, projectionDate]);

  return (
    <div className="space-y-4">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="rounded-md border border-black/10 bg-[#171b18] p-4 text-white shadow-[0_14px_34px_rgba(23,27,24,0.16)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-white/50">{t.netWorth}</p>
              <p className="mt-1.5 text-3xl font-semibold xl:text-4xl">
                {moneyExact.format(displayData.totals.netWorth)}
              </p>
              {isProjection && (
                <p className="mt-1 text-xs text-white/55">
                  {projectionBusy ? t.projectionLoading : `${t.projectedAsOf} ${projectionDate}`}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <label className="flex h-8 items-center gap-2 rounded-md border border-white/10 bg-white/[0.08] px-2.5 text-xs text-white/75">
                <CalendarClock className="size-3.5" />
                <span className="hidden sm:inline">{t.projectionDate}</span>
                <input
                  type="date"
                  min={today}
                  value={projectionDate}
                  onChange={(event) => setProjectionDate(event.target.value || today)}
                  className="w-[124px] bg-transparent text-xs font-semibold text-white outline-none"
                />
              </label>
              {isProjection && (
                <button
                  type="button"
                  onClick={() => setProjectionDate(today)}
                  className="h-8 rounded-md border border-white/10 px-2.5 text-xs font-semibold text-white/75 transition hover:bg-white/[0.08] hover:text-white"
                >
                  {t.projectionToday}
                </button>
              )}
              <div className="rounded-md border border-white/10 bg-white/[0.08] px-2.5 py-1.5 text-xs text-white/75">
                {displayData.accounts.length} {t.accounts.toLowerCase()}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label={t.income}
              value={money.format(displayData.totals.monthlyIncome)}
              icon={<ArrowDownLeft className="size-4" />}
              tone="green"
            />
            <Metric
              label={t.spending}
              value={money.format(displayData.totals.monthlyExpenses)}
              icon={<ArrowUpRight className="size-4" />}
              tone="coral"
            />
            <Metric
              label={t.saved}
              value={money.format(displayData.totals.monthlySavings)}
              icon={<CircleEuroSign className="size-4" />}
              tone="gold"
            />
            <Metric
              label={t.availableToSpend}
              value={moneyExact.format(availableToSpend)}
              icon={<WalletCards className="size-4" />}
              tone="blue"
            />
          </div>

          <AccountMixChart data={displayData} t={t} money={money} />
        </div>

        <UpcomingCommitments
          data={displayData}
          t={t}
          moneyExact={moneyExact}
          dateLocale={dateLocale}
          language={language}
        />
      </section>

      <ProjectedAccountBalances
        data={displayData}
        currentData={data}
        projectionDate={projectionDate}
        isProjection={isProjection}
        t={t}
        moneyExact={moneyExact}
        dateLocale={dateLocale}
        language={language}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
        <div className={cx(cardShell, panelPadding)}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t.cashFlow}</h2>
            <BarChart3 className="size-4 text-black/45" />
          </div>
          <div className="mt-4 flex h-44 items-end gap-2 xl:h-52">
            {displayData.cashFlow.map((point, index) => (
              <div key={`${point.month}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-32 w-full items-end justify-center gap-1 xl:h-40">
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

        <SpendingBreakdown data={displayData} t={t} money={money} language={language} />
      </section>

      <HighYieldInterestChart data={displayData} t={t} moneyExact={moneyExact} />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
        <div className={cx(cardShell, panelPadding)}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t.transactions}</h2>
            <button
              onClick={() => onViewChange("transactions")}
              className="flex h-7 items-center gap-1 rounded-md border border-black/10 px-2 text-xs text-black/60"
            >
              {t.view} <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mt-3 divide-y divide-black/8">
            {displayData.transactions.slice(0, 6).map((transaction) => (
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

        <div className={cx(cardShell, panelPadding)}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t.recurring}</h2>
            <CalendarClock className="size-4 text-black/45" />
          </div>
          <div className="mt-3 space-y-2">
            {displayData.recurring.slice(0, 4).map((transaction) => (
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

function AccountMixChart({
  data,
  t,
  money,
}: {
  data: AppSummary;
  t: UiText;
  money: Intl.NumberFormat;
}) {
  const groups = [
    {
      label: t.accountGroupLiquid,
      color: "#38b487",
      value: data.accounts
        .filter((account) => account.type === "Checking" || account.type === "Savings")
        .reduce((total, account) => total + Math.max(0, account.balance), 0),
    },
    {
      label: t.accountGroupDebt,
      color: "#e46f54",
      value: data.accounts
        .filter((account) => account.type === "Credit Card" || account.type === "Loan")
        .reduce((total, account) => total + Math.abs(Math.min(0, account.balance)), 0),
    },
    {
      label: t.accountGroupInvesting,
      color: "#4f7cff",
      value: data.accounts
        .filter((account) => account.type === "Investment" || account.type === "PAC")
        .reduce((total, account) => total + Math.max(0, account.balance), 0),
    },
  ].filter((group) => group.value > 0);
  const total = groups.reduce((sum, group) => sum + group.value, 0);

  if (total <= 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
        {groups.map((group) => (
          <div
            key={group.label}
            className="h-full"
            style={{
              width: `${(group.value / total) * 100}%`,
              backgroundColor: group.color,
            }}
            title={`${group.label} ${money.format(group.value)}`}
          />
        ))}
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {groups.map((group) => (
          <div key={group.label} className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-white/45">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              {group.label}
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-white/82">
              {money.format(group.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectedAccountBalances({
  data,
  currentData,
  projectionDate,
  isProjection,
  t,
  moneyExact,
  dateLocale,
  language,
}: {
  data: AppSummary;
  currentData: AppSummary;
  projectionDate: string;
  isProjection: boolean;
  t: UiText;
  moneyExact: Intl.NumberFormat;
  dateLocale: string;
  language: Language;
}) {
  const currentBalances = new Map(
    currentData.accounts.map((account) => [account.id, account.balance]),
  );
  const rows = data.accounts.map((account) => {
    const currentBalance = currentBalances.get(account.id) ?? account.balance;

    return {
      account,
      delta: account.balance - currentBalance,
    };
  });
  const totalDelta = rows.reduce((sum, row) => sum + row.delta, 0);
  const displayDate = new Date(`${projectionDate}T00:00:00`).toLocaleDateString(
    dateLocale,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );

  return (
    <section className={cx(cardShell, panelPadding)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{t.projectedAccountBalances}</h2>
          <p className="mt-0.5 text-xs text-black/45">
            {isProjection ? `${t.projectedAsOf} ${displayDate}` : `${t.projectionToday} - ${displayDate}`}
          </p>
        </div>
        <div className="rounded-md border border-black/10 bg-[#f7f7f3] px-2.5 py-1.5 text-right">
          <p className="text-[11px] font-semibold uppercase text-black/45">
            {t.changeSinceToday}
          </p>
          <p
            className={cx(
              "text-xs font-semibold",
              totalDelta > 0 && "text-[#177b55]",
              totalDelta < 0 && "text-[#b84430]",
            )}
          >
            {moneyExact.format(totalDelta)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ account, delta }) => (
          <div
            key={account.id}
            className="rounded-md border border-black/10 bg-[#f7f7f3] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{account.name}</p>
                <p className="mt-0.5 truncate text-[11px] text-black/45">
                  {account.institution} - {translateSystemValue(account.type, language)}
                </p>
              </div>
              <span
                className="mt-1 size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: account.color }}
              />
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase text-black/45">
                  {t.projectedBalance}
                </p>
                <p
                  className={cx(
                    "mt-0.5 text-base font-semibold",
                    account.balance < 0 && "text-[#b84430]",
                  )}
                >
                  {moneyExact.format(account.balance)}
                </p>
              </div>
              <p
                className={cx(
                  "shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold",
                  delta > 0 && "bg-[#38b487]/12 text-[#177b55]",
                  delta < 0 && "bg-[#e46f54]/12 text-[#b84430]",
                  delta === 0 && "bg-black/7 text-black/50",
                )}
              >
                {delta > 0 ? "+" : ""}
                {moneyExact.format(delta)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function UpcomingCommitments({
  data,
  t,
  moneyExact,
  dateLocale,
  language,
}: {
  data: AppSummary;
  t: UiText;
  moneyExact: Intl.NumberFormat;
  dateLocale: string;
  language: Language;
}) {
  const horizonDate = new Date();
  horizonDate.setDate(horizonDate.getDate() + 30);
  const today = inputDateString();
  const horizon = inputDateString(horizonDate);
  const pendingItems = data.transactions
    .filter((transaction) => transaction.status === "pending" && transaction.date <= horizon)
    .map((transaction) => ({
      id: `pending-${transaction.id}`,
      date: transaction.date,
      label: transaction.merchant,
      detail: `${translateSystemValue("pending", language)} - ${transaction.account_name}`,
      amount: transaction.amount,
      color: transaction.category_color,
    }));
  const recurringItems = data.recurring
    .filter(
      (rule) =>
        rule.next_occurrence_date >= today &&
        rule.next_occurrence_date <= horizon,
    )
    .map((rule) => {
      const isTransfer = Boolean(rule.transfer_to_account_id);

      return {
        id: `recurring-${rule.id}`,
        date: rule.next_occurrence_date,
        label: rule.merchant,
        detail: isTransfer
          ? `${rule.account_name} -> ${rule.transfer_to_account_name ?? t.toAccount}`
          : translateSystemValue(rule.category_name, language),
        amount: isTransfer ? -Math.abs(rule.amount) : rule.amount,
        color: rule.category_color,
      };
    });
  const items = [...pendingItems, ...recurringItems]
    .sort((first, second) => first.date.localeCompare(second.date))
    .slice(0, 6);
  const impact = items.reduce((total, item) => total + item.amount, 0);

  return (
    <section className={cx(cardShell, panelPadding, "flex min-h-[282px] flex-col")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{t.upcomingCommitments}</h2>
          <p className="mt-0.5 text-[11px] font-medium text-black/45">
            {t.next30Days}
          </p>
        </div>
        <CalendarClock className="size-4 text-black/45" />
      </div>

      <div className="mt-3 rounded-md border border-black/10 bg-[#f7f7f3] p-3">
        <p className="text-[11px] font-semibold uppercase text-black/45">
          {t.projectedImpact}
        </p>
        <p
          className={cx(
            "mt-1 text-2xl font-semibold",
            impact > 0 && "text-[#177b55]",
            impact < 0 && "text-[#b84430]",
          )}
        >
          {moneyExact.format(impact)}
        </p>
      </div>

      <div className="mt-3 flex-1 divide-y divide-black/8">
        {items.length === 0 ? (
          <p className="rounded-md border border-black/10 bg-[#f7f7f3] p-3 text-xs leading-5 text-black/55">
            {t.noUpcomingCommitments}
          </p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5 py-2 first:pt-0">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{item.label}</p>
                <p className="truncate text-[11px] text-black/45">{item.detail}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-medium text-black/45">
                  {new Date(`${item.date}T00:00:00`).toLocaleDateString(dateLocale, {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <p
                  className={cx(
                    "text-xs font-semibold",
                    item.amount > 0 && "text-[#177b55]",
                    item.amount < 0 && "text-[#b84430]",
                  )}
                >
                  {moneyExact.format(item.amount)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function SpendingBreakdown({
  data,
  t,
  money,
  language,
}: {
  data: AppSummary;
  t: UiText;
  money: Intl.NumberFormat;
  language: Language;
}) {
  const budgetRows = data.budgets
    .filter((budget) => budget.spent > 0 || budget.amount > 0)
    .sort((first, second) => second.spent - first.spent)
    .slice(0, 5);
  const maxValue = Math.max(
    1,
    ...budgetRows.map((budget) => Math.max(budget.spent, budget.amount)),
  );

  return (
    <div className={cx(cardShell, panelPadding)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t.budgets}</h2>
        <Target className="size-4 text-black/45" />
      </div>
      <div className="mt-4 space-y-3">
        {budgetRows.length === 0 ? (
          <p className="text-xs text-black/50">{t.noBudgets}</p>
        ) : (
          budgetRows.map((budget) => {
            const spentWidth = Math.min(100, (budget.spent / maxValue) * 100);
            const targetWidth = Math.min(100, (budget.amount / maxValue) * 100);

            return (
              <div key={budget.id}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="truncate text-xs font-semibold">
                    {translateSystemValue(budget.category_name, language)}
                  </p>
                  <p className="shrink-0 text-[11px] text-black/50">
                    {money.format(budget.spent)} / {money.format(budget.amount)}
                  </p>
                </div>
                <div className="relative h-2 rounded-full bg-black/7">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-black/12"
                    style={{ width: `${targetWidth}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${spentWidth}%`,
                      backgroundColor: budget.color,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function HighYieldInterestChart({
  data,
  t,
  moneyExact,
}: {
  data: AppSummary;
  t: UiText;
  moneyExact: Intl.NumberFormat;
}) {
  const points = data.highYieldInterest;
  const maxValue = Math.max(
    0.01,
    ...points.flatMap((point) => [point.gross, point.net, point.tax]),
  );
  const totalNet = points.reduce((sum, point) => sum + point.net, 0);
  const totalTax = points.reduce((sum, point) => sum + point.tax, 0);

  return (
    <section className={cx(cardShell, panelPadding)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{t.highYieldInterest}</h2>
          <p className="mt-0.5 text-xs text-black/45">{t.highYieldInterestDetail}</p>
        </div>
        <div className="flex gap-2 text-right text-xs">
          <div className="rounded-md border border-black/10 bg-[#f7f7f3] px-2.5 py-1.5">
            <p className="text-[11px] uppercase text-black/45">Net</p>
            <p className="font-semibold text-[#177b55]">{moneyExact.format(totalNet)}</p>
          </div>
          <div className="rounded-md border border-black/10 bg-[#f7f7f3] px-2.5 py-1.5">
            <p className="text-[11px] uppercase text-black/45">Tax</p>
            <p className="font-semibold text-[#b84430]">{moneyExact.format(totalTax)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex h-36 items-end gap-2">
        {points.map((point, index) => (
          <div key={`${point.month}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-24 w-full items-end justify-center gap-1">
              <div
                className="w-[28%] rounded-t-sm bg-[#a7d8bf]"
                title={`Gross ${moneyExact.format(point.gross)}`}
                style={{ height: `${Math.max(3, (point.gross / maxValue) * 100)}%` }}
              />
              <div
                className="w-[28%] rounded-t-sm bg-[#177b55]"
                title={`Net ${moneyExact.format(point.net)}`}
                style={{ height: `${Math.max(3, (point.net / maxValue) * 100)}%` }}
              />
              <div
                className="w-[28%] rounded-t-sm bg-[#e46f54]"
                title={`Tax ${moneyExact.format(point.tax)}`}
                style={{ height: `${Math.max(3, (point.tax / maxValue) * 100)}%` }}
              />
            </div>
            <span className="truncate text-[11px] font-medium text-black/45">
              {point.month}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-semibold uppercase text-black/45">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#a7d8bf]" />
          Gross
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#177b55]" />
          Net
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#e46f54]" />
          Tax
        </span>
      </div>
    </section>
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
  tone: "green" | "coral" | "gold" | "blue";
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.07] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div
        className={cx(
          "grid size-8 place-items-center rounded-md",
          tone === "green" && "bg-[#38b487]/18 text-[#70d8aa]",
          tone === "coral" && "bg-[#e46f54]/18 text-[#ffae9b]",
          tone === "gold" && "bg-[#f4b63f]/18 text-[#ffd477]",
          tone === "blue" && "bg-[#4f7cff]/18 text-[#9bb6ff]",
        )}
      >
        {icon}
      </div>
      <p className="mt-4 text-xs text-white/55">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

const quickControlClass =
  "h-[34px] text-[12px] leading-none";
const quickGridClass =
  "grid gap-2 sm:grid-cols-2 lg:grid-cols-6";

function QuickFormCell({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("min-w-0", className)}>
      <span className="mb-1 block text-[10px] font-semibold uppercase leading-none text-black/45">
        {label}
      </span>
      {children}
    </label>
  );
}

function QuickRecurringToggle({ t }: { t: UiText }) {
  return (
    <QuickFormCell label={t.recurring}>
      <span className="flex h-[34px] items-center gap-2 rounded-md border border-black/10 bg-[#f7f7f3] px-2.5 text-[12px] font-medium text-black/70">
        <input name="is_recurring" type="checkbox" className="size-3.5 accent-[#171b18]" />
        <span className="truncate">{t.repeatMonthly}</span>
      </span>
    </QuickFormCell>
  );
}

function QuickTransactionForm({
  data,
  busy,
  onMutate,
  t,
  language,
  variant = "panel",
}: {
  data: AppSummary;
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  t: UiText;
  language: Language;
  variant?: "panel" | "wide";
}) {
  const [mode, setMode] = useState<"standard" | "pac" | "transfer">("standard");
  const transactionCategories = data.categories.filter(
    (category) => category.name !== "Transfers",
  );

  if (data.accounts.length === 0) {
    return (
      <div className={cx(cardShell, panelPadding)}>
        <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t.addTransaction}</h2>
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
    <div className={cx(cardShell, panelPadding)}>
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold">{t.addTransaction}</h2>
        <Plus className="size-4 text-black/45" />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1 rounded-md bg-black/6 p-0.5">
        <button
          type="button"
          onClick={() => setMode("standard")}
          className={cx(
            "h-7 rounded-[4px] text-[12px] font-semibold transition",
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
            "h-7 rounded-[4px] text-[12px] font-semibold transition",
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
            "h-7 rounded-[4px] text-[12px] font-semibold transition",
            mode === "transfer"
              ? "bg-white text-black shadow-sm"
              : "text-black/55 hover:text-black",
          )}
        >
          {t.transfer}
        </button>
      </div>

      <div className={cx("mt-3", variant === "wide" ? "min-h-[126px]" : "min-h-[218px]")}>
        {mode === "pac" ? (
          <PacContributionForm
            accounts={data.accounts}
            busy={busy}
            onMutate={onMutate}
            t={t}
            embedded
            variant={variant}
          />
        ) : mode === "transfer" ? (
          <AccountTransferForm
            accounts={data.accounts}
            busy={busy}
            onMutate={onMutate}
            t={t}
            language={language}
            embedded
            variant={variant}
          />
        ) : (
          <form onSubmit={handleSubmit}>
          <div
            className={cx(
              "grid gap-2",
              variant === "wide"
                ? quickGridClass
                : "sm:grid-cols-2",
            )}
          >
            <QuickFormCell label={t.merchant} className={variant === "wide" ? "lg:col-span-2" : undefined}>
              <Field
                name="merchant"
                placeholder={t.merchant}
                required
                className={quickControlClass}
              />
            </QuickFormCell>
            <QuickFormCell label={t.amount}>
              <Field
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                className={quickControlClass}
              />
            </QuickFormCell>
            <QuickFormCell label={t.transactionType}>
              <Select name="kind" defaultValue="expense" className={quickControlClass}>
                <option value="expense">{t.expense}</option>
                <option value="income">{t.income}</option>
              </Select>
            </QuickFormCell>
            <QuickFormCell label={t.statusLabel}>
              <Select name="status" defaultValue="cleared" className={quickControlClass}>
                <option value="cleared">{translateSystemValue("cleared", language)}</option>
                <option value="pending">{translateSystemValue("pending", language)}</option>
              </Select>
            </QuickFormCell>
            <QuickFormCell label={t.accounts}>
              <Select name="account_id" defaultValue={data.accounts[0]?.id} className={quickControlClass}>
                {data.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </QuickFormCell>
            <QuickFormCell label={t.category}>
              <Select name="category_id" defaultValue={transactionCategories[0]?.id} className={quickControlClass}>
                {transactionCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {translateSystemValue(category.name, language)}
                  </option>
                ))}
              </Select>
            </QuickFormCell>
            <QuickFormCell label={t.date}>
              <Field
                name="date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={quickControlClass}
              />
            </QuickFormCell>
            <QuickRecurringToggle t={t} />
            <QuickFormCell label={t.finalMonth}>
              <Field name="end_month" type="month" className={quickControlClass} />
            </QuickFormCell>
            <button
              disabled={busy}
              className={cx(
                "flex h-[34px] items-center justify-center gap-2 self-end rounded-md bg-[#171b18] px-4 text-[12px] font-semibold text-white transition hover:bg-black disabled:opacity-60",
                variant === "wide" ? "w-auto min-w-32" : "w-full sm:col-span-2",
              )}
            >
              <Check className="size-3.5" />
              {t.save}
            </button>
          </div>
          </form>
        )}
      </div>
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
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const transactionCategories = data.categories;

  return (
    <div className="space-y-4">
      <QuickTransactionForm
        data={data}
        busy={busy}
        onMutate={onMutate}
        t={t}
        language={language}
        variant="wide"
      />
      <section className={cx(cardShell, panelPadding)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">{t.transactions}</h2>
          <div className="flex h-9 w-full items-center gap-2 rounded-md border border-black/10 bg-[#f7f7f3] px-2.5 sm:w-[300px]">
            <Search className="size-4 text-black/35" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.search}
              className="w-full bg-transparent text-xs outline-none placeholder:text-black/35"
            />
          </div>
        </div>
        <div className="mt-3 divide-y divide-black/8">
          {transactions.map((transaction) =>
            editingTransactionId === transaction.id ? (
              <TransactionEditRow
                key={transaction.id}
                transaction={transaction}
                accounts={data.accounts}
                categories={transactionCategories}
                busy={busy}
                onCancel={() => setEditingTransactionId(null)}
                onMutate={onMutate}
                t={t}
                language={language}
              />
            ) : (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onEdit={
                  isInternalTransfer(transaction)
                    ? undefined
                    : () => setEditingTransactionId(transaction.id)
                }
                onDelete={() =>
                  onRequestConfirm({
                    title: t.deleteTransactionTitle,
                    message: t.deleteTransactionMessage(
                      transaction.merchant,
                      moneyExact.format(transaction.amount),
                    ),
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
                t={t}
              />
            ),
          )}
        </div>
      </section>
    </div>
  );
}

function TransactionRow({
  transaction,
  compact,
  onEdit,
  onDelete,
  moneyExact,
  dateLocale,
  language,
  t,
}: {
  transaction: Transaction;
  compact?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  moneyExact: Intl.NumberFormat;
  dateLocale: string;
  language: Language;
  t?: UiText;
}) {
  const isIncome = transaction.amount > 0;
  const canShowActions = Boolean(t && (onEdit || onDelete));

  return (
    <div className="flex min-h-[50px] items-center gap-2.5 py-2">
      <div
        className="grid size-8 shrink-0 place-items-center rounded-md text-white"
        style={{ backgroundColor: transaction.category_color }}
      >
        {isIncome ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{transaction.merchant}</p>
        <p className="truncate text-[11px] text-black/45">
          {translateSystemValue(transaction.category_name, language)} -{" "}
          {transaction.account_name}
        </p>
      </div>
      {!compact && (
        <p className="hidden w-20 shrink-0 text-xs text-black/45 sm:block">
          {new Date(`${transaction.date}T00:00:00`).toLocaleDateString(dateLocale, {
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
      <p className={cx("shrink-0 text-xs font-semibold", isIncome && "text-[#177b55]")}>
        {moneyExact.format(transaction.amount)}
      </p>
      {canShowActions && t && (
        <TransactionActions
          onEdit={onEdit}
          onDelete={onDelete}
          t={t}
        />
      )}
    </div>
  );
}

function TransactionActions({
  onEdit,
  onDelete,
  t,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  t: UiText;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid size-7 place-items-center rounded-md border border-black/10 text-black/45 transition hover:border-black/20 hover:text-black"
        title={t.actions}
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-32 rounded-md border border-black/10 bg-[#f8f7f2] p-1 shadow-[0_16px_40px_rgba(23,27,24,0.16)]">
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex h-8 w-full items-center gap-2 rounded-sm px-2.5 text-left text-xs font-medium whitespace-nowrap text-black/70 transition hover:bg-white hover:text-black"
            >
              <Pencil className="size-3.5" />
              {t.editAction}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex h-8 w-full items-center gap-2 rounded-sm px-2.5 text-left text-xs font-medium whitespace-nowrap text-[#b84430] transition hover:bg-white"
            >
              <Trash2 className="size-3.5" />
              {t.deleteAction}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TransactionEditRow({
  transaction,
  accounts,
  categories,
  busy,
  onCancel,
  onMutate,
  t,
  language,
}: {
  transaction: Transaction;
  accounts: AppSummary["accounts"];
  categories: AppSummary["categories"];
  busy: boolean;
  onCancel: () => void;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  t: UiText;
  language: Language;
}) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const amount = Number(formData.get("amount") ?? 0);
    const kind = String(formData.get("kind"));

    await onMutate(() =>
      sendJson(`/api/transactions/${transaction.id}`, "PATCH", {
        merchant: formData.get("merchant"),
        account_id: Number(formData.get("account_id")),
        category_id: Number(formData.get("category_id")),
        amount: kind === "expense" ? -Math.abs(amount) : Math.abs(amount),
        date: formData.get("date"),
        status: formData.get("status"),
        notes: formData.get("notes") || null,
      }),
    );
    onCancel();
  }

  return (
    <form onSubmit={handleSubmit} className="py-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_120px_120px_150px_150px_120px]">
        <Field name="merchant" defaultValue={transaction.merchant} placeholder={t.merchant} required />
        <Field
          name="amount"
          type="number"
          step="0.01"
          defaultValue={Math.abs(transaction.amount)}
          placeholder={t.amount}
          required
        />
        <Select name="kind" defaultValue={transaction.amount < 0 ? "expense" : "income"}>
          <option value="expense">{t.expense}</option>
          <option value="income">{t.income}</option>
        </Select>
        <Select name="status" defaultValue={transaction.status}>
          <option value="cleared">{translateSystemValue("cleared", language)}</option>
          <option value="pending">{translateSystemValue("pending", language)}</option>
        </Select>
        <Select name="account_id" defaultValue={transaction.account_id}>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
        <Field name="date" type="date" defaultValue={transaction.date} required />
        <Select name="category_id" defaultValue={transaction.category_id}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {translateSystemValue(category.name, language)}
            </option>
          ))}
        </Select>
        <Field
          name="notes"
          defaultValue={transaction.notes ?? ""}
          placeholder={t.notes}
          className="lg:col-span-3"
        />
        <div className="flex gap-2 lg:col-span-2">
          <button
            disabled={busy}
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-[#171b18] px-3 text-xs font-semibold text-white disabled:opacity-60"
          >
            <Check className="size-4" />
            {t.save}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="grid size-9 place-items-center rounded-md border border-black/10 text-black/55"
            title={t.cancel}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </form>
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
    <div className="space-y-4">
      <BudgetCreateForm
        categories={availableCategories}
        busy={busy}
        onMutate={onMutate}
        t={t}
        language={language}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.budgets.length === 0 && (
          <div className={cx(cardShell, panelPadding, "text-sm text-black/55")}>
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
      className={cx(cardShell, panelPadding)}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t.addBudget}</h2>
        <Target className="size-4 text-black/45" />
      </div>

      {categories.length === 0 ? (
        <p className="mt-4 text-sm text-black/55">
          {t.allCategoriesBudgeted}
        </p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px_110px]">
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
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#171b18] text-xs font-semibold text-white disabled:opacity-60"
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
    <div className={cx(compactCardShell, panelPadding)}>
      <BudgetLine
        budget={{ ...budget, amount: Number(amount) || 0 }}
        t={t}
        money={money}
        language={language}
      />
      <div className="mt-3 flex gap-2">
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          type="number"
          className="h-9 min-w-0 flex-1 rounded-md border border-black/10 bg-[#f7f7f3] px-2.5 text-xs outline-none focus:border-[#171b18]"
        />
        <button
          disabled={busy}
          onClick={() =>
            onMutate(() =>
              sendJson(`/api/budgets/${budget.id}`, "PATCH", { amount: Number(amount) }),
            )
          }
          className="grid size-9 place-items-center rounded-md bg-[#171b18] text-white disabled:opacity-60"
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
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className={cx(cardShell, panelPadding)}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t.addGoal}</h2>
          <Target className="size-4 text-black/45" />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_150px_150px_150px_56px_110px]">
          <Field name="name" placeholder={t.addGoal} required />
          <Field name="target_amount" type="number" placeholder={t.target} required />
          <Field name="current_amount" type="number" placeholder={t.savedGoal} required />
          <Field name="due_date" type="date" required />
          <Field name="color" type="color" defaultValue="#e0a928" />
          <button
            disabled={busy}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#171b18] text-xs font-semibold text-white disabled:opacity-60"
          >
            <Plus className="size-4" />
            {t.add}
          </button>
        </div>
      </form>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
    <div className={cx(compactCardShell, panelPadding)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{goal.name}</p>
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
      <div className="mt-5 flex items-end justify-between gap-4">
        <p className="text-2xl font-semibold">{Math.round(percent)}%</p>
        <p className="text-xs text-black/55">
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
  variant = "panel",
}: {
  accounts: AppSummary["accounts"];
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  t: UiText;
  embedded?: boolean;
  variant?: "panel" | "wide";
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
        embedded ? "pt-4" : cardShell,
        !embedded && panelPadding,
      )}
    >
      {!embedded && (
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t.addPacContribution}</h2>
          <LineChart className="size-4 text-black/45" />
        </div>
      )}

      {pacAccounts.length === 0 ? (
        <p className="mt-4 text-sm text-black/55">{t.noPacAccount}</p>
      ) : sourceAccounts.length === 0 ? (
        <p className="mt-4 text-sm text-black/55">{t.noAccountForTransaction}</p>
      ) : (
        <div
          className={cx(
            "grid gap-2",
            !embedded && "mt-3",
            variant === "wide" ? quickGridClass : "sm:grid-cols-2",
          )}
        >
          <QuickFormCell label={t.fromAccount} className={variant === "wide" ? "lg:col-span-2" : undefined}>
            <Select name="source_account_id" defaultValue={sourceAccounts[0]?.id} className={quickControlClass}>
              {sourceAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </QuickFormCell>
          <QuickFormCell label={t.toPac} className={variant === "wide" ? "lg:col-span-2" : undefined}>
            <Select name="pac_account_id" defaultValue={pacAccounts[0]?.id} className={quickControlClass}>
              {pacAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </QuickFormCell>
          <QuickFormCell label={t.amount}>
            <Field name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required className={quickControlClass} />
          </QuickFormCell>
          <QuickFormCell label={t.date}>
            <Field
              name="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={quickControlClass}
            />
          </QuickFormCell>
          <QuickRecurringToggle t={t} />
          <QuickFormCell label={t.finalMonth}>
            <Field name="end_month" type="month" className={quickControlClass} />
          </QuickFormCell>
          <button
            disabled={busy}
            className={cx(
              "flex h-[34px] items-center justify-center gap-2 self-end rounded-md bg-[#171b18] px-4 text-[12px] font-semibold text-white disabled:opacity-60",
              variant === "wide" ? "w-auto min-w-32" : "w-full sm:col-span-2",
            )}
          >
            <Plus className="size-3.5" />
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
  variant = "panel",
}: {
  accounts: AppSummary["accounts"];
  busy: boolean;
  onMutate: (task: () => Promise<unknown>) => Promise<void>;
  t: UiText;
  language: Language;
  embedded?: boolean;
  variant?: "panel" | "wide";
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
        embedded ? "pt-4" : cardShell,
        !embedded && panelPadding,
      )}
    >
      {!embedded && (
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t.addTransfer}</h2>
          <ArrowRightLeft className="size-4 text-black/45" />
        </div>
      )}

      {accounts.length < 2 ? (
        <p className="mt-4 text-sm text-black/55">{t.noTransferAccounts}</p>
      ) : (
        <div
          className={cx(
            "grid gap-2",
            !embedded && "mt-3",
            variant === "wide" ? quickGridClass : "sm:grid-cols-2",
          )}
        >
          <QuickFormCell label={t.fromAccount} className={variant === "wide" ? "lg:col-span-2" : undefined}>
            <Select
              name="source_account_id"
              value={sourceAccountId}
              className={quickControlClass}
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
          </QuickFormCell>
          <QuickFormCell label={t.toAccount} className={variant === "wide" ? "lg:col-span-2" : undefined}>
            <Select
              key={sourceAccountId}
              name="destination_account_id"
              defaultValue={defaultDestinationAccountId}
              className={quickControlClass}
            >
              {destinationOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </QuickFormCell>
          <QuickFormCell label={t.amount}>
            <Field name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required className={quickControlClass} />
          </QuickFormCell>
          <QuickFormCell label={t.statusLabel}>
            <Select name="status" defaultValue="cleared" className={quickControlClass}>
              <option value="cleared">{translateSystemValue("cleared", language)}</option>
              <option value="pending">{translateSystemValue("pending", language)}</option>
            </Select>
          </QuickFormCell>
          <QuickFormCell label={t.date}>
            <Field
              name="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={quickControlClass}
            />
          </QuickFormCell>
          <QuickRecurringToggle t={t} />
          <QuickFormCell label={t.finalMonth}>
            <Field name="end_month" type="month" className={quickControlClass} />
          </QuickFormCell>
          <button
            disabled={busy}
            className={cx(
              "flex h-[34px] items-center justify-center gap-2 self-end rounded-md bg-[#171b18] px-4 text-[12px] font-semibold text-white disabled:opacity-60",
              variant === "wide" ? "w-auto min-w-32" : "w-full sm:col-span-2",
            )}
          >
            <Plus className="size-3.5" />
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
  const [draggingAccountId, setDraggingAccountId] = useState<number | null>(null);
  const [dragOverAccountId, setDragOverAccountId] = useState<number | null>(null);
  const [expandedAccountIds, setExpandedAccountIds] = useState<Set<number>>(
    () => new Set(),
  );
  const percent = useMemo(
    () =>
      new Intl.NumberFormat(language === "it" ? "it-IT" : "en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: "exceptZero",
      }),
    [language],
  );
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

  async function saveAccountOrder(sourceId: number, targetId: number) {
    if (sourceId === targetId) {
      setDraggingAccountId(null);
      setDragOverAccountId(null);
      return;
    }

    const nextOrder = data.accounts.map((account) => account.id);
    const sourceIndex = nextOrder.indexOf(sourceId);

    if (sourceIndex < 0 || !nextOrder.includes(targetId)) {
      setDraggingAccountId(null);
      setDragOverAccountId(null);
      return;
    }

    const [movedId] = nextOrder.splice(sourceIndex, 1);
    const targetIndex = nextOrder.indexOf(targetId);
    nextOrder.splice(targetIndex, 0, movedId);
    setDraggingAccountId(null);
    setDragOverAccountId(null);
    await onMutate(() => sendJson("/api/accounts", "PATCH", { account_ids: nextOrder }));
  }

  return (
    <div className="space-y-4">
      <section>
        <div className={cx(compactCardShell, "mb-4 p-3")}>
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
                  <span className="block text-[11px] font-semibold uppercase opacity-65">
                    {group.label}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold">
                    {moneyExact.format(total)}
                  </span>
                  <span className="mt-0.5 block text-[11px] opacity-55">
                    {accounts.length} {t.accounts.toLowerCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className={cx(cardShell, panelPadding, "mb-4")}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t.addAccount}</h2>
            <Banknote className="size-4 text-black/45" />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_130px_56px_110px]">
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
            <button
              disabled={busy}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#171b18] text-xs font-semibold text-white disabled:opacity-60"
            >
              <Plus className="size-4" />
              {t.add}
            </button>
          </div>
        </form>

        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {visibleAccounts.map((account) => {
          const monthlyChange = account.monthly_change ?? 0;
          const monthlyChangePercent = account.monthly_change_percent;
          const monthlyChangeLabel =
            monthlyChangePercent === null || monthlyChangePercent === undefined
              ? "--"
              : `${percent.format(monthlyChangePercent)}%`;
          const isExpanded = expandedAccountIds.has(account.id);
          const recentTransactions = account.recent_transactions ?? [];

          return (
          <div
            key={account.id}
            onDragOver={(event) => {
              if (draggingAccountId && draggingAccountId !== account.id) {
                event.preventDefault();
                setDragOverAccountId(account.id);
              }
            }}
            onDragLeave={() => {
              if (dragOverAccountId === account.id) {
                setDragOverAccountId(null);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (draggingAccountId) {
                void saveAccountOrder(draggingAccountId, account.id);
              }
            }}
            className={cx(
              "group transition",
              draggingAccountId === account.id && "opacity-55",
              dragOverAccountId === account.id && "ring-2 ring-[#171b18]/20",
            )}
          >
            <div
              className={cx(
                compactCardShell,
                panelPadding,
                "relative overflow-hidden",
                isExpanded && "rounded-b-none",
              )}
            >
            <button
              type="button"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(account.id));
                setDraggingAccountId(account.id);
              }}
              onDragEnd={() => {
                setDraggingAccountId(null);
                setDragOverAccountId(null);
              }}
              className={cx(
                "absolute inset-y-0 left-0 w-2 cursor-grab border-r border-black/10 bg-black/7 opacity-0 transition duration-200 hover:bg-[#171b18]/18 group-hover:opacity-100 active:cursor-grabbing",
                draggingAccountId === account.id && "opacity-100",
              )}
              title={t.dragAccount}
              aria-label={t.dragAccount}
            />
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <div
                  className="grid size-9 shrink-0 place-items-center rounded-md text-white"
                  style={{ backgroundColor: account.color }}
                >
                  {account.type === "PAC" ? (
                    <LineChart className="size-4" />
                  ) : account.type === "Credit Card" ? (
                    <CreditCard className="size-4" />
                  ) : account.type === "Loan" ? (
                    <Home className="size-4" />
                  ) : (
                    <WalletCards className="size-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
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
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {account.name}
                      </p>
                      <p
                        className={cx(
                          "shrink-0 text-sm font-semibold",
                          account.balance < 0 && "text-[#b84430]",
                        )}
                      >
                        {moneyExact.format(account.balance)}
                      </p>
                      <span
                        className={cx(
                          "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                          monthlyChange > 0 && "bg-[#38b487]/12 text-[#177b55]",
                          monthlyChange < 0 && "bg-[#e46f54]/12 text-[#b84430]",
                          monthlyChange === 0 && "bg-black/7 text-black/50",
                        )}
                        title={`${moneyExact.format(monthlyChange)} ${t.monthlyPulse.toLowerCase()}`}
                      >
                        {monthlyChangeLabel}
                      </span>
                    </div>
                  )}
                  <p className="truncate text-[11px] text-black/45">
                    {account.institution} - {translateSystemValue(account.type, language)}
                  </p>
                </div>
              </div>
              {editingAccountId !== account.id && (
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <AccountActions
                    t={t}
                    onEdit={() => {
                      setEditingAccountId(account.id);
                      setAccountNameDraft(account.name);
                      setAccountBalanceDraft(String(account.balance));
                    }}
                    onDelete={() =>
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
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedAccountIds((current) => {
                        const next = new Set(current);

                        if (next.has(account.id)) {
                          next.delete(account.id);
                        } else {
                          next.add(account.id);
                        }

                        return next;
                      })
                    }
                    className="grid size-7 place-items-center rounded-full text-black/45 transition hover:bg-black/7 hover:text-black"
                    title={t.latestTransactions}
                    aria-label={t.latestTransactions}
                  >
                    <ChevronDown
                      className={cx(
                        "size-4 transition",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </button>
                </div>
              )}
            </div>
            {editingAccountId === account.id ? (
              <label className="mt-4 block">
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
            ) : null}
            </div>
            {isExpanded && (
              <div className="divide-y divide-black/8 rounded-b-md border-x border-b border-black/10 bg-[#f7f7f3] px-2.5">
                {recentTransactions.length === 0 ? (
                  <p className="py-3 text-xs text-black/50">
                    {t.noRecentTransactions}
                  </p>
                ) : (
                  recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex min-h-11 items-center gap-2 py-2"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: transaction.category_color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">
                          {transaction.merchant}
                        </p>
                        <p className="truncate text-[11px] text-black/45">
                          {new Date(`${transaction.date}T00:00:00`).toLocaleDateString(
                            language === "it" ? "it-IT" : "en",
                            { day: "numeric", month: "short" },
                          )}
                          {" - "}
                          {translateSystemValue(transaction.category_name, language)}
                        </p>
                      </div>
                      <p
                        className={cx(
                          "shrink-0 text-xs font-semibold",
                          transaction.amount > 0 && "text-[#177b55]",
                          transaction.amount < 0 && "text-[#b84430]",
                        )}
                      >
                        {moneyExact.format(transaction.amount)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          );
        })}
        </div>
      </section>
    </div>
  );
}

function AccountActions({
  onEdit,
  onDelete,
  t,
}: {
  onEdit: () => void;
  onDelete: () => void;
  t: UiText;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid size-7 place-items-center rounded-md border border-black/10 text-black/45 transition hover:border-black/20 hover:text-black"
        title={t.actions}
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-32 rounded-md border border-black/10 bg-[#f8f7f2] p-1 shadow-[0_16px_40px_rgba(23,27,24,0.16)]">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex h-8 w-full items-center gap-2 rounded-sm px-2.5 text-left text-xs font-medium whitespace-nowrap text-black/70 transition hover:bg-white hover:text-black"
          >
            <Pencil className="size-3.5" />
            {t.editAction}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex h-8 w-full items-center gap-2 rounded-sm px-2.5 text-left text-xs font-medium whitespace-nowrap text-[#b84430] transition hover:bg-white"
          >
            <Trash2 className="size-3.5" />
            {t.deleteAction}
          </button>
        </div>
      )}
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "h-9 w-full rounded-md border border-black/10 bg-[#f7f7f3] px-2.5 text-xs outline-none transition placeholder:text-black/35 focus:border-[#171b18] focus:bg-white focus:ring-2 focus:ring-[#171b18]/10",
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
          "relative flex h-9 w-full items-center rounded-md border border-black/10 bg-[#f7f7f3] px-2.5 pr-9 text-left text-xs font-medium text-black/76 outline-none transition hover:border-black/20 hover:bg-white focus:border-[#171b18] focus:bg-white focus:ring-2 focus:ring-[#171b18]/10 disabled:cursor-not-allowed disabled:opacity-55",
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
                  "flex min-h-8 w-full items-center justify-between gap-3 rounded-sm px-2.5 py-1.5 text-left text-xs font-medium transition duration-150 disabled:cursor-not-allowed disabled:opacity-40",
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

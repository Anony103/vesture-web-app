"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  SAVINGS_TYPE_TO_PRODUCT,
  type DemoPlan,
  type DemoTransaction,
} from "@/lib/investments";
import { useCurrentUser } from "@/components/auth/auth-guard";
import {
  getMyPurchases,
  getToken,
  getUserProducts,
  getUserTransactions,
  type BnplPurchase,
  type SavingsType,
  type UserProduct,
  type TransactionRecord,
} from "@/lib/api";

function toTitleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

// A plan with nothing in it yet is "Awaiting funding", not "Active". A Smart Lock sits in
// PENDING_FUNDING until its opening deposit lands; SmallVest and Target Lock are saved as active
// the moment they are created, but stay at ₦0 until the first deposit (a wallet debit that failed
// or a bank transfer that hasn't arrived), so an empty one is treated the same way.
function isAwaitingFunding(dto: UserProduct) {
  if (dto.status.trim().toLowerCase() === "pending_funding") return true;
  const emptyActive =
    dto.status.trim().toLowerCase() === "active" &&
    (dto.currentBalance ?? 0) <= 0 &&
    (dto.interestBalance ?? 0) <= 0;
  return (
    emptyActive &&
    (dto.savingsType === "SAVE_SMALL_SMALL" || dto.savingsType === "TARGET_SAVINGS")
  );
}

function mapProduct(dto: UserProduct): DemoPlan {
  const productId = SAVINGS_TYPE_TO_PRODUCT[dto.savingsType];
  const goal = dto.name ?? "Investment";
  const awaiting = isAwaitingFunding(dto);
  // Plans created outside the web app may carry no tenor; derive it from the dates instead.
  const months =
    dto.tenor && dto.tenor > 0
      ? dto.tenor
      : dto.completionDate
        ? Math.max(
            0,
            Math.round(
              (new Date(dto.completionDate).getTime() - new Date(dto.created_on).getTime()) /
                (30.44 * 24 * 3600 * 1000),
            ),
          )
        : 0;
  return {
    id: dto.id,
    productId,
    goal,
    amount: dto.currentBalance ?? 0,
    // An unfunded Smart Lock already carries its full-term interest figure; nothing is earned yet.
    interest: awaiting ? 0 : (dto.interestBalance ?? 0),
    started: dto.created_on,
    months,
    frequency: dto.frequency ? toTitleCase(dto.frequency) : "Daily",
    itemName: goal,
    awaitingFunding: awaiting,
    fundingAmount: dto.amount ?? 0,
    targetAmount: dto.amount ?? 0,
    maturityDate: dto.completionDate,
  };
}

// Asset purchases come from /my-purchases (the generic BNPL rows in get-user-products carry no
// name or amounts). What the customer has paid so far is the price minus what is still owed.
function mapPurchase(dto: BnplPurchase): DemoPlan {
  const price = dto.amount ?? 0;
  const remaining = dto.currentBalance ?? 0;
  const goal = (dto.name ?? "BuyNow PayLater").replace(/^BNPL - /, "");
  return {
    id: dto.id,
    productId: "bnpl",
    goal,
    amount: Math.max(price - remaining, 0),
    interest: 0,
    started: dto.created_on,
    months: dto.totalInstallments ?? 0,
    frequency: "Monthly",
    itemName: goal,
    bnpl: {
      price,
      initialPayment: dto.initialPayment ?? 0,
      remaining,
      monthlyPayment: dto.monthlyPayment ?? 0,
      paidInstallments: dto.paidInstallments ?? 0,
      totalInstallments: dto.totalInstallments ?? 0,
      nextPaymentDate: dto.nextPaymentDate,
      completed: dto.status.trim().toUpperCase() === "COMPLETED",
    },
  };
}

const STATUS_LABEL: Record<string, DemoTransaction["status"]> = {
  success: "Completed",
  completed: "Completed",
  pending: "Pending",
  failed: "Cancelled",
  cancelled: "Cancelled",
};

function mapTransaction(
  tx: TransactionRecord,
  savingsTypeById: Map<string, SavingsType>,
): DemoTransaction {
  const savingsType = tx.savingsId ? savingsTypeById.get(tx.savingsId) : undefined;
  const isWithdrawal = (tx.transactionType ?? "").toLowerCase() === "debit";
  return {
    id: tx.id,
    title: tx.transactionReason || (isWithdrawal ? "Withdrawal" : "Deposit"),
    date: tx.created_on,
    amount: tx.amount,
    productId: savingsType ? SAVINGS_TYPE_TO_PRODUCT[savingsType] : "smallvest",
    kind: isWithdrawal ? "Withdrawal" : "Deposit",
    status: STATUS_LABEL[(tx.transactionStatus ?? "").toLowerCase()] ?? "Completed",
  };
}

type State = {
  plans: DemoPlan[];
  transactions: DemoTransaction[];
  profileComplete: boolean;
  loading: boolean;
  loadError: string | null;
  completeProfile: () => void;
  reset: () => void;
  // Re-fetches plans + transactions from the backend - call after any create/fund/withdraw
  // mutation instead of hand-patching local state, since the backend is the source of truth.
  refresh: () => Promise<void>;
};
const Context = createContext<State | null>(null);
export function InvestmentProvider({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser();
  const [plans, setPlans] = useState<DemoPlan[]>([]);
  const [transactions, setTransactions] = useState<DemoTransaction[]>([]);
  const [profileComplete, setProfileComplete] = useState(
    user.hasSetWithdrawalBank === true,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [productsRes, transactionsRes, purchasesRes] = await Promise.all([
        getUserProducts(token),
        getUserTransactions(token),
        // Purchases are additive: if this one call fails the rest of the page still loads.
        getMyPurchases(token).catch(() => ({ data: [] as BnplPurchase[] })),
      ]);
      const products = productsRes.data.filter(
        (p) => p.savingsType !== "BUY_NOW_PAY_LATER",
      );
      const purchases = purchasesRes.data;
      const savingsTypeById = new Map<string, SavingsType>([
        ...products.map((p) => [p.id, p.savingsType] as const),
        ...purchases.map((p) => [p.id, "BUY_NOW_PAY_LATER"] as const),
      ]);
      setPlans([...products.map(mapProduct), ...purchases.map(mapPurchase)]);
      setTransactions(
        transactionsRes.data.map((tx) => mapTransaction(tx, savingsTypeById)),
      );
      setLoadError(null);
    } catch {
      setLoadError("Couldn't load your investments. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Only on mount - refresh() is stable (useCallback with no deps) and called explicitly
    // after mutations elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reset() {
    setPlans([]);
    setTransactions([]);
    setProfileComplete(false);
  }
  return (
    <Context.Provider
      value={{
        plans,
        transactions,
        profileComplete,
        loading,
        loadError,
        completeProfile: () => setProfileComplete(true),
        reset,
        refresh,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useInvestments() {
  const value = useContext(Context);
  if (!value) throw new Error("InvestmentProvider is required");
  return value;
}

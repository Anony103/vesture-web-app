import type { SavingsType } from "./api";
export type ProductId = "smallvest" | "target-lock" | "smart-lock" | "bnpl";
// Shared source of truth for the ProductId <-> SavingsType mapping - savingsType is the
// backend's vocabulary (SavingsService.getUserProduct), ProductId is this app's routing/display
// vocabulary (one page per product under /investments/[product]).
export const SAVINGS_TYPE_TO_PRODUCT: Record<SavingsType, ProductId> = {
  SAVE_SMALL_SMALL: "smallvest",
  TARGET_SAVINGS: "target-lock",
  SMART_LOCK: "smart-lock",
  BUY_NOW_PAY_LATER: "bnpl",
};
export const PRODUCT_TO_SAVINGS_TYPE: Record<ProductId, SavingsType> = {
  smallvest: "SAVE_SMALL_SMALL",
  "target-lock": "TARGET_SAVINGS",
  "smart-lock": "SMART_LOCK",
  bnpl: "BUY_NOW_PAY_LATER",
};
// DataInitializer seeds exactly these 4 product codes once per environment - used to find the
// backend's own Product.id (a UUID, required as `productId` on every creation call) from a
// GET /api/savings/get-products response.
export const PRODUCT_TO_PRODUCT_CODE: Record<ProductId, string> = {
  smallvest: "PRSSS0001",
  "target-lock": "PRTGS0001",
  "smart-lock": "PRSML0001",
  bnpl: "PRBNPL0001",
};
export type Product = {
  id: ProductId;
  name: string;
  tagline: string;
  description: string;
  color: string;
  border: string;
  arrow: string;
  rate: number;
  minimum: number;
  features: string[];
};
const savingsFeatures = [
  "From {min} to start",
  "Add any amount anytime",
  "Daily interest accrual",
  "Flexible withdrawals (terms apply)",
];
export const products: Product[] = [
  {
    id: "smallvest",
    name: "SmallVest",
    tagline: "Flexible investing that grows daily",
    description:
      "SmallVest helps you build savings gradually without locking into a fixed maturity date. A daily investment that accrues daily, and access eligible withdrawals based on your plan terms.",
    color: "#ecfcf8",
    border: "#008766",
    arrow: "94b48.svg",
    rate: 12,
    minimum: 50000,
    features: savingsFeatures,
  },
  {
    id: "target-lock",
    name: "Target Lock",
    tagline: "Invest toward a goal with discipline",
    description:
      "Target Lock is a goal-driven investment that helps you save toward a specific target such as rent, a car, school fees, or a long-term goal by locking your chosen amount.",
    color: "#ffbc81",
    border: "#dc6801",
    arrow: "a9e63.svg",
    rate: 20,
    minimum: 50000,
    features: savingsFeatures,
  },
  {
    id: "smart-lock",
    name: "Smart Lock",
    tagline: "Fixed-term investing for disciplined growth",
    description:
      "Smart Lock lets you invest a fixed amount and lock it for a defined duration. It helps you stay disciplined and focused on long-term growth.",
    color: "#7bbbff",
    border: "#0253a9",
    arrow: "f1ced.svg",
    rate: 22,
    minimum: 50000,
    features: savingsFeatures,
  },
  {
    id: "bnpl",
    name: "BuyNow PayLater",
    tagline: "Purchase assets and pay in instalments",
    description:
      "BuyNow PayLater lets you save toward high-value electronics, appliances, and gadgets and spread payments over time. Your item is released once you reach the full amount.",
    color: "#ffc7f2",
    border: "#ffc7f2",
    arrow: "64b74.svg",
    rate: 0,
    minimum: 50000,
    features: [
      "No interest charges on your savings",
      "Add extra savings anytime",
      "Withdraw your savings if needed (no penalty)",
      "Get the item once you save the full amount",
    ],
  },
];
// Smallest amount a user may start a savings plan with: private-sector users ₦50,000, public-sector
// (IPPIS) users ₦1,000. BNPL isn't a savings amount (it's an item price), so it keeps its own
// minimum. A user whose sector isn't known is treated as private - the stricter of the two.
// Smart Lock is the only savings product whose backend accepts an interest payout schedule
// (SmartLockDto.interestPaymentFrequency); these are the values it accepts.
export const INTEREST_PAYOUT_OPTIONS = [
  { label: "Monthly", code: "MONTHLY" },
  { label: "Quarterly", code: "QUARTERLY" },
  { label: "Semi-annually", code: "SEMI_ANNUALLY" },
  { label: "At maturity", code: "AT_MATURITY" },
] as const;
export type InterestPaymentCode = (typeof INTEREST_PAYOUT_OPTIONS)[number]["code"];
export function interestPaymentCode(label: string): InterestPaymentCode {
  return (
    INTEREST_PAYOUT_OPTIONS.find((option) => option.label === label)?.code ??
    "AT_MATURITY"
  );
}
export const PRIVATE_MIN_INVESTMENT = 50000;
export const PUBLIC_MIN_INVESTMENT = 1000;
export function minimumInvestment(
  product: Product,
  sectorPP: string | null | undefined,
) {
  if (product.id === "bnpl") return product.minimum;
  return sectorPP?.toLowerCase() === "public"
    ? PUBLIC_MIN_INVESTMENT
    : PRIVATE_MIN_INVESTMENT;
}
// Product feature bullets with the "{min}" placeholder filled in for this user's sector.
export function productFeatures(
  product: Product,
  sectorPP: string | null | undefined,
) {
  const min = currency(minimumInvestment(product, sectorPP));
  return product.features.map((feature) => feature.replace("{min}", min));
}
// Completion date (YYYY-MM-DD) for a plan that runs `months` from today. Drives tenor on the
// backend for Target Lock and Smart Lock.
export function completionDateFor(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}
export function frequencyCode(
  frequency: string,
): "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" {
  const upper = frequency.toUpperCase();
  return upper === "DAILY" || upper === "WEEKLY" || upper === "YEARLY"
    ? upper
    : "MONTHLY";
}
export function getProduct(id: string) {
  return products.find((product) => product.id === id);
}
export function currency(amount: number, fractionDigits = 0) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}
export type InvestmentDraft = {
  goal: string;
  amount: string;
  months: number;
  frequency: string;
  payout: string;
};
export function defaultDraft(): InvestmentDraft {
  return {
    goal: "",
    amount: "",
    months: 3,
    frequency: "Daily",
    payout: "At maturity",
  };
}
// Offline illustration of a savings plan using the product's indicative rate. Only a fallback:
// the review screen shows the backend's own preview (see use-savings-quote.ts) whenever it has one.
export function calculatePreview(product: Product, draft: InvestmentDraft) {
  const principal = Number(draft.amount) || 0;
  const grossInterest = (principal * (product.rate / 100) * draft.months) / 12;
  const withholding = grossInterest * 0.1;
  return {
    principal,
    grossInterest,
    withholding,
    total: principal + grossInterest - withholding,
  };
}
export type DemoPlan = {
  id: string;
  productId: ProductId;
  goal: string;
  amount: number;
  interest: number;
  started: string;
  months: number;
  frequency: string;
  itemName?: string;
  // Smart Lock created for a bank transfer whose money hasn't landed yet. It has no balance and
  // can't be withdrawn from or topped up; the backend deletes it if the transfer never arrives.
  awaitingFunding?: boolean;
  // For an awaiting-funding Smart Lock: the amount the customer has to transfer.
  fundingAmount?: number;
  // The amount the plan was created for (Target Lock: the goal; Smart Lock: the lock amount;
  // SmallVest: the amount set when it was created) - what "Amount locked" is measured against.
  targetAmount?: number;
  // When the plan matures (from the backend); Smart Lock principal can't leave before this.
  maturityDate?: string | null;
  // BuyNow PayLater purchases carry what is still owed instead of a saved balance.
  bnpl?: {
    price: number;
    initialPayment: number;
    remaining: number;
    monthlyPayment: number;
    paidInstallments: number;
    totalInstallments: number;
    nextPaymentDate: string | null;
    completed: boolean;
  };
};
export type DemoTransaction = {
  kind?: "Deposit" | "Withdrawal" | "Interest";
  status?: "Completed" | "Pending" | "Cancelled";
  id: string;
  title: string;
  date: string;
  amount: number;
  productId: ProductId;
};

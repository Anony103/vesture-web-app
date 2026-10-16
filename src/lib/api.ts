// Thin client for the Payrise/Vesture Spring Boot backend, mirroring how the Flutter mobile
// app's ApiServices/ApiRequestHandler call the same endpoints (see vesture-mobile's
// lib/src/core/api/api_services.dart). Every response follows the backend's ResponseDto shape:
// { status: "success" | "failed", code, message, data, error }.

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8082";

export type ApiResponse<T = unknown> = {
  // "pending" only comes back from calls that opt in with allowPending (a withdrawal the bank
  // has not confirmed yet); every other call still throws on anything but "success".
  status: "success" | "failed" | "pending";
  code: number;
  message: string;
  data: T;
  error: string | null;
};

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
    allowPending?: boolean;
  } = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", body, token, allowPending = false } = options;
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
    );
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    // Non-JSON response (e.g. a gateway error page) - fall through to the generic message below.
  }

  const accepted =
    payload?.status === "success" ||
    (allowPending && payload?.status === "pending" && response.status === 202);
  if (!response.ok || !payload || !accepted) {
    const message =
      payload?.message ?? payload?.error ?? `Request failed (${response.status}).`;
    throw new ApiError(message, response.status);
  }

  return payload;
}

// Converts a browser File to the data-URI string the backend's document/image fields expect
// (FileStorageService.saveBase64Image parses a "data:<mime>;base64,<...>" string), matching
// how the mobile app base64-encodes the same fields before sending them.
export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export type StartSignupPayload = {
  firstName: string;
  middleName?: string;
  lastName: string;
  bvn: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  stateOfOrigin: string;
  homeAddress?: string; // no longer asked at sign-up
  phoneNumber: string;
  device: string;
  channel: string;
  sectorPP: "Private" | "Public";
  ippisNo?: string;
};

export function startSignup(payload: StartSignupPayload) {
  return request<{ signupId: string; email: string }>(
    "/api/user/auth/start-signup",
    { method: "POST", body: payload },
  );
}

export type CompleteSignupPayload = StartSignupPayload & {
  signupId: string;
  otp: string;
  password: string;
  organization?: string;
  supportingDocument?: string;
  ninDocument?: string;
};

export function completeSignup(payload: CompleteSignupPayload) {
  return request("/api/user/auth/complete-signup", {
    method: "POST",
    body: payload,
  });
}

// Password reset - a real 3-step flow (unlike the signup verify screen, the OTP is checked
// server-side here), matching ForgotPasswordScreen/VerifyResetOtpScreen/ResetPasswordScreen
// in the mobile app.
export function forgotPassword(email: string) {
  return request("/api/user/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function resendPasswordResetOtp(email: string) {
  return request("/api/user/auth/resend-password-reset-otp", {
    method: "POST",
    body: { email },
  });
}

export function verifyPasswordResetOtp(email: string, otp: string) {
  return request("/api/user/auth/verify-password-reset-otp", {
    method: "POST",
    body: { email, otp },
  });
}

export function resetPassword(
  email: string,
  newPassword: string,
  confirmPassword: string,
) {
  return request("/api/user/auth/reset-password", {
    method: "POST",
    body: { email, newPassword, confirmPassword },
  });
}

export type LoginResponseData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
  expiresIn: number;
};

export function login(username: string, password: string) {
  return request<LoginResponseData>("/api/user/auth/login", {
    method: "POST",
    body: { username, password, device: "web", channel: "web" },
  });
}

export type CurrentUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  // Customer-facing id: only set for private-sector accounts (see
  // UserService.completeSignup), null for public-sector - matches how the mobile app's
  // home_screen.dart displays "Customer ID: ${uniqueRef ?? '---'}".
  uniqueRef: string | null;
  // Drives the "Complete Your Profile" dashboard banner, same as
  // AppCache.currentUser.hasSetWithdrawalBank on mobile.
  hasSetWithdrawalBank: boolean | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  state: string | null;
  balance: number | null;
  // The user's virtual account for funding by bank transfer. UserService.createBankAccount fills
  // the Providus or Flutterwave pair depending on the active provider ("00" = created, "99" =
  // creation failed); virtualAccountBankName is null for accounts created before it was stored.
  providusAccountNumber: string | null;
  hasProvidusAccount: string | null;
  flutterWaveAccountNumber: string | null;
  hasFlutterWaveAccount: string | null;
  virtualAccountBankName: string | null;
  // "Private" or "Public" - UserService.requestSecurityChangeOtp sends the security OTP to
  // email for private-sector users, SMS (BVN phone) for public-sector.
  sectorPP: string | null;
};

// Requires a valid JWT - a 401/403 here means the stored token is missing, expired, or
// otherwise invalid, which is what the workspace auth guard uses to decide access.
export function getLoggedInUser(token: string) {
  return request<CurrentUser>("/api/user/get-logged-in-user", { token });
}

export type EmployerInfo = {
  ippisNumber: string;
  fullName: string;
  employerOrganization: string;
};

export function validateIppis(ippisNumber: string) {
  return request<EmployerInfo>(
    `/api/user/auth/employer-info/${encodeURIComponent(ippisNumber)}`,
  );
}

// Bank account linking - mirrors BankAccountDetailsScreen in the mobile app: load the bank
// list, resolve an account number + bank code to the real account holder name (the backend
// re-verifies this itself server-side and ignores whatever name the client submits), then
// save. All three require auth.
export type BankOption = {
  id: number;
  code: string;
  name: string;
};

export function getBanks(token: string) {
  return request<BankOption[]>("/api/providus/get-banks", { token });
}

export type ResolvedAccount = {
  accountName: string;
  accountNumber: string;
};

export function resolveBankAccount(
  accountNumber: string,
  bankCode: string,
  token: string,
) {
  return request<ResolvedAccount>("/api/providus/get-account", {
    method: "POST",
    body: { accountNumber, bankCode },
    token,
  });
}

export function saveBankAccount(
  accountNumber: string,
  bankCode: string,
  accountName: string,
  token: string,
) {
  return request("/api/providus/save-account", {
    method: "POST",
    body: { accountNumber, bankCode, accountName },
    token,
  });
}

// Partial profile update - UserService.updateUser only copies non-null/non-empty fields onto
// the existing user, and RegisterDto has no name/email fields at all (those can't be changed
// through this endpoint), so only these three are ever sent.
export type UpdateProfilePayload = {
  phoneNumber?: string;
  dateOfBirth?: string;
  state?: string;
};

export function updateProfile(
  id: string,
  payload: UpdateProfilePayload,
  token: string,
) {
  return request("/api/user/update", {
    method: "POST",
    body: { id, ...payload },
    token,
  });
}

// Two-step security gate for password changes - UserService stores a one-time OTP on the user
// row (sent by email for private-sector, SMS for public-sector) and clears it once verified.
// Both endpoints take their parameter as a query string, not a JSON body (@RequestParam on the
// backend).
export function requestSecurityOtp(action: "password", token: string) {
  return request(`/api/user/security/request-otp?action=${action}`, {
    method: "POST",
    token,
  });
}

export function verifySecurityOtp(otp: string, token: string) {
  return request(
    `/api/user/security/verify-otp?otp=${encodeURIComponent(otp)}`,
    { method: "POST", token },
  );
}

export function updatePassword(
  oldPassword: string,
  newPassword: string,
  token: string,
) {
  return request("/api/user/password/update", {
    method: "POST",
    body: { oldPassword, newPassword },
    token,
  });
}

// Investment plans a user has opened across all four savings products - mirrors
// SavingsService.getUserProduct, which fans out SaveSmallSmall/SmartLock/TargetSavings/
// BuyNowPayLater rows into one flat list tagged by `savingsType`, matching how
// home_screen.dart's _loadUserProducts consumes the same endpoint.
export type SavingsType =
  | "SAVE_SMALL_SMALL"
  | "TARGET_SAVINGS"
  | "SMART_LOCK"
  | "BUY_NOW_PAY_LATER";

export type UserProduct = {
  id: string;
  productId: string;
  // BuyNowPayLaterDto has no name/amount/currentBalance fields, so these come back null for
  // BUY_NOW_PAY_LATER rows specifically (confirmed live) - always populated for the other three
  // savings types.
  name: string | null;
  savingsType: SavingsType;
  amount: number | null;
  currentBalance: number | null;
  interestBalance: number;
  status: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null;
  tenor: number | null;
  // When the plan matures (Smart Lock principal is locked until then) and the rate it was given.
  completionDate: string | null;
  assignedInterestRate: number | null;
  created_on: string;
};

// Something still waiting for its bank transfer. While there is, the backend refuses to start a new
// investment, so the create screens send the customer here to finish (or wait out) the open one.
export type PendingFundingItem = {
  planId: string;
  savingsType: "SAVE_SMALL_SMALL" | "TARGET_SAVINGS" | "SMART_LOCK" | string;
  planName: string | null;
  amount: number;
  // Bank-transfer requests carry a reference we can poll; a Smart Lock has none and is polled by its id.
  referenceCode: string | null;
  expiresAt: string;
};

export function getPendingFunding(token: string) {
  return request<PendingFundingItem[]>("/api/savings/pending-funding", { token });
}

export function getUserProducts(token: string) {
  return request<UserProduct[]>("/api/savings/get-user-products", { token });
}

// Raw TransactionHistory rows (wallet funding, savings deposits/withdrawals) - the backend
// returns the entity directly rather than a slimmed-down DTO.
export type TransactionRecord = {
  id: string;
  savingsId: string | null;
  amount: number;
  transactionStatus: string | null;
  transactionType: string | null;
  transactionReason: string | null;
  created_on: string;
};

export function getUserTransactions(token: string) {
  return request<TransactionRecord[]>("/api/providus/get-user-transactions", {
    token,
  });
}

// Web authorization for money movement (the web app has no transaction PIN - that's mobile-only).
// requestTransactionOtp emails/SMSes a one-time code bound to an action and amount and returns
// the session id; the code plus session id are then sent *with* the money call itself, where the
// backend verifies them and only spends the code if the call succeeds. A "INVEST" code covers a
// plan's create + fund pair; "WITHDRAW" covers one withdrawal. The amount must match the call's.
export type TransactionAuth = {
  transaction_otp: string;
  otp_session_id: string;
};

export type TransactionOtpSession = {
  otp_session_id: string;
  expires_in_seconds: number;
  channel: "email" | "sms";
};

export function requestTransactionOtp(
  action: "INVEST" | "WITHDRAW",
  amount: number,
  token: string,
) {
  return request<TransactionOtpSession>("/api/user/transaction-otp/request", {
    method: "POST",
    body: { action, amount },
    token,
  });
}

// The product catalog (one row per savings type, with the backend's own UUID `id` - needed as
// `productId` on every creation call below). SavingsService.getAllProducts sorts BNPL last.
export type ProductCatalogItem = {
  id: string;
  productName: string;
  productCode: string;
};

export function getProducts(token: string) {
  return request<ProductCatalogItem[]>("/api/savings/get-products", { token });
}

// Creation endpoints. Each returns the saved entity, which - like get-user-products - already
// carries the UserProduct-shaped fields (currentBalance, interestBalance, status, etc.), so the
// caller can just call refresh() afterward rather than hand-mapping the response.
export type CreateSssPayload = {
  productId: string;
  name: string;
  amount: number;
  tenor: number;
  // SaveSmallSmallDto.completionDate is a LocalDateTime, so a bare "2027-01-01" is rejected -
  // send "2027-01-01T00:00:00" (the Target Lock and Smart Lock DTOs take a plain date instead).
  completionDate: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
};

export function createSss(
  payload: CreateSssPayload,
  auth: TransactionAuth,
  token: string,
) {
  return request("/api/savings/sss", {
    method: "POST",
    body: { ...payload, ...auth },
    token,
  });
}

export type CreateTargetSavingsPayload = {
  productId: string;
  name: string;
  amount: number;
  completionDate: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
};

export function createTargetSavings(
  payload: CreateTargetSavingsPayload,
  auth: TransactionAuth,
  token: string,
) {
  return request("/api/savings/target-savings", {
    method: "POST",
    body: { ...payload, ...auth },
    token,
  });
}

// A Smart Lock is a lump sum, so (like mobile) no contribution frequency is sent.
export type CreateSmartLockPayload = {
  productId: string;
  name: string;
  amount: number;
  tenor: number;
  completionDate: string;
  fundingType: "WALLET_DEBIT" | "DIRECT_DEPOSIT";
  interestPaymentFrequency: "MONTHLY" | "QUARTERLY" | "SEMI_ANNUALLY" | "AT_MATURITY";
};

export function createSmartLock(
  payload: CreateSmartLockPayload,
  auth: TransactionAuth,
  token: string,
) {
  // DIRECT_DEPOSIT locks come back PENDING_FUNDING with a one-hour fundingExpiryTime.
  return request<{ id: string; fundingExpiryTime: string | null }>("/api/savings/smartlock", {
    method: "POST",
    body: { ...payload, ...auth },
    token,
  });
}

export type CreateBnplPayload = {
  productId: string;
  name: string;
  amount: number;
  tenor: number;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
};

export function createBnpl(
  payload: CreateBnplPayload,
  auth: TransactionAuth,
  token: string,
) {
  return request("/api/savings/bnpl", {
    method: "POST",
    body: { ...payload, ...auth },
    token,
  });
}

// Funding a freshly-created SmallVest/Target Lock plan (Smart Lock bakes its funding choice
// into the creation call above instead - see fundingType). "Wallet" debits the real wallet
// balance immediately; "pending deposit" just registers the expected amount, credited later by
// the same Providus/Flutterwave webhook logic that funds the main wallet.
export function depositToSavings(
  savingsId: string,
  savingsType: SavingsType,
  amount: number,
  auth: TransactionAuth,
  token: string,
) {
  return request("/api/savings/deposit-to-savings", {
    method: "POST",
    body: { savingsId, savingsType, amount, ...auth },
    token,
  });
}

export type PendingDepositInfo = {
  id: string;
  // Shown to the user and quoted back by support; funds are matched to the deposit by exact
  // amount (BankAccountService.accountNotification), not by this reference.
  referenceCode: string;
  savingsType: string;
  savingsName: string;
  expectedAmount: number;
  expiryTime: string;
};

export function createPendingDeposit(
  savingsId: string,
  savingsType: SavingsType,
  amount: number,
  auth: TransactionAuth,
  token: string,
) {
  return request<PendingDepositInfo>("/api/savings/create-pending-deposit", {
    method: "POST",
    body: { savingsId, savingsType, amount, ...auth },
    token,
  });
}

// confirm-deposit is a status poll, not an action: 200 = credited, 202 ("pending" status, which
// request() rejects) = still waiting for the transfer, 400 = expired.
export type PendingDepositState = "completed" | "pending" | "expired";

async function pendingDepositState(
  path: string,
  method: "GET" | "POST",
  token: string,
): Promise<PendingDepositState> {
  try {
    await request(path, { method, token });
    return "completed";
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 202) return "pending";
      if (err.status === 400 && /expired/i.test(err.message)) return "expired";
    }
    throw err;
  }
}

export function getPendingDepositState(referenceCode: string, token: string) {
  return pendingDepositState(
    `/api/savings/confirm-deposit/${encodeURIComponent(referenceCode)}`,
    "GET",
    token,
  );
}

// "I've made the payment": if the transfer already landed in the wallet before this request existed, the
// server moves exactly that amount from the wallet into the plan. Only ever called from the button, never polled.
export function claimPendingDeposit(referenceCode: string, token: string) {
  return pendingDepositState(
    `/api/savings/claim-deposit/${encodeURIComponent(referenceCode)}`,
    "POST",
    token,
  );
}

// Withdrawals aren't supported for BNPL by the backend (SavingsWithdrawDto only accepts the
// other three savings types).
export type WithdrawableSavingsType = Exclude<SavingsType, "BUY_NOW_PAY_LATER">;

export function withdrawFromSavings(
  payload: {
    savingsId: string;
    savingsType: WithdrawableSavingsType;
    amount: number;
    withdrawalSource: "INTEREST_ONLY" | "BOTH";
    bankAccountId: string;
  },
  auth: TransactionAuth,
  token: string,
) {
  // 202/"pending" is a normal outcome here: the money has left the plan but the bank has not
  // confirmed the transfer yet, so callers check response.status instead of assuming success.
  return request("/api/savings/withdraw-from-savings", {
    method: "POST",
    body: { ...payload, ...auth },
    token,
    allowPending: true,
  });
}

export type UserBankAccountRecord = {
  id: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
};

export function getUserBankAccounts(token: string) {
  return request<UserBankAccountRecord[]>("/api/providus/get-user-accounts", {
    token,
  });
}

const TOKEN_KEY = "vesture_token";

export function storeToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable (private mode, disabled cookies) - token stays in-memory for this
    // session via the caller's own state instead.
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clear.
  }
}

// ---------------------------------------------------------------------------------------------
// BuyNow PayLater. Real purchases go through the asset endpoints (a catalogue of items admins
// manage, a preview, a purchase that takes the initial payment from the wallet, and instalments
// paid from the wallet) - not the generic /api/savings/bnpl record createBnpl() above writes.
// ---------------------------------------------------------------------------------------------

export type AssetCategory = {
  id: string;
  name: string;
  description: string | null;
};

export type CatalogAsset = {
  id: string;
  name: string;
  amount: number;
  description: string | null;
  // Longest repayment the backend allows for this item (months).
  maxTenor: number | null;
  availableUnits: number | null;
  // The admin's suggested starting payment; the backend itself only enforces the ₦50,000 floor.
  initialAmount: number | null;
  imageUrl: string | null;
  categoryName: string | null;
};

export function getAssetCategories() {
  return request<AssetCategory[]>("/api/asset/categories");
}

export function getAssetsByCategory(categoryId: string) {
  return request<CatalogAsset[]>(
    `/api/asset/category/${encodeURIComponent(categoryId)}`,
  );
}

export const BNPL_MIN_INITIAL_PAYMENT = 50000;

export type BnplQuote = {
  assetName: string;
  assetAmount: number;
  initialPayment: number;
  remainingBalance: number;
  monthlyPayment: number;
  installmentMonths: number;
  totalRepayment: number;
  maxTenor: number | null;
};

export type BnplPurchasePayload = {
  assetId: string;
  initialPayment: number;
  installmentMonths: number;
};

export function previewBnplPurchase(payload: BnplPurchasePayload, token: string) {
  return request<BnplQuote>("/api/asset/user/purchase-bnpl/preview", {
    method: "POST",
    body: payload,
    token,
  });
}

// The initial payment is debited from the wallet, so the one-time code is bound to that amount.
export function purchaseBnpl(
  payload: BnplPurchasePayload,
  auth: TransactionAuth,
  token: string,
) {
  return request<BnplPurchase>("/api/asset/user/purchase-bnpl", {
    method: "POST",
    body: { ...payload, ...auth },
    token,
  });
}

export type BnplPurchase = {
  id: string;
  name: string | null;
  assetId: string | null;
  amount: number | null; // the item's price
  currentBalance: number | null; // still owed
  initialPayment: number | null;
  monthlyPayment: number | null;
  totalInstallments: number | null;
  paidInstallments: number | null;
  status: string;
  nextPaymentDate: string | null;
  created_on: string;
};

export function getMyPurchases(token: string) {
  return request<BnplPurchase[]>("/api/asset/user/my-purchases", { token });
}

// Any positive amount up to what is still owed; the plan completes when the balance reaches zero.
export function payInstallment(
  purchaseId: string,
  amount: number,
  auth: TransactionAuth,
  token: string,
) {
  return request<BnplPurchase>("/api/asset/user/pay-installment", {
    method: "POST",
    body: { purchaseId, amount, ...auth },
    token,
  });
}

// ---------------------------------------------------------------------------------------------
// Rates and previews, so the app shows what the backend will actually apply.
// ---------------------------------------------------------------------------------------------

export type PublicRate = {
  savingsType: string; // "SSS" | "SmartLock" | "TargetSavings" | "BNPL"
  annualRate: number;
  minTenorDays: number | null;
  maxTenorDays: number | null;
  durationDays: number | null;
};

export function getPublicRates() {
  return request<PublicRate[]>("/api/interest-rate/public/all");
}

// What a plan would earn if created now: the rate the backend would assign and the interest it
// expects. Smart Lock figures are already net of withholding tax.
export type SavingsPreview = {
  assignedInterestRate: number | null;
  expectedInterestAmount: number | null;
  withholdingTax: number | null;
};

export function previewSss(payload: CreateSssPayload, token: string) {
  return request<SavingsPreview>("/api/savings/sss/preview", {
    method: "POST",
    body: payload,
    token,
  });
}

export function previewTargetSavings(payload: CreateTargetSavingsPayload, token: string) {
  return request<SavingsPreview>("/api/savings/target-savings/preview", {
    method: "POST",
    body: payload,
    token,
  });
}

export function previewSmartLock(payload: CreateSmartLockPayload, token: string) {
  return request<SavingsPreview>("/api/savings/smartlock/preview", {
    method: "POST",
    body: payload,
    token,
  });
}

// Adds wallet money to an active Smart Lock. This endpoint takes query parameters, not a body.
export function addFundsToSmartLock(
  smartLockId: string,
  amount: number,
  auth: TransactionAuth,
  token: string,
) {
  const query = new URLSearchParams({
    smartLockId,
    amount: String(amount),
    transaction_otp: auth.transaction_otp,
    otp_session_id: auth.otp_session_id,
  });
  return request(`/api/savings/smartlock/add-funds?${query.toString()}`, {
    method: "POST",
    token,
  });
}

// ---- KYC (identity verification) ------------------------------------------------------------
// Four steps, done in order: a live selfie, the NIN, an ID document (its face is compared with the
// selfie) and the home address. The backend keeps the selfie itself and uses its own copy for the
// comparisons, so a photo is only ever sent once. A step that Prembly rejects comes back as a
// "failed" response, which `request` throws as an ApiError carrying the customer-safe message.
export type KycStepName = "LIVENESS" | "NIN" | "DOCUMENT" | "ADDRESS";
export type KycStepState = {
  step: KycStepName;
  status: "NOT_STARTED" | "SUBMITTED" | "PENDING" | "VERIFIED" | "FAILED" | "ERROR";
  message: string | null;
  attemptsLeft: number;
  canStart: boolean;
};
export type KycStatus = {
  steps: KycStepState[];
  nextStep: KycStepName | null;
  tier: 1 | 2 | 3;
  bankOne: { tier2: string; tier3: string };
  ninMasked?: string;
};
export type KycStepResult = { step: string; status: string; passed: boolean };

export function getKycStatus(token: string) {
  return request<KycStatus>("/api/kyc/status", { token });
}

// `meta` says which actions the guided check asked for (blink, turn left ...) and how long it took; it is kept on
// the record so staff can see it. Older callers may leave it out.
export function submitKycLiveness(
  image: string,
  token: string,
  meta?: { challenges: string[]; durationMs: number },
) {
  return request<KycStepResult>("/api/kyc/liveness", {
    method: "POST",
    body: { image, ...(meta ? { challenges: meta.challenges, durationMs: meta.durationMs } : {}) },
    token,
  });
}

export function submitKycNin(nin: string, token: string) {
  return request<KycStepResult>("/api/kyc/nin", { method: "POST", body: { nin }, token });
}

export function submitKycDocument(docType: "ID" | "DL" | "PP", image: string, token: string) {
  return request<KycStepResult>("/api/kyc/document", { method: "POST", body: { docType, image }, token });
}

export type KycAddressPayload = {
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  lga: string;
  landmark: string;
};

export function submitKycAddress(payload: KycAddressPayload, token: string) {
  return request<KycStepResult>("/api/kyc/address", { method: "POST", body: payload, token });
}

export function refreshKycAddress(token: string) {
  return request<KycStepResult>("/api/kyc/address/refresh", { method: "POST", token });
}

// A new plan needs the customer's identity verified (the ID step of KYC) and a withdrawal bank account saved.
// The backend enforces it on every create endpoint; this is what the screens use to show what is missing.
export type InvestmentEligibility = {
  required: boolean;
  identityVerified: boolean;
  bankSet: boolean;
  eligible: boolean;
  missing: ("IDENTITY" | "BANK_ACCOUNT")[];
};

export function getInvestmentEligibility(token: string) {
  return request<InvestmentEligibility>("/api/kyc/eligibility", { token });
}

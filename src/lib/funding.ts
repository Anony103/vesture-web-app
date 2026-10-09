import type { CurrentUser } from "./api";

export type FundingAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
};

// Where the user sends money to fund their wallet or a plan by bank transfer. Mirrors mobile,
// which prefers the Providus account; falls back to the Flutterwave one when that's the only one
// that was created. Null when neither exists (creation failed or hasn't completed) - callers
// must say so instead of showing a made-up number.
export function getFundingAccount(user: CurrentUser): FundingAccount | null {
  const accountName = `${user.firstName} ${user.lastName}`.trim();
  if (user.providusAccountNumber && user.hasProvidusAccount === "00") {
    return {
      bankName: user.virtualAccountBankName ?? "Providus Bank",
      accountNumber: user.providusAccountNumber,
      accountName,
    };
  }
  if (user.flutterWaveAccountNumber && user.hasFlutterWaveAccount === "00") {
    return {
      bankName: user.virtualAccountBankName ?? "Virtual account",
      accountNumber: user.flutterWaveAccountNumber,
      accountName,
    };
  }
  return null;
}

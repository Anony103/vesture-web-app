"use client";
import { useState } from "react";
import {
  ApiError,
  getToken,
  requestTransactionOtp,
  type TransactionAuth,
  type TransactionOtpSession,
} from "@/lib/api";
import { SECURITY_OTP_LENGTH } from "./use-security-otp";

// Requests a one-time code bound to an action and amount, and holds the session until the user
// types the code. Nothing is verified here: the code and session id travel with the money call
// itself (see TransactionAuth in api.ts), and the backend verifies them there.
export function useTransactionOtp(action: "INVEST" | "WITHDRAW", amount: number) {
  const [session, setSession] = useState<TransactionOtpSession | null>(null);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function sendCode() {
    const token = getToken();
    if (!token) return;
    setSending(true);
    setError("");
    try {
      const response = await requestTransactionOtp(action, amount, token);
      setSession(response.data);
      setOtp("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send a code.");
    } finally {
      setSending(false);
    }
  }

  const ready =
    session !== null && new RegExp(`^\\d{${SECURITY_OTP_LENGTH}}$`).test(otp);

  function auth(): TransactionAuth | null {
    return session && ready
      ? { transaction_otp: otp, otp_session_id: session.otp_session_id }
      : null;
  }

  return {
    session,
    sent: session !== null,
    destination: session?.channel === "sms" ? "your registered phone" : "your email",
    otp,
    setOtp,
    sending,
    error,
    setError,
    sendCode,
    ready,
    auth,
  };
}

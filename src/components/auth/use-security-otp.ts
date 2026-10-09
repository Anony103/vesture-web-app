"use client";
import { useState } from "react";
import { useCurrentUser } from "./auth-guard";
import {
  ApiError,
  getToken,
  requestSecurityOtp,
  verifySecurityOtp,
} from "@/lib/api";

export const SECURITY_OTP_LENGTH = 6;

// UserService.requestSecurityChangeOtp stores a one-time code on the user (emailed for
// private-sector users, SMS'd for public-sector) and verifySecurityChangeOtp clears it once
// matched. Used for password changes; money movement uses useTransactionOtp instead.
export function useSecurityOtp(action: "password") {
  const { user } = useCurrentUser();
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function sendCode() {
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    setError("");
    try {
      await requestSecurityOtp(action, token);
      setOtp("");
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send a code.");
    } finally {
      setSubmitting(false);
    }
  }

  // Resolves true on success so callers can chain the action it was gating.
  async function verify(): Promise<boolean> {
    const token = getToken();
    if (!token) return false;
    setSubmitting(true);
    setError("");
    try {
      await verifySecurityOtp(otp, token);
      setVerified(true);
      return true;
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not verify that code.",
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  const destination =
    user.sectorPP?.toLowerCase() === "public"
      ? "your registered phone"
      : "your email";

  return {
    sent,
    verified,
    otp,
    setOtp,
    submitting,
    error,
    setError,
    sendCode,
    verify,
    destination,
  };
}

"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { Notice } from "@/components/ui/notice";
import { ApiError, type TransactionAuth } from "@/lib/api";
import { SECURITY_OTP_LENGTH } from "@/components/auth/use-security-otp";
import { useTransactionOtp } from "@/components/auth/use-transaction-otp";

// Authorizes a money action with a one-time code instead of a PIN. The code is sent as soon as
// this form mounts (so mount it only once the user has committed to the action), then: enter code ->
// submit. The code is verified by the backend as part of the money call itself (`onAuthorized`
// receives the credentials to attach), and is only spent if that call succeeds - so a wrong code
// or a failed transfer just shows the error and the same code can be retried.
export function TransactionOtpForm({
  action,
  amount,
  onAuthorized,
  submitLabel = "Verify & continue",
  tone = "primary",
}: {
  action: "INVEST" | "WITHDRAW";
  amount: number;
  onAuthorized: (auth: TransactionAuth) => Promise<void>;
  submitLabel?: string;
  tone?: "primary" | "danger";
}) {
  const otpStep = useTransactionOtp(action, amount);
  const [running, setRunning] = useState(false);
  const started = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Ref-guarded so React StrictMode's dev double-mount doesn't request two codes.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    otpStep.sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Put the cursor in the first digit as soon as the code entry appears.
  useEffect(() => {
    if (otpStep.sent) formRef.current?.querySelector("input")?.focus();
  }, [otpStep.sent]);

  if (!otpStep.sent) {
    // No error yet means the code is still on its way (including the frame before the mount
    // effect fires), so never flash the failure state at the user.
    if (!otpStep.error) {
      return (
        <p className="text-center text-sm text-subtle">
          Sending your verification code…
        </p>
      );
    }
    return (
      <div className="space-y-4">
        <p className="text-sm text-subtle">
          We couldn&apos;t send your {SECURITY_OTP_LENGTH}-digit verification
          code. Try again to authorize this transaction.
        </p>
        <Button
          fullWidth
          size="lg"
          variant={tone}
          disabled={otpStep.sending}
          onClick={otpStep.sendCode}
        >
          {otpStep.sending ? "Sending…" : "Try again"}
        </Button>
        {otpStep.error && <Notice tone="error">{otpStep.error}</Notice>}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const auth = otpStep.auth();
        if (!auth) return;
        setRunning(true);
        otpStep.setError("");
        try {
          await onAuthorized(auth);
        } catch (err) {
          otpStep.setError(
            err instanceof ApiError ? err.message : "Could not complete this action.",
          );
        } finally {
          setRunning(false);
        }
      }}
    >
      <p className="text-center text-sm text-subtle">
        Enter the {SECURITY_OTP_LENGTH}-digit code sent to {otpStep.destination}.
      </p>
      <OtpInput
        value={otpStep.otp}
        onChange={(value) => {
          otpStep.setOtp(value);
          otpStep.setError("");
        }}
        length={SECURITY_OTP_LENGTH}
        invalid={!!otpStep.error}
      />
      <Button
        fullWidth
        size="lg"
        type="submit"
        variant={tone}
        disabled={running || !otpStep.ready}
      >
        {running ? "Processing…" : submitLabel}
      </Button>
      <Button
        type="button"
        variant="ghost"
        fullWidth
        disabled={running || otpStep.sending}
        onClick={otpStep.sendCode}
      >
        Resend code
      </Button>
      {otpStep.error && <Notice tone="error">{otpStep.error}</Notice>}
    </form>
  );
}

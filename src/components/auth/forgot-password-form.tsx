"use client";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { FormHeading } from "@/components/ui/form-heading";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { OtpInput } from "@/components/ui/otp-input";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import {
  ApiError,
  forgotPassword,
  resendPasswordResetOtp,
  resetPassword,
  verifyPasswordResetOtp,
} from "@/lib/api";

const OTP_LENGTH = 6;

type Step = "email" | "otp" | "password" | "done";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await forgotPassword(email.trim());
      setStep("otp");
      setNotice(`We've sent a ${OTP_LENGTH}-digit code to ${email.trim()}.`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not send a reset code.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setSubmitting(true);
    setError("");
    try {
      await resendPasswordResetOtp(email.trim());
      setNotice("A new code has been sent to your email.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not resend the code.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      // Checked server-side here, unlike the signup verify screen.
      await verifyPasswordResetOtp(email.trim(), otp);
      setStep("password");
      setNotice("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not verify that code.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmation) {
      setError("Your passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await resetPassword(email.trim(), password, confirmation);
      setPassword("");
      setConfirmation("");
      setStep("done");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not reset your password.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      {step === "email" && (
        <>
          <FormHeading
            title="Forgot your password?"
            description="Enter the email address associated with your account."
          />
          <form className="mt-6 space-y-5" onSubmit={handleEmailSubmit}>
            <Input
              label="Email Address"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Enter Email Address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Button fullWidth type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send reset code"}
            </Button>
            {error && <Notice tone="error">{error}</Notice>}
          </form>
        </>
      )}

      {step === "otp" && (
        <>
          <FormHeading
            title="Enter the code"
            description={`We've sent a ${OTP_LENGTH}-digit code to ${email}.`}
          />
          <form className="mt-6 space-y-5" onSubmit={handleOtpSubmit}>
            <OtpInput value={otp} onChange={setOtp} length={OTP_LENGTH} />
            <Button
              fullWidth
              type="submit"
              disabled={
                submitting || !new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otp)
              }
            >
              {submitting ? "Verifying…" : "Verify code"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              disabled={submitting}
              onClick={handleResend}
            >
              Resend code
            </Button>
            {notice && !error && <Notice>{notice}</Notice>}
            {error && <Notice tone="error">{error}</Notice>}
          </form>
        </>
      )}

      {step === "password" && (
        <>
          <FormHeading
            title="Set a new password"
            description="Choose a new password for your account."
          />
          <form className="mt-6 space-y-5" onSubmit={handlePasswordSubmit}>
            <PasswordInput
              label="New Password"
              placeholder="Enter New Password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              minLength={8}
              required
              hint="Note: Make sure your password is at least 8 characters long."
            />
            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm New Password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => {
                setConfirmation(event.target.value);
                setError("");
              }}
              minLength={8}
              required
            />
            <Button fullWidth type="submit" disabled={submitting}>
              {submitting ? "Resetting…" : "Reset password"}
            </Button>
            {error && <Notice tone="error">{error}</Notice>}
          </form>
        </>
      )}

      {step === "done" && (
        <>
          <FormHeading
            title="Password reset"
            description="Your password has been changed. Sign in with your new password."
          />
          <Link href="/" className="mt-6 block">
            <Button fullWidth>Back to sign in</Button>
          </Link>
        </>
      )}

      {step !== "done" && (
        <Link
          href="/"
          className="mt-6 block text-center text-xs text-lavender hover:underline"
        >
          Back to sign in
        </Link>
      )}
    </Card>
  );
}

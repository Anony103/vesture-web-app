"use client";
import { useState } from "react";
import { SettingsLayout } from "./settings-layout";
import { PasswordInput } from "@/components/ui/password-input";
import { OtpInput } from "@/components/ui/otp-input";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import {
  SECURITY_OTP_LENGTH as OTP_LENGTH,
  useSecurityOtp,
} from "@/components/auth/use-security-otp";
import {
  ApiError,
  getToken,
  updatePassword as updatePasswordRequest,
} from "@/lib/api";

export function ChangePassword() {
  const otpStep = useSecurityOtp("password");
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!otpStep.sent) {
    return (
      <SettingsLayout
        title="Change password"
        description="We'll send a verification code before you can change your password."
      >
        <Button fullWidth onClick={otpStep.sendCode} disabled={otpStep.submitting}>
          {otpStep.submitting ? "Sending…" : "Send verification code"}
        </Button>
        {otpStep.error && <Notice tone="error">{otpStep.error}</Notice>}
      </SettingsLayout>
    );
  }

  if (!otpStep.verified) {
    return (
      <SettingsLayout
        title="Enter the code"
        description={`We've sent a ${OTP_LENGTH}-digit code to ${otpStep.destination}.`}
      >
        <form className="space-y-5" onSubmit={otpStep.verify}>
          <OtpInput value={otpStep.otp} onChange={otpStep.setOtp} length={OTP_LENGTH} />
          <Button
            fullWidth
            type="submit"
            disabled={
              otpStep.submitting ||
              !new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otpStep.otp)
            }
          >
            {otpStep.submitting ? "Verifying…" : "Verify code"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            disabled={otpStep.submitting}
            onClick={otpStep.sendCode}
          >
            Resend code
          </Button>
          {otpStep.error && <Notice tone="error">{otpStep.error}</Notice>}
        </form>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Change password">
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaved(false);
          if (password !== confirm) {
            setError("Passwords do not match.");
            return;
          }
          const token = getToken();
          if (!token) return;
          setSaving(true);
          setError("");
          try {
            await updatePasswordRequest(current, password, token);
            setCurrent("");
            setPassword("");
            setConfirm("");
            setSaved(true);
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Could not change your password.",
            );
          } finally {
            setSaving(false);
          }
        }}
      >
        <PasswordInput
          label="Current Password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            setSaved(false);
          }}
          required
          variant="filled"
          autoComplete="current-password"
        />
        <PasswordInput
          label="New Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setSaved(false);
          }}
          minLength={8}
          hint="Use at least 8 characters."
          required
          variant="filled"
          autoComplete="new-password"
        />
        <PasswordInput
          label="Confirm New Password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setError("");
            setSaved(false);
          }}
          required
          variant="filled"
          autoComplete="new-password"
        />
        <Button type="submit" fullWidth disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        {saved && <Notice>Password changed.</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
      </form>
    </SettingsLayout>
  );
}

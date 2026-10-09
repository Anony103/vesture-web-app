"use client";
import { useEffect, useState } from "react";
import { useAccount } from "./account-provider";
import { useCurrentUser } from "@/components/auth/auth-guard";
import { useInvestments } from "@/components/investments/investment-provider";
import { SettingsLayout } from "./settings-layout";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import {
  ApiError,
  getBanks,
  getToken,
  resolveBankAccount,
  saveBankAccount,
  updateProfile as updateProfileRequest,
  type BankOption,
} from "@/lib/api";
export function PersonalInformation() {
  const { profile } = useAccount();
  const { user, refreshUser } = useCurrentUser();
  const [phone, setPhone] = useState(profile.phone);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [state, setState] = useState(profile.state);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  return (
    <SettingsLayout
      title="Basic Information"
      description="Your name and email can't be changed here - contact support if either is wrong."
    >
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const token = getToken();
          if (!token) return;
          setSaving(true);
          setError("");
          setSaved(false);
          try {
            await updateProfileRequest(
              user.id,
              { phoneNumber: phone.trim(), dateOfBirth: birthDate, state },
              token,
            );
            await refreshUser();
            setSaved(true);
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Could not save your changes.",
            );
          } finally {
            setSaving(false);
          }
        }}
      >
        <Input
          label="Full Name"
          value={profile.name}
          readOnly
          variant="filled"
        />
        <Input
          label="Email Address"
          type="email"
          value={profile.email}
          readOnly
          variant="filled"
        />
        <Input
          label="Phone Number"
          type="tel"
          pattern="[+0-9 ()-]{7,20}"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setSaved(false);
          }}
          required
          variant="filled"
        />
        <Input
          label="Date of Birth"
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          value={birthDate}
          onChange={(e) => {
            setBirthDate(e.target.value);
            setSaved(false);
          }}
          required
          variant="filled"
        />
        <Input
          label="State of Residence"
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            setSaved(false);
          }}
          required
          variant="filled"
        />
        <Button type="submit" fullWidth disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        {saved && <Notice>Profile updated.</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
      </form>
    </SettingsLayout>
  );
}
export function BankAccount() {
  const { updateBank } = useAccount();
  const { completeProfile } = useInvestments();
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    getBanks(token)
      .then((response) => {
        // The bank list has duplicate names with different codes (e.g. two "TCF MFB"
        // entries) - keep the first of each so the name -> code lookup below stays
        // unambiguous and <option> keys stay unique.
        const seen = new Set<string>();
        const unique = response.data.filter((bank) => {
          if (seen.has(bank.name)) return false;
          seen.add(bank.name);
          return true;
        });
        setBanks(unique);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load the bank list.",
        );
      })
      .finally(() => setLoadingBanks(false));
  }, []);

  // Auto-verify once both a bank and a full 10-digit account number are present, matching
  // BankAccountDetailsScreen's _autoVerifyAccount on mobile.
  useEffect(() => {
    if (bankCode && accountNumber.length === 10) {
      verifyAccount();
    }
    // Only re-run when the bank or account number actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankCode, accountNumber]);

  async function verifyAccount() {
    const token = getToken();
    if (!token || !bankCode || accountNumber.length !== 10) return;
    setVerifying(true);
    setError("");
    setAccountName("");
    try {
      const response = await resolveBankAccount(accountNumber, bankCode, token);
      setAccountName(response.data.accountName);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not verify this account.",
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;
    if (!accountName) {
      setError("Select a bank and enter a valid account number first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveBankAccount(accountNumber, bankCode, accountName, token);
      updateBank({ name: bankName, number: accountNumber, holder: accountName });
      completeProfile();
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not save your bank account.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsLayout
      title="Bank Account Details"
      description="Link your bank account for interest withdrawals. You can also set this up later in Settings."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Select
          label="Bank Name"
          options={banks.map((option) => option.name)}
          placeholder={loadingBanks ? "Loading banks…" : "Select your bank"}
          variant="filled"
          value={bankName}
          disabled={loadingBanks}
          onChange={(e) => {
            const selected = banks.find((b) => b.name === e.target.value);
            setBankName(e.target.value);
            setBankCode(selected?.code ?? "");
            setAccountName("");
            setSaved(false);
            setError("");
          }}
          required
        />
        <Input
          label="Account Number"
          value={accountNumber}
          onChange={(e) => {
            setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
            setAccountName("");
            setSaved(false);
            setError("");
          }}
          inputMode="numeric"
          maxLength={10}
          pattern="[0-9]{10}"
          variant="filled"
          required
        />
        <Input
          label="Account Name"
          value={
            verifying ? "Verifying…" : accountName
          }
          readOnly
          variant="filled"
          hint="Resolved automatically from your bank and account number - it can't be edited."
          placeholder="Will appear once your account is verified"
        />
        <Button
          fullWidth
          type="submit"
          disabled={saving || verifying || !accountName}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        {saved && <Notice>Bank account linked successfully.</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
      </form>
    </SettingsLayout>
  );
}

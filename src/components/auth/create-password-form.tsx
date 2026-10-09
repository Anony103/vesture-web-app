"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { FormHeading } from "@/components/ui/form-heading";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Notice } from "@/components/ui/notice";
import { useOnboarding } from "./onboarding-provider";
import { ApiError, completeSignup, fileToDataUri } from "@/lib/api";

export function CreatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const {
    accountType,
    profile,
    signupId,
    otp,
    ippisNo,
    organization,
    identity,
    avatar,
  } = useOnboarding();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmation) {
      setError("Your passwords do not match.");
      return;
    }
    if (!signupId) {
      setError("Your registration session expired. Please start over.");
      return;
    }
    setSubmitting(true);
    setError("");
    const isPublicSector = accountType === "public";
    try {
      // Field mapping (supportingDocument = identity/staff-ID doc, ninDocument = profile
      // photo) matches PublicSetPasswordScreen/SetPasswordScreen in the mobile app exactly.
      const supportingDocument = identity
        ? await fileToDataUri(identity)
        : undefined;
      const ninDocument = avatar ? await fileToDataUri(avatar) : undefined;
      await completeSignup({
        signupId,
        otp,
        firstName: profile.firstName.trim(),
        middleName: profile.middleName.trim(),
        lastName: profile.lastName.trim(),
        email: profile.email.trim(),
        password,
        phoneNumber: profile.phone.trim(),
        device: "web",
        channel: "web",
        sectorPP: isPublicSector ? "Public" : "Private",
        bvn: profile.bvn.trim(),
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        stateOfOrigin: profile.stateOfOrigin,
        homeAddress: profile.address.trim(),
        ...(isPublicSector
          ? { ippisNo: ippisNo.trim(), organization }
          : {}),
        ...(supportingDocument ? { supportingDocument } : {}),
        ...(ninDocument ? { ninDocument } : {}),
      });
      setPassword("");
      setConfirmation("");
      router.push("/signup/complete");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not create your account. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <FormHeading
        title="Set a password"
        description="You need to secure your account by setting up a strong password for your account."
      />
      <form className="mt-5 space-y-[15px]" onSubmit={handleSubmit}>
        <PasswordInput
          label="Enter Password"
          placeholder="Enter Password"
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
          placeholder="Enter Password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => {
            setConfirmation(event.target.value);
            setError("");
          }}
          minLength={8}
          required
        />
        <Button fullWidth type="submit" className="mt-1" disabled={submitting}>
          {submitting ? "Creating your account…" : "Continue"}
        </Button>
        {error && <Notice tone="error">{error}</Notice>}
      </form>
    </Card>
  );
}

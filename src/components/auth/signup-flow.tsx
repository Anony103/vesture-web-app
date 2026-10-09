"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { steps, type SignupStep } from "@/lib/onboarding";
import { useOnboarding } from "./onboarding-provider";
import { AccountTypeForm } from "./account-type-form";
import { DetailsForm } from "./details-form";
import { VerifyForm } from "./verify-form";
import { IdentityForm } from "./identity-form";
import { ReviewForm } from "./review-form";
import { CreatePasswordForm } from "./create-password-form";
import { CompletionCard } from "./completion-card";
const screens = {
  "account-type": AccountTypeForm,
  details: DetailsForm,
  verify: VerifyForm,
  identity: IdentityForm,
  review: ReviewForm,
  password: CreatePasswordForm,
  complete: CompletionCard,
};
export function SignupFlow({ step }: { step: SignupStep }) {
  const { accountType, profile, verified, identity, consent } = useOnboarding();
  const router = useRouter();
  const index = steps.indexOf(step);
  const redirect =
    index > 0 && !accountType
      ? "account-type"
      : index > 1 && !profile.email
        ? "details"
        : index > 2 && !verified
          ? "verify"
          : index > 3 && !identity
            ? "identity"
            : index > 4 && !consent
              ? "review"
              : null;
  useEffect(() => {
    if (redirect) router.replace(`/signup/${redirect}`);
  }, [redirect, router]);
  const Screen = screens[step];
  return (
    <>
      <nav
        aria-label="Registration navigation"
        className="absolute top-5 left-5 sm:top-7 sm:left-8"
      >
        <Link
          href={
            index === 0 || step === "complete"
              ? "/"
              : `/signup/${steps[index - 1]}`
          }
          className="rounded px-1 py-2 text-xs text-muted hover:text-lilac"
        >
          ← {index === 0 || step === "complete" ? "Back to sign in" : "Back"}
        </Link>
      </nav>
      {redirect ? (
        <p role="status" className="text-sm text-muted">
          Returning to your current step…
        </p>
      ) : (
        <Screen />
      )}
    </>
  );
}

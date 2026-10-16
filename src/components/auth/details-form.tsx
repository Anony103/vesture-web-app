"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { states, type Profile } from "@/lib/onboarding";
import { useOnboarding } from "./onboarding-provider";
import { AvatarUpload } from "./avatar-upload";
import { ApiError, startSignup, validateIppis } from "@/lib/api";

export function DetailsForm() {
  const {
    accountType,
    profile,
    setProfile,
    avatar,
    setAvatar,
    verified,
    setVerified,
    setConsent,
    ippisNo,
    setIppisNo,
    organization,
    setOrganization,
    setSignupId,
    setOtp,
  } = useOnboarding();
  const router = useRouter();
  const [checkingIppis, setCheckingIppis] = useState(false);
  const [ippisError, setIppisError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isPublicSector = accountType === "public";

  const field = (key: keyof Profile) => ({
    value: profile[key],
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
      setProfile((current) => ({ ...current, [key]: event.target.value }));
      setConsent(false);
      if (key === "phone" || key === "email") setVerified(false);
    },
  });

  async function handleValidateIppis() {
    if (!ippisNo.trim()) return;
    setCheckingIppis(true);
    setIppisError("");
    try {
      const response = await validateIppis(ippisNo.trim());
      setOrganization(response.data.employerOrganization);
    } catch (err) {
      setOrganization("");
      setIppisError(
        err instanceof ApiError
          ? err.message
          : "Could not validate this IPPIS number.",
      );
    } finally {
      setCheckingIppis(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (verified) {
      // Already started signup once; just editing details before review - no need to
      // restart the OTP flow.
      router.push("/signup/review");
      return;
    }
    if (isPublicSector && !organization) {
      setError("Validate your IPPIS number before continuing.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await startSignup({
        firstName: profile.firstName.trim(),
        middleName: profile.middleName.trim(),
        lastName: profile.lastName.trim(),
        bvn: profile.bvn.trim(),
        email: profile.email.trim(),
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        stateOfOrigin: profile.stateOfOrigin,
        phoneNumber: profile.phone.trim(),
        device: "web",
        channel: "web",
        sectorPP: isPublicSector ? "Public" : "Private",
        ...(isPublicSector ? { ippisNo: ippisNo.trim() } : {}),
      });
      setSignupId(response.data.signupId);
      setOtp("");
      router.push("/signup/verify");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not start registration. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="w-full max-w-[721px]" onSubmit={handleSubmit}>
      <h1 className="sr-only">Your personal details</h1>
      <AvatarUpload file={avatar} onChange={setAvatar} />

      {isPublicSector && (
        <div className="mt-10 grid gap-x-[15px] gap-y-[15px] sm:grid-cols-2">
          <Input
            label="IPPIS Number (Staff ID)"
            name="ippisNo"
            placeholder="Enter IPPIS Number"
            required
            value={ippisNo}
            onChange={(event) => {
              setIppisNo(event.target.value);
              setOrganization("");
              setIppisError("");
            }}
            error={ippisError}
            trailing={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleValidateIppis}
                disabled={checkingIppis || !ippisNo.trim()}
              >
                {checkingIppis ? "Checking…" : "Validate"}
              </Button>
            }
          />
          <Input
            label="Institution/Organization"
            name="organization"
            placeholder="Institution will appear after validation"
            value={organization}
            readOnly
          />
        </div>
      )}

      <div className="mt-10 grid gap-x-[15px] gap-y-[15px] sm:grid-cols-2">
        <Input
          label="First Name"
          name="firstName"
          placeholder="Enter First Name"
          autoComplete="given-name"
          required
          {...field("firstName")}
        />
        <Input
          label="Last Name"
          name="lastName"
          placeholder="Enter Last Name"
          autoComplete="family-name"
          required
          {...field("lastName")}
        />
        <Input
          label="Middle Name"
          name="middleName"
          placeholder="Enter Middle Name (optional)"
          autoComplete="additional-name"
          wrapperClassName="sm:col-span-2"
          {...field("middleName")}
        />
        <Input
          label="Bank Verification Number (BVN)"
          name="bvn"
          placeholder="Enter your 11-digit BVN"
          inputMode="numeric"
          pattern="[0-9]{11}"
          title="Enter exactly 11 digits"
          maxLength={11}
          required
          {...field("bvn")}
        />
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="Enter Email Address"
          autoComplete="email"
          required
          {...field("email")}
        />
        <Select
          label="Gender"
          name="gender"
          placeholder="Select Gender"
          options={["Female", "Male", "Prefer not to say"]}
          required
          {...field("gender")}
        />
        <Input
          label="Date of Birth"
          name="dateOfBirth"
          type="date"
          autoComplete="bday"
          max={new Date().toISOString().slice(0, 10)}
          required
          {...field("dateOfBirth")}
        />
        <Select
          label="State of Origin"
          name="stateOfOrigin"
          placeholder="Select State of Origin"
          options={states}
          required
          {...field("stateOfOrigin")}
        />
        <Input
          label="Phone Number"
          name="phone"
          type="tel"
          placeholder="Enter Phone Number"
          autoComplete="tel"
          pattern="[+]?[0-9]{10,15}"
          title="Enter 10 to 15 digits, optionally starting with +"
          required
          wrapperClassName="sm:col-span-2"
          {...field("phone")}
        />
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={submitting}
        className="mt-10 min-h-[54px] border border-white/60 text-[15px]"
      >
        {submitting
          ? "Please wait…"
          : verified
            ? "Save changes"
            : "Next"}
      </Button>
      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
    </form>
  );
}

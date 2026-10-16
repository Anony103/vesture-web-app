"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { FormHeading } from "@/components/ui/form-heading";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { useOnboarding } from "./onboarding-provider";

const OTP_LENGTH = 6;

export function VerifyForm() {
  const { profile, otp, setOtp, setVerified } = useOnboarding();
  const [seconds, setSeconds] = useState(23);
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <Card className="border-transparent">
      <FormHeading
        title="Verify your Account"
        description={`Enter the ${OTP_LENGTH}-digit code sent to ${profile.email || "your email"}.`}
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          // The code is checked server-side when the password step calls
          // /auth/complete-signup, not here - this screen only collects it, matching
          // PublicVerifyAccountScreen/VerifyAccountScreen in the mobile app.
          setVerified(true);
          router.push("/signup/review");   // was "/signup/identity" - that step is switched off
        }}
      >
        <p
          aria-label="Time until you can resend"
          className="mt-5 text-center font-mono text-[30px] font-bold"
        >
          00:{String(seconds).padStart(2, "0")}
        </p>
        <div className="mt-10">
          <OtpInput value={otp} onChange={setOtp} length={OTP_LENGTH} />
        </div>
        <p className="mt-10 text-center text-sm">
          Didn&apos;t receive the code?{" "}
          <Button
            variant="ghost"
            size="sm"
            className="min-h-0 p-0 text-white"
            disabled={seconds > 0}
            onClick={() => {
              setSeconds(23);
              setOtp("");
            }}
          >
            Resend
          </Button>
        </p>
        <Button
          fullWidth
          type="submit"
          className="mt-5"
          disabled={!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otp)}
        >
          Verify Account
        </Button>
      </form>
    </Card>
  );
}

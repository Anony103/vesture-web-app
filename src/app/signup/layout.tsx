import { OnboardingProvider } from "@/components/auth/onboarding-provider";
import { AuthShell } from "@/components/auth/auth-shell";
export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingProvider>
      <AuthShell>{children}</AuthShell>
    </OnboardingProvider>
  );
}

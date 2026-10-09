"use client";
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";
import { emptyProfile, type AccountType, type Profile } from "@/lib/onboarding";
type OnboardingState = {
  accountType: AccountType | null;
  setAccountType: Dispatch<SetStateAction<AccountType | null>>;
  profile: Profile;
  setProfile: Dispatch<SetStateAction<Profile>>;
  identity: File | null;
  setIdentity: Dispatch<SetStateAction<File | null>>;
  avatar: File | null;
  setAvatar: Dispatch<SetStateAction<File | null>>;
  verified: boolean;
  setVerified: Dispatch<SetStateAction<boolean>>;
  consent: boolean;
  setConsent: Dispatch<SetStateAction<boolean>>;
  // Public-sector only: IPPIS number and the organization it resolves to via
  // GET /api/user/auth/employer-info/{ippisNumber}, mirroring StaffInformationScreen.
  ippisNo: string;
  setIppisNo: Dispatch<SetStateAction<string>>;
  organization: string;
  setOrganization: Dispatch<SetStateAction<string>>;
  // Set once /auth/start-signup succeeds; required by /auth/complete-signup.
  signupId: string | null;
  setSignupId: Dispatch<SetStateAction<string | null>>;
  // Captured on the verify screen but only checked server-side when complete-signup is
  // called from the password step - the verify screen itself never calls the backend,
  // matching PublicVerifyAccountScreen/VerifyAccountScreen in the mobile app.
  otp: string;
  setOtp: Dispatch<SetStateAction<string>>;
};
const OnboardingContext = createContext<OnboardingState | null>(null);
export function OnboardingProvider({ children }: { children: ReactNode }) {
  // Sensitive registration data stays in memory, never localStorage or URLs.
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [identity, setIdentity] = useState<File | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [verified, setVerified] = useState(false);
  const [consent, setConsent] = useState(false);
  const [ippisNo, setIppisNo] = useState("");
  const [organization, setOrganization] = useState("");
  const [signupId, setSignupId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  return (
    <OnboardingContext.Provider
      value={{
        accountType,
        setAccountType,
        profile,
        setProfile,
        identity,
        setIdentity,
        avatar,
        setAvatar,
        verified,
        setVerified,
        consent,
        setConsent,
        ippisNo,
        setIppisNo,
        organization,
        setOrganization,
        signupId,
        setSignupId,
        otp,
        setOtp,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context)
    throw new Error("Use onboarding components within OnboardingProvider.");
  return context;
}

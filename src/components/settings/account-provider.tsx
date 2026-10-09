"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useCurrentUser } from "@/components/auth/auth-guard";
export type Profile = {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  state: string;
};
export type Bank = { name: string; number: string; holder: string };
export type Preferences = {
  push: boolean;
  email: boolean;
  offers: boolean;
  investments: boolean;
  tips: boolean;
};
const initialProfile: Profile = {
  name: "Joy Oyeledun",
  email: "joy@example.com",
  phone: "+2348057586234",
  birthDate: "1995-07-15",
  state: "Abuja",
};
const initialPreferences: Preferences = {
  push: false,
  email: false,
  offers: true,
  investments: true,
  tips: true,
};
type State = {
  profile: Profile;
  bank: Bank;
  preferences: Preferences;
  twoFactor: boolean;
  updateProfile: (value: Profile) => void;
  updateBank: (value: Bank) => void;
  updatePreferences: (value: Preferences) => void;
  setTwoFactor: (value: boolean) => void;
  resetAccount: () => void;
};
const Context = createContext<State | null>(null);
export function AccountProvider({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser();
  const [profile, updateProfile] = useState<Profile>({
    ...initialProfile,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    phone: user.phoneNumber ?? initialProfile.phone,
    birthDate: user.dateOfBirth ?? initialProfile.birthDate,
    state: user.state ?? initialProfile.state,
  });
  const [bank, updateBank] = useState<Bank>({
    name: "Demo Bank",
    number: "0000000000",
    holder: `${user.firstName} ${user.lastName}`.trim(),
  });
  const [preferences, updatePreferences] = useState(initialPreferences);
  const [twoFactor, setTwoFactor] = useState(true);
  // AuthGuard only mounts this provider after the user is known, but keep these in sync if
  // that identity changes without a full remount - either a fast refresh in dev, or a real
  // settings save followed by useCurrentUser().refreshUser().
  useEffect(() => {
    updateProfile((current) => ({
      ...current,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phone: user.phoneNumber ?? current.phone,
      birthDate: user.dateOfBirth ?? current.birthDate,
      state: user.state ?? current.state,
    }));
  }, [
    user.firstName,
    user.lastName,
    user.email,
    user.phoneNumber,
    user.dateOfBirth,
    user.state,
  ]);
  function resetAccount() {
    updateProfile(initialProfile);
    updateBank({
      name: "Demo Bank",
      number: "0000000000",
      holder: "Joy Oyeledun",
    });
    updatePreferences(initialPreferences);
    setTwoFactor(true);
  }
  return (
    <Context.Provider
      value={{
        profile,
        bank,
        preferences,
        twoFactor,
        updateProfile,
        updateBank,
        updatePreferences,
        setTwoFactor,
        resetAccount,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAccount() {
  const value = useContext(Context);
  if (!value) throw new Error("AccountProvider is required");
  return value;
}

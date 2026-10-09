"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { clearToken, getLoggedInUser, getToken, type CurrentUser } from "@/lib/api";

type AuthState = {
  user: CurrentUser;
  logout: () => void;
  // Re-fetches the real user from the backend and updates the shared context - used after a
  // settings change (profile, bank, wallet balance) so the rest of the app sees the new values
  // without requiring a full reload.
  refreshUser: () => Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);

// Gates every route under the (workspace) layout: with no stored token, or a token the
// backend rejects (expired/invalid), the protected UI is never rendered - the visitor is
// redirected to sign in instead. Only renders `children` once a real user has been
// confirmed by GET /api/user/get-logged-in-user.
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/");
      return;
    }
    getLoggedInUser(token)
      .then((response) => setUser(response.data))
      .catch(() => {
        clearToken();
        router.replace("/");
      })
      .finally(() => setChecked(true));
    // Runs once per mount; the router instance is stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    clearToken();
    router.replace("/");
  }

  async function refreshUser() {
    const token = getToken();
    if (!token) return;
    const response = await getLoggedInUser(token);
    setUser(response.data);
  }

  if (!checked || !user) {
    // No flash of protected content while the token is being verified (or after a redirect
    // has been triggered but this component hasn't unmounted yet).
    return (
      <div className="flex min-h-dvh items-center justify-center bg-workspace">
        <p className="text-sm text-subtle">Loading…</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useCurrentUser() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useCurrentUser must be used within AuthGuard");
  return value;
}

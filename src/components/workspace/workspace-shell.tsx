"use client";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { useAccount } from "@/components/settings/account-provider";
import { useCurrentUser } from "@/components/auth/auth-guard";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { Brand } from "@/components/auth/brand";
import { MobileNavigation } from "./mobile-navigation";
import {
  InvestmentIcon,
  type InvestmentIconName,
} from "@/components/investments/investment-icon";
import { useInvestments } from "@/components/investments/investment-provider";
import { cn } from "@/lib/utils";
const navigation: { href: string; label: string; icon: InvestmentIconName }[] =
  [
    { href: "/dashboard", label: "Dashboard", icon: "home" },
    { href: "/investments", label: "Investment Plans", icon: "plans" },
    { href: "/transactions", label: "Transactions", icon: "transactions" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ];
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const { profile, resetAccount } = useAccount();
  const { user, logout } = useCurrentUser();
  const path = usePathname();
  const { reset } = useInvestments();
  return (
    <div className="min-h-dvh bg-workspace">
      <header className="relative z-40 flex h-16 items-center justify-between border-b border-line bg-panel px-5 lg:hidden">
        <Link href="/dashboard" aria-label="Vesture dashboard">
          <Brand className="h-8 w-[84px]" />
        </Link>
      </header>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-panel lg:flex">
        <Link
          href="/dashboard"
          className="hidden justify-center px-6 pt-9 pb-8 lg:flex"
          aria-label="Vesture dashboard"
        >
          <Brand className="h-[34px] w-[89px]" />
        </Link>
        <nav
          id="workspace-nav"
          aria-label="Main navigation"
          className="space-y-1 px-3 max-lg:pt-5"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={path.startsWith(item.href) ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-subtle transition-colors hover:bg-surface hover:text-lilac",
                path.startsWith(item.href) && "bg-surface text-lilac",
              )}
            >
              <InvestmentIcon name={item.icon} />
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            onClick={() => {
              reset();
              resetAccount();
              logout();
            }}
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-subtle hover:bg-surface"
          >
            <InvestmentIcon name="logout" />
            Logout
          </Link>
        </nav>
        <div className="mt-auto p-4">
          <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
            <InitialsAvatar
              firstName={user.firstName}
              lastName={user.lastName}
              className="size-9 text-sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{profile.name}</p>
              <p
                className="truncate text-xs text-subtle"
                title={user.uniqueRef ?? undefined}
              >
                ID: {user.uniqueRef ?? "---"}
              </p>
            </div>
          </div>
        </div>
      </aside>
      <main
        id="main-content"
        className="min-h-dvh pb-[calc(112px+env(safe-area-inset-bottom))] lg:ml-64 lg:pb-0"
      >
        {children}
      </main>
      <MobileNavigation items={navigation} />
    </div>
  );
}

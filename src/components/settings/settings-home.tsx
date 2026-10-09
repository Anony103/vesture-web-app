"use client";
import Link from "next/link";
import { useAccount } from "./account-provider";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { useCurrentUser } from "@/components/auth/auth-guard";
import { useInvestments } from "@/components/investments/investment-provider";
import { PageHeading } from "@/components/workspace/page-heading";
import { Switch } from "@/components/ui/switch";
import { InvestmentIcon } from "@/components/investments/investment-icon";
function SettingsRow({
  href,
  label,
  danger = false,
}: {
  href: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-16 items-center justify-between gap-4 border-b border-line px-5 text-sm last:border-0 hover:bg-surface ${danger ? "text-red-400" : "text-ink"}`}
    >
      <span className="flex items-center gap-3">
        <img
          src={`/figma/settings/${href.split("/").pop() === "personal" ? "person" : href.split("/").pop() === "close-account" ? "delete" : href.split("/").pop()}.png`}
          alt=""
          width={36}
          height={36}
          className="size-9 rounded-full"
        />
        {label}
      </span>
      <InvestmentIcon name="back" className="size-4 rotate-180" />
    </Link>
  );
}
function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-[10px] tracking-[0.12em] text-muted uppercase">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-panel">
        {children}
      </div>
    </section>
  );
}
export function SettingsHome() {
  const account = useAccount();
  const { user } = useCurrentUser();
  const { reset } = useInvestments();
  return (
    <>
      <header className="bg-[#431967] px-5 py-7">
        <div className="mx-auto max-w-[1050px]">
          <PageHeading title="Settings" backHref="/dashboard" />
          <div className="pb-2 text-center">
            <InitialsAvatar
              firstName={user.firstName}
              lastName={user.lastName}
              className="mx-auto size-[72px] border-4 border-white/60 bg-lilac/25 text-2xl"
            />
            <h2 className="mt-4 text-xl font-semibold">
              {account.profile.name}
            </h2>
            <p className="mt-1 text-xs text-lilac">
              Customer ID: {user.uniqueRef ?? "---"}
            </p>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[680px] space-y-5 px-5 py-8">
        <SettingsGroup title="Account settings">
          <SettingsRow href="/settings/personal" label="Personal information" />
          <SettingsRow href="/settings/bank" label="Bank Account" />
        </SettingsGroup>
        <SettingsGroup title="Security">
          <SettingsRow href="/settings/password" label="Change Password" />
          <div className="p-5">
            <Switch
              label="Two Factor Authentication"
              description="Preview preference only; account security is unchanged."
              checked={account.twoFactor}
              onChange={account.setTwoFactor}
            />
          </div>
        </SettingsGroup>
        <SettingsGroup title="Preferences">
          <SettingsRow href="/settings/notifications" label="Notifications" />
          <SettingsRow
            href="/settings/close-account"
            label="Delete my account"
            danger
          />
        </SettingsGroup>
        <Link
          href="/"
          onClick={() => {
            reset();
            account.resetAccount();
          }}
          className="inline-block px-3 py-2 text-sm text-red-400"
        >
          Log out
        </Link>
      </div>
    </>
  );
}

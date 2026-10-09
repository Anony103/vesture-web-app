import { AuthGuard } from "@/components/auth/auth-guard";
import { AccountProvider } from "@/components/settings/account-provider";
import { InvestmentProvider } from "@/components/investments/investment-provider";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <InvestmentProvider>
        <AccountProvider>
          <WorkspaceShell>{children}</WorkspaceShell>
        </AccountProvider>
      </InvestmentProvider>
    </AuthGuard>
  );
}

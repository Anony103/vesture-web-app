import { PortfolioPanel } from "@/components/auth/portfolio-panel";
import { LoginForm } from "@/components/auth/login-form";
export default function LoginPage() {
  return (
    <div className="flex min-h-dvh">
      <PortfolioPanel />
      <main
        id="main-content"
        className="flex min-h-dvh flex-1 items-center justify-center px-6 py-12"
      >
        <LoginForm />
      </main>
    </div>
  );
}

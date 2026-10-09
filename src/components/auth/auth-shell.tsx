import type { ReactNode } from "react";
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="onboarding-background" aria-hidden="true">
        <div className="onboarding-art">
          <img src="/figma/background.svg" alt="" width={2157} height={2430} />
        </div>
      </div>
      <main
        id="main-content"
        className="relative flex min-h-dvh items-center justify-center px-5 py-16 sm:px-6 sm:py-12"
      >
        {children}
      </main>
    </>
  );
}

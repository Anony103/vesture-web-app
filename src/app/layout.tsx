import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Vesture | Sign in", template: "%s | Vesture" },
  description:
    "Your Vesture account. A simpler way to start your investment journey.",
  icons: { icon: "/figma/brand-mark.png" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-lilac focus:p-3 focus:text-canvas"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

"use client";
import { useEffect, useState } from "react";
import { PageHeading } from "@/components/workspace/page-heading";

// A screen that sends a customer here (for example "Verify now" on a product page) adds ?from=/the/page, and the back
// arrow takes them back to exactly that page. Only a path inside the app is accepted, never another site.
function returnPath(search: string): string | null {
  const from = new URLSearchParams(search).get("from");
  return from && from.startsWith("/") && !from.startsWith("//") && !from.includes("\\") ? from : null;
}

export function SettingsLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const [back, setBack] = useState("/settings");
  useEffect(() => {
    setBack(returnPath(window.location.search) ?? "/settings");
  }, []);
  return (
    <div className="mx-auto max-w-[680px] px-5 py-10">
      <PageHeading
        title={title}
        description={description}
        backHref={back}
      />
      {children}
    </div>
  );
}

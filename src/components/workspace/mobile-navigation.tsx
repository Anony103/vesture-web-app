"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type InvestmentIconName } from "@/components/investments/investment-icon";
import { cn } from "@/lib/utils";

type NavigationItem = { href: string; label: string; icon: InvestmentIconName };
export function MobileNavigation({
  items,
}: {
  items: readonly NavigationItem[];
}) {
  const path = usePathname();
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-[calc(20px+env(safe-area-inset-bottom))] left-1/2 z-50 flex h-[88px] w-[calc(100%-48px)] max-w-[450px] -translate-x-1/2 items-center justify-around rounded-full bg-[#b08ac2]/90 px-4 shadow-[0_8px_32px_#00000024] backdrop-blur-xl lg:hidden"
    >
      {items.map((item) => {
        const active = path === item.href || path.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
              active ? "bg-[#431967]" : "hover:bg-white/15",
            )}
          >
            <img
              src={`/figma/mobile-nav/${item.icon}.png`}
              alt=""
              aria-hidden="true"
              width={28}
              height={28}
              className="size-7 object-contain"
            />
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { clsx } from "@/lib/clsx";

type Tab = { href: string; label: string; icon: string };

const CUSTOMER_TABS: Tab[] = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/book", label: "Book", icon: "🔍" },
  { href: "/bookings", label: "Bookings", icon: "📋" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

const PROVIDER_TABS: Tab[] = [
  { href: "/pro/dashboard", label: "Jobs", icon: "🧰" },
  { href: "/pro/map", label: "Map", icon: "🗺️" },
  { href: "/pro/services", label: "Services", icon: "⚙️" },
  { href: "/pro/history", label: "History", icon: "🕘" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

// Mobile app-style bottom tab bar. Role-aware; hidden when signed out.
export function BottomNav() {
  const { user, profile, loading } = useUser();
  const pathname = usePathname();
  if (loading || !user) return null;

  const tabs = profile?.role === "provider" ? PROVIDER_TABS : CUSTOMER_TABS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {tabs.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                active ? "text-brand-700" : "text-slate-400"
              )}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

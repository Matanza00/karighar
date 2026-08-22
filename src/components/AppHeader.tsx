"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/useUser";
import { NotificationBell } from "@/components/NotificationBell";
import { clsx } from "@/lib/clsx";

type Role = "guest" | "customer" | "provider" | "admin";

const LINKS: Record<Role, [string, string][]> = {
  guest: [
    ["/book", "Services"],
    ["/pro", "Become a Pro"],
  ],
  customer: [
    ["/", "Home"],
    ["/book", "Book"],
    ["/bookings", "My Bookings"],
  ],
  provider: [
    ["/pro/dashboard", "Jobs"],
    ["/pro/map", "Map"],
    ["/pro/services", "My Services"],
    ["/pro/history", "History"],
  ],
  admin: [
    ["/admin", "Overview"],
    ["/admin/providers", "Providers"],
    ["/admin/jobs", "Jobs"],
    ["/admin/catalog", "Catalog"],
  ],
};

export function AppHeader() {
  const { user, profile, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role: Role = user ? ((profile?.role as Role) ?? "customer") : "guest";
  const links = LINKS[role];

  async function signOut() {
    setMenuOpen(false);
    setMobileOpen(false);
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const initial = (profile?.full_name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-black text-white">
            K
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            KARI<span className="text-brand-600">GHAR</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive(href) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: auth */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
          ) : user ? (
            <div className="flex items-center gap-1">
              <NotificationBell userId={user.id} />
              <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 hover:bg-slate-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {initial}
                </span>
                <span className="hidden text-sm font-medium text-slate-700 sm:block">
                  {profile?.full_name?.split(" ")[0] ?? "Account"}
                </span>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-slate-400">
                  <path d="M5.5 7.5L10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <button className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} aria-hidden />
                  <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    <div className="border-b border-slate-100 px-4 py-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{profile?.full_name ?? "Account"}</p>
                      <p className="truncate text-xs capitalize text-slate-400">{role}</p>
                    </div>
                    <MenuItem href="/profile" onClick={() => setMenuOpen(false)}>👤 Profile</MenuItem>
                    <MenuItem href="/settings" onClick={() => setMenuOpen(false)}>⚙️ Settings</MenuItem>
                    {role === "customer" && <MenuItem href="/bookings" onClick={() => setMenuOpen(false)}>📋 My bookings</MenuItem>}
                    {role === "provider" && <MenuItem href="/pro/dashboard" onClick={() => setMenuOpen(false)}>🧰 Dashboard</MenuItem>}
                    <button onClick={signOut} className="block w-full px-4 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50">
                      ↩︎ Sign out
                    </button>
                  </div>
                </>
              )}
              </div>
            </div>
          ) : (
            <>
              <Link href="/signin" className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:block">
                Sign in
              </Link>
              <Link href="/signup" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Sign up
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-50 md:hidden"
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive(href) ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                {label}
              </Link>
            ))}
            <div className="my-2 h-px bg-slate-100" />
            {user ? (
              <>
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  👤 Profile
                </Link>
                <Link href="/settings" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  ⚙️ Settings
                </Link>
                <button onClick={signOut} className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50">
                  ↩︎ Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/signin" onClick={() => setMobileOpen(false)} className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-center text-sm font-semibold text-slate-700">
                  Sign in
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="flex-1 rounded-lg bg-brand-600 px-3 py-2.5 text-center text-sm font-semibold text-white">
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function MenuItem({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
      {children}
    </Link>
  );
}

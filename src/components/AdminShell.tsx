"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import { clsx } from "@/lib/clsx";

const TABS = [
  ["/admin", "Overview"],
  ["/admin/providers", "Providers"],
  ["/admin/jobs", "Jobs"],
  ["/admin/catalog", "Catalog"],
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useUser();
  const pathname = usePathname();

  if (loading) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }
  if (profile?.role !== "admin") {
    return (
      <AppShell>
        <Card className="text-center">
          <h1 className="text-lg font-bold text-slate-900">Admins only</h1>
          <p className="mt-2 text-sm text-slate-600">
            Set your role to <code>admin</code> in Supabase:
            <br />
            <code className="mt-2 inline-block rounded bg-slate-100 px-2 py-1 text-xs">
              update profiles set role=&apos;admin&apos; where id=&apos;YOUR-USER-ID&apos;;
            </code>
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
      <nav className="mt-4 flex gap-1 border-b border-slate-200">
        {TABS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "border-b-2 px-4 py-2 text-sm font-medium",
              pathname === href
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </AppShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/ui";

export default function AdminOverview() {
  const [stats, setStats] = useState({ pendingPros: 0, openJobs: 0, activeJobs: 0, totalJobs: 0 });

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [pending, open, active, total] = await Promise.all([
        supabase.from("providers").select("profile_id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("jobs").select("id", { count: "exact", head: true }).in("status", ["created", "bidding"]),
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .in("status", ["assigned", "en_route", "arrived", "in_progress", "completed"]),
        supabase.from("jobs").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        pendingPros: pending.count ?? 0,
        openJobs: open.count ?? 0,
        activeJobs: active.count ?? 0,
        totalJobs: total.count ?? 0,
      });
    })();
  }, []);

  const tiles: [string, number][] = [
    ["Pending verifications", stats.pendingPros],
    ["Open jobs", stats.openJobs],
    ["Active jobs", stats.activeJobs],
    ["Total jobs", stats.totalJobs],
  ];

  return (
    <AdminShell>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-500">
        Use the tabs above to verify providers, monitor jobs, and manage the price catalog.
      </p>
    </AdminShell>
  );
}

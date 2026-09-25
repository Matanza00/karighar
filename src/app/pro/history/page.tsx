"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/useUser";
import { AppShell } from "@/components/AppShell";
import { Card, Badge, formatPKR } from "@/components/ui";
import { summarizeLedger, type LedgerEntry, type LedgerSummary } from "@/lib/money";
import { JOB_STATUS_LABEL, type Job } from "@/lib/types";

export default function ProviderHistoryPage() {
  const { user, loading } = useRequireAuth("/pro/history");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [wallet, setWallet] = useState<LedgerSummary | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      const [{ data: jobRows }, { data: ledger }] = await Promise.all([
        supabase
          .from("jobs")
          .select("*")
          .eq("provider_id", user.id)
          .in("status", ["paid", "rated", "cancelled"])
          .order("updated_at", { ascending: false }),
        supabase.from("provider_ledger").select("type,amount").eq("provider_id", user.id),
      ]);
      setJobs((jobRows as Job[]) || []);
      setWallet(summarizeLedger(((ledger as LedgerEntry[]) || [])));
      setFetching(false);
    })();
  }, [user]);

  const done = jobs.filter((j) => j.status !== "cancelled").length;

  if (loading || !user) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-slate-900">Earnings & history</h1>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Net earnings</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatPKR(wallet?.netEarnings ?? 0)}</p>
          <p className="text-xs text-slate-400">after commission</p>
        </Card>
        <Card className={wallet && wallet.commissionOwed > 0 ? "border-amber-200 bg-amber-50" : ""}>
          <p className="text-sm text-slate-500">Commission owed to KARIGHAR</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatPKR(wallet?.commissionOwed ?? 0)}</p>
          <p className="text-xs text-slate-400">from cash you collected · settle with the team</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Jobs completed</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{done}</p>
        </Card>
      </div>

      {fetching ? (
        <p className="mt-6 text-slate-500">Loading…</p>
      ) : jobs.length === 0 ? (
        <Card className="mt-6 text-center">
          <p className="text-slate-600">No completed jobs yet.</p>
          <Link href="/pro/dashboard" className="mt-3 inline-block font-semibold text-brand-700">
            Find jobs →
          </Link>
        </Card>
      ) : (
        <div className="mt-6 space-y-2">
          {jobs.map((job) => (
            <Link key={job.id} href={`/pro/jobs/view/?id=${job.id}`}>
              <Card className="p-4 transition hover:border-brand-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(job.updated_at).toLocaleDateString("en-PK")} · {job.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={job.status === "cancelled" ? "rose" : "slate"}>{JOB_STATUS_LABEL[job.status]}</Badge>
                    <p className="mt-1 font-semibold text-slate-800">{formatPKR(job.price)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

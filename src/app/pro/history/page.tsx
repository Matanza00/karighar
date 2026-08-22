"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/useUser";
import { AppShell } from "@/components/AppShell";
import { Card, Badge, formatPKR } from "@/components/ui";
import { JOB_STATUS_LABEL, type Job } from "@/lib/types";

export default function ProviderHistoryPage() {
  const { user, loading } = useRequireAuth("/pro/history");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    createClient()
      .from("jobs")
      .select("*")
      .eq("provider_id", user.id)
      .in("status", ["paid", "rated", "cancelled"])
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setJobs((data as Job[]) || []);
        setFetching(false);
      });
  }, [user]);

  const earned = jobs
    .filter((j) => j.status === "paid" || j.status === "rated")
    .reduce((sum, j) => sum + (j.price ? j.price * (1 - j.commission_rate) : 0), 0);
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
      <h1 className="text-2xl font-bold text-slate-900">History</h1>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Card>
          <p className="text-sm text-slate-500">Net earned</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatPKR(Math.round(earned))}</p>
          <p className="text-xs text-slate-400">after commission</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Jobs completed</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{done}</p>
        </Card>
      </div>

      {fetching ? (
        <p className="mt-6 text-slate-500">Loading…</p>
      ) : jobs.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No completed jobs yet.</p>
      ) : (
        <div className="mt-6 space-y-2">
          {jobs.map((job) => (
            <Link key={job.id} href={`/pro/jobs/${job.id}`}>
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

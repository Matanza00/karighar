"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Card, Badge, formatPKR } from "@/components/ui";
import { JOB_STATUS_LABEL, type Job } from "@/lib/types";

const CLOSED = new Set(["paid", "rated", "cancelled"]);

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
      setJobs((data as Job[]) || []);
    })();
  }, []);

  return (
    <AdminShell>
      <div className="space-y-2">
        {jobs.length === 0 && <p className="text-sm text-slate-500">No jobs yet.</p>}
        {jobs.map((job) => (
          <Card key={job.id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{job.title}</span>
                  {job.type === "custom" && <Badge tone="amber">Custom</Badge>}
                </div>
                <p className="text-sm text-slate-500">{job.address}</p>
                <p className="text-xs text-slate-400">
                  {new Date(job.created_at).toLocaleString("en-PK")}
                  {job.provider_id ? " · assigned" : " · unassigned"}
                </p>
                {job.status === "cancelled" && job.cancel_reason && (
                  <p className="mt-1 text-xs text-rose-500">Reason: {job.cancel_reason}</p>
                )}
              </div>
              <div className="text-right">
                <Badge tone={CLOSED.has(job.status) ? "slate" : "brand"}>{JOB_STATUS_LABEL[job.status]}</Badge>
                <p className="mt-1 font-semibold text-slate-800">{formatPKR(job.price)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}

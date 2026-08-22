"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/useUser";
import { AppShell } from "@/components/AppShell";
import { Card, Button, Badge, formatPKR } from "@/components/ui";
import { JobChat } from "@/components/JobChat";
import { ProviderTracker } from "@/components/maps/ProviderTracker";
import { TrackingMap } from "@/components/maps/TrackingMap";
import { JOB_STATUS_LABEL, type Job, type JobStatus, type Profile } from "@/lib/types";

// What the provider can do next at each stage.
const NEXT: Partial<Record<JobStatus, { to: JobStatus; label: string }>> = {
  assigned: { to: "en_route", label: "I'm on the way" },
  en_route: { to: "arrived", label: "I've arrived" },
  arrived: { to: "in_progress", label: "Start work" },
  in_progress: { to: "completed", label: "Mark completed" },
  completed: { to: "paid", label: "Cash received" },
};

export default function ProJobDetail() {
  const jobId = useParams<{ id: string }>().id;
  const { user, loading } = useRequireAuth(`/pro/jobs/${jobId}`);
  const [job, setJob] = useState<Job | null>(null);
  const [customer, setCustomer] = useState<Profile | null>(null);
  const [fetching, setFetching] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("jobs").select("*").eq("id", jobId).single();
    const j = data as Job | null;
    setJob(j);
    if (j) {
      const { data: cust } = await supabase.from("profiles").select("*").eq("id", j.customer_id).maybeSingle();
      setCustomer(cust as Profile | null);
    }
    setFetching(false);
  }, [jobId]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function advance(to: JobStatus) {
    setBusy(true);
    await createClient().from("jobs").update({ status: to }).eq("id", jobId);
    await load();
    setBusy(false);
  }

  if (loading || fetching) {
    return (
      <AppShell width="narrow">
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }
  if (!job) {
    return (
      <AppShell width="narrow">
        <p className="text-slate-500">Job not found.</p>
      </AppShell>
    );
  }

  const next = NEXT[job.status];

  return (
    <AppShell width="narrow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{job.address}</p>
          <p className="mt-1 text-xs text-slate-400">
            {job.scheduled_at ? new Date(job.scheduled_at).toLocaleString("en-PK") : "Flexible time"}
          </p>
        </div>
        <div className="text-right">
          <Badge>{JOB_STATUS_LABEL[job.status]}</Badge>
          <p className="mt-2 text-lg font-bold text-slate-900">{formatPKR(job.price)}</p>
        </div>
      </div>

      {job.description && (
        <Card className="mt-4 bg-slate-50">
          <p className="text-sm text-slate-600">{job.description}</p>
        </Card>
      )}

      {customer && (
        <Card className="mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Customer</p>
              <p className="font-medium text-slate-900">{customer.full_name ?? "Customer"}</p>
            </div>
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="text-sm font-semibold text-brand-700">
                Call
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Live location sharing + route map while heading over */}
      {["en_route", "arrived", "in_progress"].includes(job.status) && (
        <div className="mt-6 space-y-3">
          <ProviderTracker jobId={jobId} autoStart={job.status === "en_route"} />
          <TrackingMap
            jobId={jobId}
            destination={job.lat != null && job.lng != null ? { lat: job.lat, lng: job.lng } : null}
          />
        </div>
      )}

      {next && (
        <div className="mt-6">
          <Button className="w-full" disabled={busy} onClick={() => advance(next.to)}>
            {next.label}
          </Button>
        </div>
      )}
      {job.status === "paid" && (
        <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-center text-sm font-medium text-emerald-700">
          Job complete. Commission owed: {formatPKR(job.price ? job.price * job.commission_rate : 0)}
        </div>
      )}

      {user && (
        <Card className="mt-6">
          <h2 className="mb-2 font-semibold text-slate-900">Messages</h2>
          <JobChat jobId={jobId} userId={user.id} />
        </Card>
      )}
    </AppShell>
  );
}

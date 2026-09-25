"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/useUser";
import { AppShell } from "@/components/AppShell";
import { Card, Button, Badge, inputClass, formatPKR } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { JobChat } from "@/components/JobChat";
import { ProviderTracker } from "@/components/maps/ProviderTracker";
import { TrackingMap } from "@/components/maps/TrackingMap";
import { DisputeButton } from "@/components/DisputeButton";
import { JOB_STATUS_LABEL, type Job, type JobStatus, type Profile } from "@/lib/types";

// What the provider can do next at each stage.
const NEXT: Partial<Record<JobStatus, { to: JobStatus; label: string }>> = {
  assigned: { to: "en_route", label: "I'm on the way" },
  en_route: { to: "arrived", label: "I've arrived" },
  arrived: { to: "in_progress", label: "Start work" },
  in_progress: { to: "completed", label: "Mark completed" },
  completed: { to: "paid", label: "Cash received" },
};

function ProJobDetailContent() {
  const jobId = useSearchParams().get("id") ?? "";
  const { user, loading } = useRequireAuth(`/pro/jobs/view/?id=${jobId}`);
  const toast = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [customer, setCustomer] = useState<Profile | null>(null);
  const [fetching, setFetching] = useState(true);
  const [busy, setBusy] = useState(false);
  const [priceInput, setPriceInput] = useState("");

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
    if (to === "completed" && (job?.price == null || job.price === 0)) {
      toast("Set the final price before completing this job.", "error");
      return;
    }
    setBusy(true);
    await createClient().from("jobs").update({ status: to }).eq("id", jobId);
    await load();
    setBusy(false);
  }

  async function setPrice() {
    const value = Number(priceInput);
    if (!value || value <= 0) {
      toast("Enter a valid amount", "error");
      return;
    }
    setBusy(true);
    const { error } = await createClient().from("jobs").update({ price: value }).eq("id", jobId);
    setBusy(false);
    if (error) {
      toast(error.message, "error");
      return;
    }
    setPriceInput("");
    toast("Price set — the customer can see it now.", "success");
    await load();
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

      {/* Quote job: Pro sets the final price once (then it's locked) */}
      {job.price == null && !["rated", "paid", "cancelled"].includes(job.status) && (
        <Card className="mt-4 border-amber-200 bg-amber-50">
          <p className="text-sm font-medium text-amber-800">This job needs a price</p>
          <p className="mt-1 text-xs text-amber-700">Inspect the work, then set the final price for the customer.</p>
          <div className="mt-3 flex gap-2">
            <input
              className={inputClass}
              type="number"
              placeholder="Final price (Rs)"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
            />
            <Button disabled={busy} onClick={setPrice}>
              Set price
            </Button>
          </div>
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

      {user && (
        <div className="mt-6">
          <DisputeButton jobId={jobId} userId={user.id} />
        </div>
      )}
    </AppShell>
  );
}

export default function ProJobDetailPage() {
  return (
    <Suspense
      fallback={
        <AppShell width="narrow">
          <p className="text-slate-500">Loading…</p>
        </AppShell>
      }
    >
      <ProJobDetailContent />
    </Suspense>
  );
}

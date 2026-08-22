"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/useUser";
import { AppShell } from "@/components/AppShell";
import { Card, Button, Badge, inputClass, formatPKR } from "@/components/ui";
import { JOB_STATUS_LABEL, type Job, type Provider } from "@/lib/types";

export default function ProDashboard() {
  const { user, loading } = useRequireAuth("/pro/dashboard");
  const [provider, setProvider] = useState<Provider | null>(null);
  const [available, setAvailable] = useState<Job[]>([]);
  const [mine, setMine] = useState<Job[]>([]);
  const [fetching, setFetching] = useState(true);
  const [bidFor, setBidFor] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidNote, setBidNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data: prov } = await supabase.from("providers").select("*").eq("profile_id", user.id).maybeSingle();
    setProvider(prov as Provider | null);

    if ((prov as Provider | null)?.status === "approved") {
      const [{ data: open }, { data: assigned }] = await Promise.all([
        supabase
          .from("jobs")
          .select("*")
          .is("provider_id", null)
          .in("status", ["created", "bidding"])
          .order("created_at", { ascending: false }),
        supabase
          .from("jobs")
          .select("*")
          .eq("provider_id", user.id)
          .not("status", "in", "(rated,cancelled)")
          .order("created_at", { ascending: false }),
      ]);
      setAvailable((open as Job[]) || []);
      setMine((assigned as Job[]) || []);
    }
    setFetching(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function acceptFixed(job: Job) {
    setBusy(true);
    await createClient()
      .from("jobs")
      .update({ provider_id: user!.id, status: "assigned" })
      .eq("id", job.id);
    await load();
    setBusy(false);
  }

  async function submitBid(jobId: string) {
    const amount = Number(bidAmount);
    if (!amount) return;
    setBusy(true);
    await createClient().from("bids").insert({
      job_id: jobId,
      provider_id: user!.id,
      amount,
      note: bidNote || null,
    });
    setBidFor(null);
    setBidAmount("");
    setBidNote("");
    setBusy(false);
    alert("Quote sent! The customer will be notified.");
  }

  if (loading || fetching) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  if (!provider) {
    return (
      <AppShell>
        <Card className="text-center">
          <p className="text-slate-600">You haven&apos;t set up your pro profile yet.</p>
          <Link href="/pro/onboarding" className="mt-3 inline-block font-semibold text-brand-700">
            Complete onboarding →
          </Link>
        </Card>
      </AppShell>
    );
  }

  if (provider.status !== "approved") {
    return (
      <AppShell>
        <Card className="text-center">
          <div className="text-3xl">⏳</div>
          <h1 className="mt-2 text-xl font-bold text-slate-900">
            {provider.status === "pending" ? "Verification in progress" : `Account ${provider.status}`}
          </h1>
          <p className="mt-2 text-slate-600">
            {provider.status === "pending"
              ? "Our team is reviewing your profile. You'll be able to accept jobs once approved (usually 1–2 days)."
              : "Please contact support for details."}
          </p>
          <Link href="/pro/onboarding" className="mt-4 inline-block text-sm font-semibold text-brand-700">
            Edit profile
          </Link>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pro dashboard</h1>
          <p className="text-sm text-slate-500">
            ⭐ {provider.rating_avg?.toFixed(1) ?? "New"} · {provider.jobs_completed} jobs done
          </p>
        </div>
        <Badge tone="green">Approved</Badge>
      </div>

      {/* My active jobs */}
      <h2 className="mt-8 text-lg font-bold text-slate-900">Your jobs</h2>
      {mine.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No active jobs. Accept one below 👇</p>
      ) : (
        <div className="mt-3 space-y-3">
          {mine.map((job) => (
            <Link key={job.id} href={`/pro/jobs/${job.id}`}>
              <Card className="transition hover:border-brand-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{job.title}</h3>
                    <p className="text-sm text-slate-500">{job.address}</p>
                  </div>
                  <div className="text-right">
                    <Badge>{JOB_STATUS_LABEL[job.status]}</Badge>
                    <p className="mt-2 font-semibold text-slate-800">{formatPKR(job.price)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Available jobs */}
      <h2 className="mt-10 text-lg font-bold text-slate-900">Available near you</h2>
      {available.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No open jobs right now. Check back soon.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {available.map((job) => (
            <Card key={job.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{job.title}</h3>
                    {job.type === "custom" && <Badge tone="amber">Custom · quote</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{job.address}</p>
                  {job.description && <p className="mt-1 text-sm text-slate-600">{job.description}</p>}
                  <p className="mt-1 text-xs text-slate-400">
                    {job.scheduled_at ? new Date(job.scheduled_at).toLocaleString("en-PK") : "Flexible time"}
                  </p>
                </div>
                <div className="whitespace-nowrap text-right">
                  <p className="font-bold text-brand-700">{formatPKR(job.price)}</p>
                  {job.type === "fixed" ? (
                    <Button className="mt-2 px-3 py-1.5" disabled={busy} onClick={() => acceptFixed(job)}>
                      Accept
                    </Button>
                  ) : (
                    <Button className="mt-2 px-3 py-1.5" variant="outline" onClick={() => setBidFor(bidFor === job.id ? null : job.id)}>
                      {bidFor === job.id ? "Close" : "Send quote"}
                    </Button>
                  )}
                </div>
              </div>

              {bidFor === job.id && (
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  <input
                    className={inputClass}
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Your quote (Rs)"
                  />
                  <input
                    className={inputClass}
                    value={bidNote}
                    onChange={(e) => setBidNote(e.target.value)}
                    placeholder="Note (optional) — what's included"
                  />
                  <Button disabled={busy} onClick={() => submitBid(job.id)}>
                    Submit quote
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

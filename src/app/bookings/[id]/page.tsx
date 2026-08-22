"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/useUser";
import { AppShell } from "@/components/AppShell";
import { Card, Button, Badge, inputClass, formatPKR } from "@/components/ui";
import { JobTimeline } from "@/components/JobTimeline";
import { JobChat } from "@/components/JobChat";
import { TrackingMap } from "@/components/maps/TrackingMap";
import { DisputeButton } from "@/components/DisputeButton";
import type { Job, Bid, Profile } from "@/lib/types";

type BidWithPro = Bid & { pro?: Profile; rating?: number };

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const isNew = useSearchParams().get("new") === "1";
  const { user, loading } = useRequireAuth(`/bookings/${jobId}`);

  const [job, setJob] = useState<Job | null>(null);
  const [providerProfile, setProviderProfile] = useState<Profile | null>(null);
  const [providerRating, setProviderRating] = useState<number | null>(null);
  const [bids, setBids] = useState<BidWithPro[]>([]);
  const [hasReview, setHasReview] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: jobData } = await supabase.from("jobs").select("*").eq("id", jobId).single();
    const j = jobData as Job | null;
    setJob(j);
    if (!j) {
      setFetching(false);
      return;
    }

    if (j.provider_id) {
      const [{ data: prof }, { data: prov }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", j.provider_id).single(),
        supabase.from("providers").select("rating_avg").eq("profile_id", j.provider_id).single(),
      ]);
      setProviderProfile(prof as Profile | null);
      setProviderRating(prov ? (prov as { rating_avg: number }).rating_avg : null);
    }

    if (j.type === "custom" && j.status === "bidding") {
      const { data: bidData } = await supabase
        .from("bids")
        .select("*")
        .eq("job_id", jobId)
        .eq("status", "pending")
        .order("amount");
      const list = (bidData as Bid[]) || [];
      const proIds = [...new Set(list.map((b) => b.provider_id))];
      const { data: profs } = proIds.length
        ? await supabase.from("profiles").select("*").in("id", proIds)
        : { data: [] };
      const { data: provs } = proIds.length
        ? await supabase.from("providers").select("profile_id,rating_avg").in("profile_id", proIds)
        : { data: [] };
      setBids(
        list.map((b) => ({
          ...b,
          pro: (profs as Profile[])?.find((p) => p.id === b.provider_id),
          rating: (provs as { profile_id: string; rating_avg: number }[])?.find(
            (p) => p.profile_id === b.provider_id
          )?.rating_avg,
        }))
      );
    }

    const { count } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("job_id", jobId);
    setHasReview((count ?? 0) > 0);
    setFetching(false);
  }, [jobId]);

  useEffect(() => {
    if (!user) return;
    load();
    const supabase = createClient();
    const channel = supabase
      .channel(`job:${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, jobId, load]);

  async function acceptBid(bid: BidWithPro) {
    setBusy(true);
    const supabase = createClient();
    await supabase
      .from("jobs")
      .update({ provider_id: bid.provider_id, price: bid.amount, status: "assigned" })
      .eq("id", jobId);
    await supabase.from("bids").update({ status: "awarded" }).eq("id", bid.id);
    await supabase.from("bids").update({ status: "rejected" }).eq("job_id", jobId).neq("id", bid.id);
    await load();
    setBusy(false);
  }

  async function cancelJob() {
    setBusy(true);
    await createClient()
      .from("jobs")
      .update({ status: "cancelled", cancel_reason: cancelReason || null })
      .eq("id", jobId);
    await load();
    setBusy(false);
    setShowCancel(false);
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!job?.provider_id || !user) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("reviews").insert({
      job_id: jobId,
      customer_id: user.id,
      provider_id: job.provider_id,
      rating,
      comment: comment || null,
    });
    await supabase.from("jobs").update({ status: "rated" }).eq("id", jobId);
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
        <p className="text-slate-500">Booking not found.</p>
      </AppShell>
    );
  }

  const canCancel = ["created", "bidding", "assigned"].includes(job.status);
  const canReview = job.status === "paid" && !hasReview && job.provider_id;
  const awaitingPayment = job.status === "completed";

  return (
    <AppShell width="narrow">
      {isNew && (
        <div className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          🎉 Booking placed! {job.type === "custom" ? "Pros will send quotes shortly." : "We're finding you a pro."}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{job.address}</p>
          <p className="mt-1 text-xs text-slate-400">
            {job.scheduled_at ? new Date(job.scheduled_at).toLocaleString("en-PK") : "No time set"}
          </p>
        </div>
        <div className="text-right">
          {job.type === "custom" && <Badge tone="amber">Custom</Badge>}
          <p className="mt-2 text-lg font-bold text-slate-900">{formatPKR(job.price)}</p>
          <p className="text-xs text-slate-400">Cash on completion</p>
        </div>
      </div>

      {job.description && (
        <Card className="mt-4 bg-slate-50">
          <p className="text-sm text-slate-600">{job.description}</p>
        </Card>
      )}

      {/* Live tracking */}
      {job.provider_id && ["en_route", "arrived", "in_progress"].includes(job.status) && (
        <Card className="mt-6">
          <h2 className="mb-3 font-semibold text-slate-900">Live tracking</h2>
          <TrackingMap
            jobId={jobId}
            destination={job.lat != null && job.lng != null ? { lat: job.lat, lng: job.lng } : null}
          />
        </Card>
      )}

      {/* Status */}
      <Card className="mt-6">
        <h2 className="mb-4 font-semibold text-slate-900">Status</h2>
        <JobTimeline status={job.status} />
      </Card>

      {/* Bids (custom, still collecting) */}
      {job.type === "custom" && job.status === "bidding" && (
        <Card className="mt-6">
          <h2 className="font-semibold text-slate-900">Quotes from pros</h2>
          {bids.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No quotes yet — check back shortly.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {bids.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                  <div>
                    <Link href={`/providers/${b.provider_id}`} className="font-medium text-slate-900 hover:text-brand-700">
                      {b.pro?.full_name ?? "Pro"}
                    </Link>
                    <p className="text-xs text-slate-500">
                      ⭐ {b.rating?.toFixed(1) ?? "New"} {b.eta_minutes ? `· ETA ${b.eta_minutes} min` : ""}
                    </p>
                    {b.note && <p className="mt-1 text-sm text-slate-600">{b.note}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-700">{formatPKR(b.amount)}</p>
                    <Button className="mt-1 px-3 py-1.5" disabled={busy} onClick={() => acceptBid(b)}>
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Provider */}
      {providerProfile && (
        <Card className="mt-6">
          <h2 className="font-semibold text-slate-900">Your pro</h2>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <Link href={`/providers/${job.provider_id}`} className="font-medium text-slate-900 hover:text-brand-700">
                {providerProfile.full_name}
              </Link>
              <p className="text-xs text-slate-500">⭐ {providerRating?.toFixed(1) ?? "New"}</p>
            </div>
            {providerProfile.phone && (
              <a href={`tel:${providerProfile.phone}`} className="text-sm font-semibold text-brand-700">
                Call
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Awaiting payment confirmation */}
      {awaitingPayment && (
        <Card className="mt-6 bg-amber-50">
          <p className="text-sm text-amber-700">
            ✅ Work completed. Please pay <strong>{formatPKR(job.price)}</strong> in cash. Once your pro
            confirms payment, you can leave a rating.
          </p>
        </Card>
      )}

      {/* Rating */}
      {canReview && (
        <Card className="mt-6">
          <h2 className="font-semibold text-slate-900">Rate your pro</h2>
          <form onSubmit={submitReview} className="mt-3 space-y-3">
            <div className="flex gap-1 text-2xl">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={n <= rating ? "text-amber-400" : "text-slate-300"}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              className={inputClass}
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the service? (optional)"
            />
            <Button type="submit" disabled={busy}>
              Submit rating
            </Button>
          </form>
        </Card>
      )}

      {/* Chat */}
      {job.provider_id && user && (
        <Card className="mt-6">
          <h2 className="mb-2 font-semibold text-slate-900">Messages</h2>
          <JobChat jobId={jobId} userId={user.id} />
        </Card>
      )}

      {canCancel && (
        <div className="mt-6">
          {showCancel ? (
            <Card className="border-rose-200">
              <p className="text-sm font-medium text-slate-800">Why are you cancelling?</p>
              <select className={`${inputClass} mt-2`} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
                <option value="">Select a reason…</option>
                <option>Changed my mind</option>
                <option>Booked by mistake</option>
                <option>Found another provider</option>
                <option>Pro not responding</option>
                <option>Scheduling conflict</option>
                <option>Other</option>
              </select>
              <div className="mt-3 flex gap-2">
                <Button variant="danger" disabled={busy} onClick={cancelJob}>
                  Confirm cancellation
                </Button>
                <Button variant="outline" onClick={() => setShowCancel(false)}>
                  Keep booking
                </Button>
              </div>
            </Card>
          ) : (
            <Button variant="danger" onClick={() => setShowCancel(true)}>
              Cancel booking
            </Button>
          )}
        </div>
      )}

      {user && job.provider_id && (
        <div className="mt-6">
          <DisputeButton jobId={jobId} userId={user.id} />
        </div>
      )}
    </AppShell>
  );
}

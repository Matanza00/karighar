"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/useUser";
import { AppShell } from "@/components/AppShell";
import { Card, Badge, LinkButton, formatPKR, Spinner, EmptyState } from "@/components/ui";
import { JOB_STATUS_LABEL, type Job } from "@/lib/types";

const OPEN = new Set(["created", "bidding", "assigned", "en_route", "arrived", "in_progress", "completed"]);

export default function BookingsPage() {
  const { user, loading } = useRequireAuth("/bookings");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      setJobs((data as Job[]) || []);
      setFetching(false);
    })();
  }, [user]);

  if (loading || !user) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My bookings</h1>
        <LinkButton href="/book">Book a service</LinkButton>
      </div>

      {fetching ? (
        <Spinner />
      ) : jobs.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon="🧰" title="No bookings yet" hint="Book a plumber, electrician or AC technician in a couple of taps.">
            <LinkButton href="/book">Book your first service</LinkButton>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/bookings/${job.id}`}>
              <Card className="transition hover:border-brand-300 hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{job.title}</h3>
                      {job.type === "custom" && <Badge tone="amber">Custom</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{job.address}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {job.scheduled_at ? new Date(job.scheduled_at).toLocaleString("en-PK") : "No time set"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={OPEN.has(job.status) ? "brand" : "slate"}>
                      {JOB_STATUS_LABEL[job.status]}
                    </Badge>
                    <p className="mt-2 font-semibold text-slate-800">{formatPKR(job.price)}</p>
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

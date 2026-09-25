"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, Button, Field, inputClass, Badge, formatPKR } from "@/components/ui";
import { MapPicker } from "@/components/maps/MapPicker";
import { KARACHI_AREAS, type Service } from "@/lib/types";
import type { LatLng } from "@/lib/maps";

function BookServiceContent() {
  const serviceId = useSearchParams().get("id") ?? "";
  const router = useRouter();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  const [area, setArea] = useState(KARACHI_AREAS[0]);
  const [address, setAddress] = useState("");
  const [pos, setPos] = useState<LatLng | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.from("services").select("*").eq("id", serviceId).single();
      setService(data as Service | null);
      setLoading(false);
    })();
  }, [serviceId]);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/signin?next=${encodeURIComponent(`/book/service/?id=${serviceId}`)}`);
      return;
    }
    if (!service) return;

    const fullAddress = `${address}, ${area}, Karachi`;
    const scheduledAt = date && time ? new Date(`${date}T${time}`).toISOString() : null;

    // Ensure a customer profile row exists (FK target for jobs).
    await supabase.from("customers").upsert(
      { profile_id: user.id, default_address: fullAddress },
      { onConflict: "profile_id" }
    );

    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .insert({
        customer_id: user.id,
        type: "fixed",
        service_id: service.id,
        title: service.name,
        description: notes || null,
        status: "created",
        address: fullAddress,
        lat: pos?.lat ?? null,
        lng: pos?.lng ?? null,
        scheduled_at: scheduledAt,
        price: service.base_price,
        commission_rate: 0.2,
      })
      .select("id")
      .single();

    if (jobErr) {
      setError(jobErr.message);
      setBusy(false);
      return;
    }
    router.push(`/bookings/view/?id=${job!.id}&new=1`);
  }

  if (loading) {
    return (
      <AppShell width="narrow">
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }
  if (!service) {
    return (
      <AppShell width="narrow">
        <p className="text-slate-500">Service not found.</p>
      </AppShell>
    );
  }

  return (
    <AppShell width="narrow">
      <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-brand-700">
        ← Back
      </button>

      <Card className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{service.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{service.description}</p>
          </div>
          <Badge tone={service.base_price === null ? "amber" : "brand"}>
            {formatPKR(service.base_price)}
          </Badge>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          per {service.unit}
          {service.visit_fee > 0 && ` · visit fee ${formatPKR(service.visit_fee)} (waived if booked)`}
        </div>
      </Card>

      <form onSubmit={confirm} className="mt-6 space-y-4">
        <Field label="Area">
          <select className={inputClass} value={area} onChange={(e) => setArea(e.target.value)}>
            {KARACHI_AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </Field>
        <Field label="Address" hint="House / flat, street, landmark.">
          <input
            className={inputClass}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            placeholder="e.g. House 12, Street 4, near Expo Centre"
          />
        </Field>
        <Field label="Pin your exact location">
          <MapPicker
            value={pos}
            onChange={(p, addr) => {
              setPos(p);
              if (addr && !address) setAddress(addr);
            }}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Time">
            <input className={inputClass} type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </Field>
        </div>
        <Field label="Notes for the pro (optional)">
          <textarea
            className={inputClass}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the problem, e.g. AC not cooling, water leaking under sink…"
          />
        </Field>

        <Card className="bg-slate-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Estimated total</span>
            <span className="font-bold text-slate-900">{formatPKR(service.base_price)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Pay cash on completion. Final price confirmed by the pro after inspection.
          </p>
        </Card>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Booking…" : "Confirm booking"}
        </Button>
      </form>
    </AppShell>
  );
}

export default function BookServicePage() {
  return (
    <Suspense
      fallback={
        <AppShell width="narrow">
          <p className="text-slate-500">Loading…</p>
        </AppShell>
      }
    >
      <BookServiceContent />
    </Suspense>
  );
}

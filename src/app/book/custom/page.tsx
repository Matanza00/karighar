"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, Button, Field, inputClass } from "@/components/ui";
import { MapPicker } from "@/components/maps/MapPicker";
import { KARACHI_AREAS, type ServiceCategory } from "@/lib/types";
import type { LatLng } from "@/lib/maps";

export default function CustomJobPage() {
  const router = useRouter();
  const [cats, setCats] = useState<ServiceCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState(KARACHI_AREAS[0]);
  const [address, setAddress] = useState("");
  const [pos, setPos] = useState<LatLng | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("service_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      const list = (data as ServiceCategory[]) || [];
      setCats(list);
      if (list[0]) setCategoryId(list[0].id);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/signin?next=${encodeURIComponent("/book/custom")}`);
      return;
    }

    const fullAddress = `${address}, ${area}, Karachi`;
    const scheduledAt = date && time ? new Date(`${date}T${time}`).toISOString() : null;
    const catName = cats.find((c) => c.id === categoryId)?.name ?? "Custom job";

    await supabase.from("customers").upsert(
      { profile_id: user.id, default_address: fullAddress },
      { onConflict: "profile_id" }
    );

    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .insert({
        customer_id: user.id,
        type: "custom",
        service_id: null,
        title: title || catName,
        description,
        status: "bidding",
        address: fullAddress,
        lat: pos?.lat ?? null,
        lng: pos?.lng ?? null,
        scheduled_at: scheduledAt,
        price: null,
        commission_rate: 0.15,
      })
      .select("id")
      .single();

    if (jobErr) {
      setError(jobErr.message);
      setBusy(false);
      return;
    }
    router.push(`/bookings/${job!.id}?new=1`);
  }

  return (
    <AppShell width="narrow">
      <h1 className="text-2xl font-bold text-slate-900">Post a custom job</h1>
      <p className="mt-1 text-sm text-slate-500">
        Describe your job and verified pros will send you quotes. You pick the one you like.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Category">
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Job title">
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Install 2 ceiling fans and fix wiring"
          />
        </Field>
        <Field label="Describe the job">
          <textarea
            className={inputClass}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Give as much detail as you can so pros can quote accurately."
          />
        </Field>
        <Field label="Area">
          <select className={inputClass} value={area} onChange={(e) => setArea(e.target.value)}>
            {KARACHI_AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </Field>
        <Field label="Address">
          <input
            className={inputClass}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            placeholder="House / flat, street, landmark"
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
          <Field label="Preferred date">
            <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Preferred time">
            <input className={inputClass} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Posting…" : "Post job & get quotes"}
        </Button>
      </form>
    </AppShell>
  );
}

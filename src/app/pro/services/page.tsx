"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/useUser";
import { AppShell } from "@/components/AppShell";
import { Card, Button } from "@/components/ui";
import { KARACHI_AREAS, type ServiceCategory, type Service } from "@/lib/types";
import { clsx } from "@/lib/clsx";

export default function ProviderServicesPage() {
  const { user, loading } = useRequireAuth("/pro/services");
  const [cats, setCats] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const [{ data: c }, { data: s }, { data: prov }, { data: ps }] = await Promise.all([
      supabase.from("service_categories").select("*").order("sort_order"),
      supabase.from("services").select("*"),
      supabase.from("providers").select("service_areas").eq("profile_id", user.id).maybeSingle(),
      supabase.from("provider_services").select("service_id").eq("provider_id", user.id),
    ]);
    const svcList = (s as Service[]) || [];
    setCats((c as ServiceCategory[]) || []);
    setServices(svcList);
    setAreas(((prov as { service_areas: string[] } | null)?.service_areas) || []);
    const myServiceIds = new Set(((ps as { service_id: string }[]) || []).map((r) => r.service_id));
    const myCats = new Set(svcList.filter((sv) => myServiceIds.has(sv.id)).map((sv) => sv.category_id));
    setSelectedCats([...myCats]);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function save() {
    if (!user) return;
    setBusy(true);
    setSaved(false);
    const supabase = createClient();
    await supabase.from("providers").update({ service_areas: areas }).eq("profile_id", user.id);

    const desired = services.filter((s) => selectedCats.includes(s.category_id)).map((s) => s.id);
    // Remove services no longer offered, then upsert the current set.
    await supabase.from("provider_services").delete().eq("provider_id", user.id);
    if (desired.length) {
      await supabase
        .from("provider_services")
        .upsert(desired.map((id) => ({ provider_id: user.id, service_id: id })), {
          onConflict: "provider_id,service_id",
        });
    }
    setBusy(false);
    setSaved(true);
  }

  if (loading || !user) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-slate-900">My services</h1>
      <p className="mt-1 text-sm text-slate-500">Choose what you offer and where you work.</p>

      <Card className="mt-6">
        <h2 className="font-semibold text-slate-900">Services you offer</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => toggle(selectedCats, setSelectedCats, c.id)}
              className={clsx(
                "rounded-full border px-3 py-1.5 text-sm font-medium",
                selectedCats.includes(c.id)
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-300 text-slate-600 hover:border-brand-400"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-900">Areas you cover</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {KARACHI_AREAS.map((a) => (
            <button
              key={a}
              onClick={() => toggle(areas, setAreas, a)}
              className={clsx(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                areas.includes(a)
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-300 text-slate-600 hover:border-brand-400"
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-6 flex items-center gap-3">
        <Button disabled={busy} onClick={save}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
        {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
      </div>
    </AppShell>
  );
}

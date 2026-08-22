"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Card, Button, Badge, inputClass } from "@/components/ui";
import type { Service, ServiceCategory } from "@/lib/types";

export default function AdminCatalog() {
  const [cats, setCats] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from("service_categories").select("*").order("sort_order"),
      supabase.from("services").select("*"),
    ]);
    setCats((c as ServiceCategory[]) || []);
    setServices((s as Service[]) || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function savePrice(svc: Service) {
    const raw = edits[svc.id];
    if (raw === undefined) return;
    setBusy(svc.id);
    const value = raw === "" ? null : Number(raw);
    await createClient().from("services").update({ base_price: value }).eq("id", svc.id);
    await load();
    setBusy(null);
  }

  async function toggleActive(svc: Service) {
    setBusy(svc.id);
    await createClient().from("services").update({ is_active: !svc.is_active }).eq("id", svc.id);
    await load();
    setBusy(null);
  }

  return (
    <AdminShell>
      <div className="space-y-8">
        {cats.map((cat) => (
          <section key={cat.id}>
            <h2 className="text-lg font-bold text-slate-900">{cat.name}</h2>
            <div className="mt-3 space-y-2">
              {services
                .filter((s) => s.category_id === cat.id)
                .map((svc) => (
                  <Card key={svc.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{svc.name}</span>
                          {!svc.is_active && <Badge tone="rose">Hidden</Badge>}
                        </div>
                        <p className="text-sm text-slate-500">
                          {svc.description} · per {svc.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Rs</span>
                        <input
                          className={`${inputClass} w-28`}
                          type="number"
                          defaultValue={svc.base_price ?? ""}
                          placeholder="quote"
                          onChange={(e) => setEdits((p) => ({ ...p, [svc.id]: e.target.value }))}
                        />
                        <Button className="px-3 py-1.5" disabled={busy === svc.id} onClick={() => savePrice(svc)}>
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          className="px-3 py-1.5"
                          disabled={busy === svc.id}
                          onClick={() => toggleActive(svc)}
                        >
                          {svc.is_active ? "Hide" : "Show"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}

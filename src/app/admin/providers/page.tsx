"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Card, Button, Badge } from "@/components/ui";
import type { Provider, ProviderStatus, Profile } from "@/lib/types";

type Row = Provider & { profile?: Profile };

const TONE: Record<ProviderStatus, "amber" | "green" | "rose" | "slate"> = {
  pending: "amber",
  approved: "green",
  rejected: "rose",
  suspended: "slate",
};

export default function AdminProviders() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: provs } = await supabase.from("providers").select("*").order("verified_at", { nullsFirst: true });
    const list = (provs as Provider[]) || [];
    const ids = list.map((p) => p.profile_id);
    const { data: profs } = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [] };
    setRows(list.map((p) => ({ ...p, profile: (profs as Profile[])?.find((x) => x.id === p.profile_id) })));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: ProviderStatus) {
    setBusy(id);
    await createClient()
      .from("providers")
      .update({ status, verified_at: status === "approved" ? new Date().toISOString() : null })
      .eq("profile_id", id);
    await load();
    setBusy(null);
  }

  const pending = rows.filter((r) => r.status === "pending");
  const others = rows.filter((r) => r.status !== "pending");

  return (
    <AdminShell>
      <section>
        <h2 className="text-lg font-bold text-slate-900">Awaiting verification ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nothing pending 🎉</p>
        ) : (
          <div className="mt-3 space-y-3">
            {pending.map((r) => (
              <ProviderCard key={r.profile_id} r={r} busy={busy === r.profile_id} onSet={setStatus} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">All providers ({others.length})</h2>
        <div className="mt-3 space-y-3">
          {others.map((r) => (
            <ProviderCard key={r.profile_id} r={r} busy={busy === r.profile_id} onSet={setStatus} />
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

function ProviderCard({
  r,
  busy,
  onSet,
}: {
  r: Row;
  busy: boolean;
  onSet: (id: string, s: ProviderStatus) => void;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{r.profile?.full_name ?? "Unnamed"}</h3>
            <Badge tone={TONE[r.status]}>{r.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {r.profile?.phone ?? "no phone"} · CNIC {r.cnic_no ?? "—"}
          </p>
          {r.bio && <p className="mt-1 text-sm text-slate-600">{r.bio}</p>}
          <p className="mt-1 text-xs text-slate-400">
            Areas: {r.service_areas?.length ? r.service_areas.join(", ") : "—"}
          </p>
        </div>
        <div className="flex gap-2">
          {r.status !== "approved" && (
            <Button className="px-3 py-1.5" disabled={busy} onClick={() => onSet(r.profile_id, "approved")}>
              Approve
            </Button>
          )}
          {r.status === "pending" && (
            <Button variant="danger" className="px-3 py-1.5" disabled={busy} onClick={() => onSet(r.profile_id, "rejected")}>
              Reject
            </Button>
          )}
          {r.status === "approved" && (
            <Button variant="outline" className="px-3 py-1.5" disabled={busy} onClick={() => onSet(r.profile_id, "suspended")}>
              Suspend
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

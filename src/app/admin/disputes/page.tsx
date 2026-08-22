"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Card, Button, Badge, inputClass } from "@/components/ui";
import { useToast } from "@/components/Toast";

type Dispute = {
  id: string;
  job_id: string;
  raised_by: string;
  reason: string;
  status: string;
  resolution: string | null;
  created_at: string;
};
type Row = Dispute & { jobTitle?: string; raiser?: string };

export default function AdminDisputes() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: disputes } = await supabase.from("disputes").select("*").order("created_at", { ascending: false });
    const list = (disputes as Dispute[]) || [];
    const jobIds = [...new Set(list.map((d) => d.job_id))];
    const userIds = [...new Set(list.map((d) => d.raised_by))];
    const [{ data: jobs }, { data: profs }] = await Promise.all([
      jobIds.length ? supabase.from("jobs").select("id,title").in("id", jobIds) : Promise.resolve({ data: [] }),
      userIds.length ? supabase.from("profiles").select("id,full_name").in("id", userIds) : Promise.resolve({ data: [] }),
    ]);
    setRows(
      list.map((d) => ({
        ...d,
        jobTitle: (jobs as { id: string; title: string }[])?.find((j) => j.id === d.job_id)?.title,
        raiser: (profs as { id: string; full_name: string }[])?.find((p) => p.id === d.raised_by)?.full_name,
      }))
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function resolve(row: Row) {
    setBusy(row.id);
    const { error } = await createClient()
      .from("disputes")
      .update({ status: "resolved", resolution: notes[row.id] ?? "Resolved" })
      .eq("id", row.id);
    setBusy(null);
    if (error) {
      toast(error.message, "error");
      return;
    }
    toast("Dispute resolved", "success");
    await load();
  }

  const open = rows.filter((r) => r.status !== "resolved");
  const resolved = rows.filter((r) => r.status === "resolved");

  return (
    <AdminShell>
      <h2 className="text-lg font-bold text-slate-900">Open disputes ({open.length})</h2>
      {open.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No open disputes 🎉</p>
      ) : (
        <div className="mt-3 space-y-3">
          {open.map((d) => (
            <Card key={d.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/admin/jobs`} className="font-semibold text-slate-900 hover:text-brand-700">
                    {d.jobTitle ?? "Job"}
                  </Link>
                  <p className="text-xs text-slate-400">
                    by {d.raiser ?? "user"} · {new Date(d.created_at).toLocaleString("en-PK")}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{d.reason}</p>
                </div>
                <Badge tone="amber">{d.status}</Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className={inputClass}
                  placeholder="Resolution note…"
                  value={notes[d.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                />
                <Button className="px-3 py-1.5" disabled={busy === d.id} onClick={() => resolve(d)}>
                  Resolve
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-bold text-slate-900">Resolved ({resolved.length})</h2>
          <div className="mt-3 space-y-2">
            {resolved.map((d) => (
              <Card key={d.id} className="p-4">
                <p className="font-medium text-slate-900">{d.jobTitle ?? "Job"}</p>
                <p className="text-sm text-slate-600">{d.reason}</p>
                {d.resolution && <p className="mt-1 text-sm text-emerald-700">✓ {d.resolution}</p>}
              </Card>
            ))}
          </div>
        </>
      )}
    </AdminShell>
  );
}

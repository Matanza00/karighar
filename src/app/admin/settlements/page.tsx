"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Card, Button, inputClass, formatPKR } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { summarizeLedger, type LedgerEntry, type LedgerSummary } from "@/lib/money";
import type { Profile } from "@/lib/types";

type Row = { id: string; name: string; phone: string | null; summary: LedgerSummary };

export default function AdminSettlements() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: ledger } = await supabase.from("provider_ledger").select("provider_id,type,amount");
    const byProvider = new Map<string, LedgerEntry[]>();
    ((ledger as { provider_id: string; type: LedgerEntry["type"]; amount: number }[]) || []).forEach((e) => {
      const list = byProvider.get(e.provider_id) ?? [];
      list.push({ type: e.type, amount: e.amount });
      byProvider.set(e.provider_id, list);
    });
    const ids = [...byProvider.keys()];
    const { data: profs } = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [] };
    const result: Row[] = ids.map((id) => {
      const p = (profs as Profile[])?.find((x) => x.id === id);
      return { id, name: p?.full_name ?? "Pro", phone: p?.phone ?? null, summary: summarizeLedger(byProvider.get(id)!) };
    });
    result.sort((a, b) => b.summary.commissionOwed - a.summary.commissionOwed);
    setRows(result);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function settle(row: Row) {
    const raw = amounts[row.id];
    const amount = raw ? Number(raw) : row.summary.commissionOwed;
    if (!amount || amount <= 0) {
      toast("Enter a valid amount", "error");
      return;
    }
    setBusy(row.id);
    const { error } = await createClient().rpc("record_settlement", { p_provider: row.id, p_amount: amount });
    setBusy(null);
    if (error) {
      toast(error.message, "error");
      return;
    }
    toast(`Recorded ${formatPKR(amount)} settlement`, "success");
    setAmounts((a) => ({ ...a, [row.id]: "" }));
    await load();
  }

  const totalOwed = rows.reduce((s, r) => s + r.summary.commissionOwed, 0);

  return (
    <AdminShell>
      <Card className="mb-6">
        <p className="text-sm text-slate-500">Total commission outstanding</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatPKR(totalOwed)}</p>
      </Card>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No provider earnings yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.phone ?? "—"}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Net earned {formatPKR(r.summary.netEarnings)} · commission gross {formatPKR(r.summary.commissionGross)} · settled {formatPKR(r.summary.settled)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Owed</p>
                    <p className="font-bold text-amber-600">{formatPKR(r.summary.commissionOwed)}</p>
                  </div>
                  <input
                    className={`${inputClass} w-28`}
                    type="number"
                    placeholder={String(r.summary.commissionOwed)}
                    value={amounts[r.id] ?? ""}
                    onChange={(e) => setAmounts((a) => ({ ...a, [r.id]: e.target.value }))}
                  />
                  <Button
                    className="px-3 py-1.5"
                    disabled={busy === r.id || r.summary.commissionOwed <= 0}
                    onClick={() => settle(r)}
                  >
                    Record
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

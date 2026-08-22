"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { inputClass } from "@/components/ui";

// "Report a problem" — lets a customer or provider raise a dispute on a job.
export function DisputeButton({ jobId, userId }: { jobId: string; userId: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!reason.trim()) return;
    setBusy(true);
    const { error } = await createClient().from("disputes").insert({
      job_id: jobId,
      raised_by: userId,
      reason: reason.trim(),
    });
    setBusy(false);
    if (error) {
      toast(error.message, "error");
      return;
    }
    setDone(true);
    setOpen(false);
    setReason("");
    toast("Reported. Our team will look into it.", "success");
  }

  if (done) {
    return <p className="text-center text-xs text-slate-400">Problem reported — support will follow up.</p>;
  }

  return (
    <div className="text-center">
      {open ? (
        <div className="space-y-2 text-left">
          <textarea
            className={inputClass}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the problem…"
          />
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={busy}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {busy ? "Sending…" : "Submit report"}
            </button>
            <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="text-xs font-medium text-slate-400 hover:text-rose-600">
          ⚠ Report a problem
        </button>
      )}
    </div>
  );
}

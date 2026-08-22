"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/useUser";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import { clsx } from "@/lib/clsx";
import type { Notification } from "@/lib/types";

export default function NotificationsPage() {
  const { user, loading } = useRequireAuth("/notifications");
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    createClient()
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Notification[]) || []));
  }, [user]);

  async function open(n: Notification) {
    if (!n.read) await createClient().from("notifications").update({ read: true }).eq("id", n.id);
    if (n.job_id) router.push(`/bookings/${n.job_id}`);
  }

  if (loading || !user) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell width="narrow">
      <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">You&apos;re all caught up.</p>
      ) : (
        <div className="mt-6 space-y-2">
          {items.map((n) => (
            <button key={n.id} onClick={() => open(n)} className="block w-full text-left">
              <Card className={clsx("p-4 transition hover:border-brand-300", !n.read && "border-brand-200 bg-brand-50/40")}>
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                  <div>
                    <p className="font-medium text-slate-900">{n.title}</p>
                    {n.body && <p className="text-sm text-slate-500">{n.body}</p>}
                    <p className="mt-0.5 text-xs text-slate-400">{new Date(n.created_at).toLocaleString("en-PK")}</p>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}

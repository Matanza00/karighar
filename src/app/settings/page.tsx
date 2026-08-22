"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/useUser";
import { AppShell } from "@/components/AppShell";
import { Card, Button } from "@/components/ui";

// Lightweight local preferences (persisted in localStorage for the MVP).
function useLocalToggle(key: string, initial: boolean) {
  const [on, setOn] = useState(initial);
  useEffect(() => {
    const v = localStorage.getItem(key);
    if (v !== null) setOn(v === "1");
  }, [key]);
  function toggle() {
    setOn((prev) => {
      localStorage.setItem(key, prev ? "0" : "1");
      return !prev;
    });
  }
  return [on, toggle] as const;
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-6 w-11 rounded-full transition ${on ? "bg-brand-600" : "bg-slate-300"}`}
    >
      <span className={`block h-5 w-5 rounded-full bg-white transition ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { user, loading } = useRequireAuth("/settings");
  const router = useRouter();
  const [notif, toggleNotif] = useLocalToggle("pref_notifications", true);
  const [urdu, toggleUrdu] = useLocalToggle("pref_urdu", false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  async function resetPassword() {
    if (!user?.email) return;
    await createClient().auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/signin`,
    });
    setPwMsg("Password reset link sent to your email.");
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading || !user) {
    return (
      <AppShell width="narrow">
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell width="narrow">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      <Card className="mt-6 divide-y divide-slate-100 p-0">
        <Row label="Push notifications" desc="Job updates & messages">
          <Toggle on={notif} onClick={toggleNotif} />
        </Row>
        <Row label="اردو (Urdu)" desc="Switch app language (coming soon)">
          <Toggle on={urdu} onClick={toggleUrdu} />
        </Row>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-900">Account</h2>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        <Button variant="outline" className="mt-3" onClick={resetPassword}>
          Change password
        </Button>
        {pwMsg && <p className="mt-2 text-sm text-emerald-600">{pwMsg}</p>}
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-900">About</h2>
        <p className="mt-1 text-sm text-slate-500">KARIGHAR · Karachi · v1 (MVP)</p>
      </Card>

      <div className="mt-6">
        <Button variant="danger" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </AppShell>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <p className="font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      {children}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/useUser";
import { AppShell } from "@/components/AppShell";
import { Card, Button, Field, inputClass, Badge } from "@/components/ui";
import type { Provider } from "@/lib/types";

export default function ProfilePage() {
  const { user, profile, loading } = useRequireAuth("/profile");
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState<Provider | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
    if (user && profile?.role === "provider") {
      createClient()
        .from("providers")
        .select("*")
        .eq("profile_id", user.id)
        .maybeSingle()
        .then(({ data }) => setProvider(data as Provider | null));
    }
  }, [profile, user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setSaved(false);
    await createClient().from("profiles").update({ full_name: fullName, phone }).eq("id", user.id);
    setBusy(false);
    setSaved(true);
    router.refresh();
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

  const initial = (fullName || "?").charAt(0).toUpperCase();

  return (
    <AppShell width="narrow">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white">
          {initial}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{fullName || "Your profile"}</h1>
          <p className="text-sm capitalize text-slate-500">
            {profile?.role} {provider && <Badge tone={provider.status === "approved" ? "green" : "amber"}>{provider.status}</Badge>}
          </p>
        </div>
      </div>

      {provider?.status === "approved" && (
        <Card className="mt-4 bg-slate-50">
          <p className="text-sm text-slate-600">
            ⭐ {provider.rating_avg?.toFixed(1) ?? "New"} · {provider.jobs_completed} jobs completed
          </p>
        </Card>
      )}

      <form onSubmit={save} className="mt-6 space-y-4">
        <Field label="Full name">
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </Field>
        <Field label="Phone">
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
        </Field>
        <Field label="Email">
          <input className={`${inputClass} bg-slate-50 text-slate-500`} value={user.email ?? ""} disabled />
        </Field>
        {saved && <p className="text-sm text-emerald-600">Saved ✓</p>}
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <div className="mt-8 space-y-2">
        {profile?.role === "provider" ? (
          <Link href="/pro/services" className="block rounded-xl border border-slate-200 p-4 hover:border-brand-300">
            ⚙️ Manage my services & areas
          </Link>
        ) : (
          <Link href="/pro" className="block rounded-xl border border-slate-200 p-4 hover:border-brand-300">
            🧰 Become a service provider
          </Link>
        )}
        <Link href="/settings" className="block rounded-xl border border-slate-200 p-4 hover:border-brand-300">
          ⚙️ Settings
        </Link>
        <button
          onClick={signOut}
          className="w-full rounded-xl border border-slate-200 p-4 text-left text-rose-600 hover:border-rose-300"
        >
          ↩︎ Sign out
        </button>
      </div>
    </AppShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/useUser";
import { AppShell } from "@/components/AppShell";
import { Card, Button, Field, inputClass } from "@/components/ui";
import { KARACHI_AREAS, type ServiceCategory, type Provider } from "@/lib/types";
import { clsx } from "@/lib/clsx";

export default function ProviderOnboardingPage() {
  const { user, loading } = useRequireAuth("/pro/onboarding");
  const router = useRouter();

  const [cats, setCats] = useState<ServiceCategory[]>([]);
  const [existing, setExisting] = useState<Provider | null>(null);
  const [bio, setBio] = useState("");
  const [cnic, setCnic] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [cnicFront, setCnicFront] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      const [{ data: catData }, { data: prov }] = await Promise.all([
        supabase.from("service_categories").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("providers").select("*").eq("profile_id", user.id).maybeSingle(),
      ]);
      setCats((catData as ServiceCategory[]) || []);
      if (prov) {
        const p = prov as Provider;
        setExisting(p);
        setBio(p.bio ?? "");
        setCnic(p.cnic_no ?? "");
        setAreas(p.service_areas ?? []);
      }
    })();
  }, [user]);

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function tryUpload(file: File | null, name: string): Promise<string | null> {
    if (!file || !user) return null;
    const supabase = createClient();
    const path = `${user.id}/${name}-${file.name}`;
    const { error } = await supabase.storage.from("verification").upload(path, file, { upsert: true });
    if (error) {
      setWarn("Documents couldn't be uploaded (storage not set up yet) — you can add them later. Your profile was still submitted.");
      return null;
    }
    return path;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (selectedCats.length === 0) {
      setError("Pick at least one service you offer.");
      return;
    }
    setBusy(true);
    setError(null);
    setWarn(null);
    const supabase = createClient();

    await supabase.from("profiles").update({ role: "provider" }).eq("id", user.id);

    const frontPath = await tryUpload(cnicFront, "cnic-front");
    const selfiePath = await tryUpload(selfie, "selfie");

    const { error: provErr } = await supabase.from("providers").upsert(
      {
        profile_id: user.id,
        cnic_no: cnic,
        bio,
        service_areas: areas,
        status: "pending",
        ...(frontPath ? { cnic_front_url: frontPath } : {}),
        ...(selfiePath ? { selfie_url: selfiePath } : {}),
      },
      { onConflict: "profile_id" }
    );
    if (provErr) {
      setError(provErr.message);
      setBusy(false);
      return;
    }

    // Map chosen categories -> all their services -> provider_services.
    const { data: svcs } = await supabase.from("services").select("id").in("category_id", selectedCats);
    const rows = (svcs as { id: string }[]).map((s) => ({ provider_id: user.id, service_id: s.id }));
    if (rows.length) await supabase.from("provider_services").upsert(rows, { onConflict: "provider_id,service_id" });

    router.push("/pro/dashboard");
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
      <h1 className="text-2xl font-bold text-slate-900">
        {existing ? "Update your pro profile" : "Set up your pro profile"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {existing?.status === "approved"
          ? "You're approved and live 🎉"
          : "We'll review your details and verify you (usually 1–2 days)."}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <Field label="Short bio" hint="Tell customers about your experience.">
          <textarea
            className={inputClass}
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="e.g. 8 years of AC service & installation experience across Karachi."
          />
        </Field>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Services you offer</p>
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                type="button"
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
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Areas you cover</p>
          <div className="flex flex-wrap gap-2">
            {KARACHI_AREAS.map((a) => (
              <button
                type="button"
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
        </div>

        <Field label="CNIC number">
          <input
            className={inputClass}
            value={cnic}
            onChange={(e) => setCnic(e.target.value)}
            required
            placeholder="42101-XXXXXXX-X"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="CNIC photo" hint="Front side">
            <input type="file" accept="image/*" onChange={(e) => setCnicFront(e.target.files?.[0] ?? null)} />
          </Field>
          <Field label="Selfie" hint="Clear face photo">
            <input type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] ?? null)} />
          </Field>
        </div>

        {warn && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">{warn}</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Submitting…" : existing ? "Save changes" : "Submit for verification"}
        </Button>
      </form>

      {existing && (
        <Card className="mt-6 bg-slate-50">
          <p className="text-sm text-slate-600">
            Verification status:{" "}
            <span className="font-semibold capitalize text-slate-900">{existing.status}</span>
          </p>
        </Card>
      )}
    </AppShell>
  );
}

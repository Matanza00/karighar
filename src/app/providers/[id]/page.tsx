"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, Badge, Spinner } from "@/components/ui";

type PublicProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  rating_avg: number;
  jobs_completed: number;
  service_areas: string[];
};
type Review = { id: string; rating: number; comment: string | null; created_at: string };

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400">
      {"★".repeat(Math.round(n))}
      <span className="text-slate-200">{"★".repeat(5 - Math.round(n))}</span>
    </span>
  );
}

export default function ProviderProfilePage() {
  const id = useParams<{ id: string }>().id;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [{ data: prof }, { data: revs }] = await Promise.all([
        supabase.from("public_provider_profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("reviews").select("id,rating,comment,created_at").eq("provider_id", id).order("created_at", { ascending: false }).limit(20),
      ]);
      setProfile(prof as PublicProfile | null);
      setReviews((revs as Review[]) || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <AppShell width="narrow">
        <Spinner />
      </AppShell>
    );
  }
  if (!profile) {
    return (
      <AppShell width="narrow">
        <p className="text-slate-500">Provider not found.</p>
      </AppShell>
    );
  }

  const initial = (profile.full_name || "?").charAt(0).toUpperCase();

  return (
    <AppShell width="narrow">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white">
          {initial}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{profile.full_name ?? "Provider"}</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            <Stars n={profile.rating_avg} /> {profile.rating_avg?.toFixed(1) ?? "New"} · {profile.jobs_completed} jobs
          </p>
        </div>
      </div>

      {profile.bio && <p className="mt-4 text-sm leading-relaxed text-slate-600">{profile.bio}</p>}

      {profile.service_areas?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.service_areas.map((a) => (
            <Badge key={a} tone="slate">
              {a}
            </Badge>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-lg font-bold text-slate-900">Reviews ({reviews.length})</h2>
      {reviews.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No reviews yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {reviews.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-center justify-between">
                <Stars n={r.rating} />
                <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString("en-PK")}</span>
              </div>
              {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

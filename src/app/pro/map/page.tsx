"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { createClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/useUser";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import { MapGate } from "@/components/maps/MapGate";
import { GOOGLE_MAPS_KEY, KARACHI_CENTER } from "@/lib/maps";
import type { Job } from "@/lib/types";

export default function ProviderMapPage() {
  const { user, loading } = useRequireAuth("/pro/map");
  const router = useRouter();
  const [mine, setMine] = useState<Job[]>([]);
  const [open, setOpen] = useState<Job[]>([]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      const [{ data: m }, { data: o }] = await Promise.all([
        supabase
          .from("jobs")
          .select("*")
          .eq("provider_id", user.id)
          .in("status", ["assigned", "en_route", "arrived", "in_progress"]),
        supabase.from("jobs").select("*").is("provider_id", null).in("status", ["created", "bidding"]),
      ]);
      setMine((m as Job[])?.filter((j) => j.lat != null) || []);
      setOpen((o as Job[])?.filter((j) => j.lat != null) || []);
    })();
  }, [user]);

  if (loading || !user) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-slate-900">Jobs map</h1>
      <p className="mt-1 text-sm text-slate-500">
        🟢 your active jobs · 🟠 available jobs. Tap a pin to open it.
      </p>

      {!GOOGLE_MAPS_KEY ? (
        <Card className="mt-6 border-amber-200 bg-amber-50 text-amber-700">
          Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code> to enable the map.
        </Card>
      ) : (
        <div className="mt-6 h-[70vh] w-full overflow-hidden rounded-2xl border border-slate-200">
          <APIProvider apiKey={GOOGLE_MAPS_KEY}>
            <MapGate>
            <Map defaultCenter={KARACHI_CENTER} defaultZoom={12} gestureHandling="greedy" disableDefaultUI zoomControl>
              {mine.map((j) => (
                <Marker
                  key={j.id}
                  position={{ lat: j.lat!, lng: j.lng! }}
                  title={j.title}
                  icon={pin("#0f766e")}
                  onClick={() => router.push(`/pro/jobs/view/?id=${j.id}`)}
                />
              ))}
              {open.map((j) => (
                <Marker
                  key={j.id}
                  position={{ lat: j.lat!, lng: j.lng! }}
                  title={`${j.title} (available)`}
                  icon={pin("#f59e0b")}
                  onClick={() => router.push(`/pro/dashboard`)}
                />
              ))}
            </Map>
            </MapGate>
          </APIProvider>
        </div>
      )}

      {mine.length === 0 && open.length === 0 && (
        <p className="mt-4 text-sm text-slate-400">No jobs with a pinned location yet.</p>
      )}
    </AppShell>
  );
}

function pin(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="10" fill="${color}" stroke="white" stroke-width="3"/></svg>`;
  return { url: "data:image/svg+xml;utf8," + encodeURIComponent(svg) };
}

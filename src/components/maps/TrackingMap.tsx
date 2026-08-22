"use client";

import { useEffect, useState } from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { createClient } from "@/lib/supabase/client";
import { MapController } from "@/components/maps/MapController";
import { MapGate } from "@/components/maps/MapGate";
import { GOOGLE_MAPS_KEY, KARACHI_CENTER, type LatLng } from "@/lib/maps";

// Customer-facing: shows the destination pin + the pro's live location.
export function TrackingMap({ jobId, destination }: { jobId: string; destination: LatLng | null }) {
  const [proPos, setProPos] = useState<LatLng | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("job_tracking")
        .select("provider_lat,provider_lng")
        .eq("job_id", jobId)
        .maybeSingle();
      if (data?.provider_lat != null) setProPos({ lat: data.provider_lat, lng: data.provider_lng });
    })();

    const channel = supabase
      .channel(`track:${jobId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_tracking", filter: `job_id=eq.${jobId}` },
        (payload) => {
          const row = payload.new as { provider_lat: number | null; provider_lng: number | null };
          if (row.provider_lat != null && row.provider_lng != null)
            setProPos({ lat: row.provider_lat, lng: row.provider_lng });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  if (!GOOGLE_MAPS_KEY) return null;
  const center = proPos ?? destination ?? KARACHI_CENTER;

  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY}>
      <div className="h-56 w-full overflow-hidden rounded-xl border border-slate-200">
        <MapGate>
          <Map defaultCenter={center} defaultZoom={13} gestureHandling="greedy" disableDefaultUI zoomControl>
            <MapController target={proPos} />
            {destination && <Marker position={destination} title="Service location" />}
            {proPos && (
              <Marker position={proPos} title="Your pro" icon={{ url: "data:image/svg+xml;utf8," + encodeURIComponent(PRO_PIN) }} />
            )}
          </Map>
        </MapGate>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {proPos ? "🔵 Your pro’s live location · 📍 service location" : "Waiting for your pro to share their location…"}
      </p>
    </APIProvider>
  );
}

const PRO_PIN = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="9" fill="#0f766e" stroke="white" stroke-width="3"/></svg>`;

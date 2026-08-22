"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Provider-side: shares live GPS location to job_tracking so the customer can follow.
export function ProviderTracker({ jobId, autoStart }: { jobId: string; autoStart: boolean }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (autoStart) start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  function start() {
    if (!navigator.geolocation) {
      setError("Location not supported on this device.");
      return;
    }
    setError(null);
    setSharing(true);
    const supabase = createClient();
    watchId.current = navigator.geolocation.watchPosition(
      async (p) => {
        await supabase.from("job_tracking").upsert(
          {
            job_id: jobId,
            provider_lat: p.coords.latitude,
            provider_lng: p.coords.longitude,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "job_id" }
        );
      },
      () => setError("Couldn't access location. Enable GPS/location permission."),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }

  function stop() {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setSharing(false);
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
      <div>
        <p className="text-sm font-medium text-slate-800">
          {sharing ? "🟢 Sharing your live location" : "Location sharing off"}
        </p>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {!error && <p className="text-xs text-slate-400">Lets the customer see you approaching.</p>}
      </div>
      <button
        onClick={sharing ? stop : start}
        className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
          sharing ? "bg-slate-100 text-slate-600" : "bg-brand-600 text-white"
        }`}
      >
        {sharing ? "Stop" : "Share location"}
      </button>
    </div>
  );
}

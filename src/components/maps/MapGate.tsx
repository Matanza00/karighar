"use client";

import { APILoadingStatus, useApiLoadingStatus } from "@vis.gl/react-google-maps";

// Renders a friendly fallback instead of a broken grey map when the Google
// Maps API fails to load (e.g. billing not enabled, key restricted, quota).
export function MapGate({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.AUTH_FAILURE || status === APILoadingStatus.FAILED) {
    return (
      <div
        className={`flex ${compact ? "h-32" : "h-full"} w-full flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center`}
      >
        <span className="text-2xl">🗺️</span>
        <p className="text-sm font-medium text-slate-600">Map preview unavailable</p>
        <p className="text-xs text-slate-400">
          Enable billing for the Google Maps key. Location can still be set by address.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

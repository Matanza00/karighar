"use client";

import { useEffect, useState } from "react";
import { APIProvider, Map, Marker, useMapsLibrary } from "@vis.gl/react-google-maps";
import { MapController } from "@/components/maps/MapController";
import { MapGate } from "@/components/maps/MapGate";
import { GOOGLE_MAPS_KEY, KARACHI_CENTER, type LatLng } from "@/lib/maps";

// Lets a customer drop/drag a pin to mark the service location.
export function MapPicker({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (pos: LatLng, address?: string) => void;
}) {
  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        Map unavailable — set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code>.
      </div>
    );
  }
  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY}>
      <PickerInner value={value} onChange={onChange} />
    </APIProvider>
  );
}

function PickerInner({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (pos: LatLng, address?: string) => void;
}) {
  const geocodingLib = useMapsLibrary("geocoding");
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [panTarget, setPanTarget] = useState<LatLng | null>(null);
  const pos = value ?? KARACHI_CENTER;

  useEffect(() => {
    if (geocodingLib) setGeocoder(new geocodingLib.Geocoder());
  }, [geocodingLib]);

  function update(next: LatLng) {
    if (geocoder) {
      geocoder.geocode({ location: next }, (results, status) => {
        onChange(next, status === "OK" && results?.[0] ? results[0].formatted_address : undefined);
      });
    } else {
      onChange(next);
    }
  }

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        const ll = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPanTarget(ll);
        update(ll);
      },
      () => alert("Couldn't get your location. Drop the pin manually."),
      { enableHighAccuracy: true }
    );
  }

  return (
    <div className="space-y-2">
      <div className="h-64 w-full overflow-hidden rounded-xl border border-slate-200">
        <MapGate>
          <Map
            defaultCenter={pos}
            defaultZoom={13}
            gestureHandling="greedy"
            disableDefaultUI
            zoomControl
            onClick={(e) => e.detail.latLng && update(e.detail.latLng)}
          >
            <MapController target={panTarget} />
            <Marker
              position={pos}
              draggable
              onDragEnd={(e) => {
                const ll = e.latLng;
                if (ll) update({ lat: ll.lat(), lng: ll.lng() });
              }}
            />
          </Map>
        </MapGate>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Tap the map or drag the pin to set the exact location.</span>
        <button type="button" onClick={useMyLocation} className="font-semibold text-brand-700">
          📍 Use my location
        </button>
      </div>
    </div>
  );
}

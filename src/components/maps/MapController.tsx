"use client";

import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/lib/maps";

// Imperatively pans the map when `target` changes — avoids the controlled/
// uncontrolled `center` conflict while still recentering programmatically.
export function MapController({ target }: { target: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (map && target) map.panTo(target);
  }, [map, target]);
  return null;
}

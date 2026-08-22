export const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// Karachi city centre — default map focus.
export const KARACHI_CENTER = { lat: 24.8607, lng: 67.0011 };

export type LatLng = { lat: number; lng: number };

// Seed catalog — mirrors supabase/schema.sql seed data.
// Used for the marketing/landing view until Supabase is connected.
// Once the DB is live, screens read this from the `services` table instead.

export type Service = {
  name: string;
  description: string;
  basePrice: number | null; // PKR; null = quote/custom
  unit: string;
  visitFee: number;
};

export type Category = {
  key: string;
  name: string;
  icon: string; // emoji placeholder until we add real icons
  services: Service[];
};

export const CATALOG: Category[] = [
  {
    key: "ac",
    name: "AC Service & Repair",
    icon: "❄️",
    services: [
      { name: "AC General Service", description: "Cleaning & servicing, 1–2.5 ton", basePrice: 1750, unit: "unit", visitFee: 500 },
      { name: "AC Installation", description: "Install with up to 10ft piping", basePrice: 2800, unit: "unit", visitFee: 500 },
      { name: "AC Gas Refill / Repair", description: "Diagnosis + gas top-up", basePrice: null, unit: "job", visitFee: 500 },
    ],
  },
  {
    key: "electrician",
    name: "Electrician",
    icon: "⚡",
    services: [
      { name: "Basic Visit / Minor Fix", description: "Switches, sockets, small faults", basePrice: 800, unit: "visit", visitFee: 0 },
      { name: "House Wiring", description: "Per square foot", basePrice: 65, unit: "sq ft", visitFee: 0 },
    ],
  },
  {
    key: "plumber",
    name: "Plumber",
    icon: "🔧",
    services: [
      { name: "Basic Visit / Leak Fix", description: "Leaks, taps, small repairs", basePrice: 800, unit: "visit", visitFee: 0 },
      { name: "Fixture Installation", description: "Tap, sink, commode install", basePrice: 1200, unit: "item", visitFee: 0 },
    ],
  },
];

export function formatPKR(amount: number | null): string {
  if (amount === null) return "On quote";
  return "Rs " + amount.toLocaleString("en-PK");
}

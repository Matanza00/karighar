// Input validation / normalization helpers (Pakistan-specific). Pure & testable.

// Normalize a Pakistani mobile number to +923XXXXXXXXX, or null if invalid.
// Accepts: 03001234567, 3001234567, +923001234567, 00923001234567, with spaces/dashes.
export function normalizePkPhone(input: string): string | null {
  let d = (input || "").replace(/\D/g, "");
  if (d.startsWith("0092")) d = d.slice(4);
  else if (d.startsWith("92")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  return /^3\d{9}$/.test(d) ? "+92" + d : null;
}

export function isValidPkPhone(input: string): boolean {
  return normalizePkPhone(input) !== null;
}

// CNIC is 13 digits, usually shown as #####-#######-#.
export function isValidCnic(input: string): boolean {
  return (input || "").replace(/\D/g, "").length === 13;
}

export function formatCnic(input: string): string {
  const d = (input || "").replace(/\D/g, "").slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

export function isNonEmpty(input: string, min = 2): boolean {
  return (input || "").trim().length >= min;
}

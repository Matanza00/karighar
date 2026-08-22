// Pure money/accounting helpers — no React, so they're unit-testable.

export function formatPKR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "On quote";
  return "Rs " + Number(amount).toLocaleString("en-PK");
}

export function commissionFor(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}

export function providerPayout(amount: number, rate: number): number {
  return Math.round((amount - commissionFor(amount, rate)) * 100) / 100;
}

export type LedgerEntry = { type: "earning" | "commission" | "payout" | "adjustment"; amount: number };

export type LedgerSummary = {
  netEarnings: number; // what the Pro keeps (payout portion)
  commissionGross: number; // total commission generated
  settled: number; // commission already remitted to the platform
  commissionOwed: number; // outstanding commission the Pro owes KARIGHAR
};

// COD model: 'earning' = provider payout, 'commission' stored negative,
// 'payout' = a recorded settlement (commission remitted to the platform).
export function summarizeLedger(entries: LedgerEntry[]): LedgerSummary {
  let netEarnings = 0;
  let commissionGross = 0;
  let settled = 0;
  for (const e of entries) {
    if (e.type === "earning") netEarnings += e.amount;
    else if (e.type === "commission") commissionGross += Math.abs(e.amount);
    else if (e.type === "payout") settled += e.amount;
    else if (e.type === "adjustment") settled += e.amount;
  }
  return {
    netEarnings: Math.round(netEarnings * 100) / 100,
    commissionGross: Math.round(commissionGross * 100) / 100,
    settled: Math.round(settled * 100) / 100,
    commissionOwed: Math.max(0, Math.round((commissionGross - settled) * 100) / 100),
  };
}

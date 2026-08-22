import { describe, it, expect } from "vitest";
import { formatPKR, commissionFor, providerPayout, summarizeLedger } from "./money";

describe("formatPKR", () => {
  it("formats numbers with Rs prefix", () => {
    expect(formatPKR(1750)).toBe("Rs 1,750");
    expect(formatPKR(0)).toBe("Rs 0");
  });
  it("shows 'On quote' for null/undefined", () => {
    expect(formatPKR(null)).toBe("On quote");
    expect(formatPKR(undefined)).toBe("On quote");
  });
});

describe("commission", () => {
  it("computes 20% commission and payout", () => {
    expect(commissionFor(1750, 0.2)).toBe(350);
    expect(providerPayout(1750, 0.2)).toBe(1400);
  });
  it("computes 15% for custom jobs", () => {
    expect(commissionFor(2000, 0.15)).toBe(300);
    expect(providerPayout(2000, 0.15)).toBe(1700);
  });
});

describe("summarizeLedger", () => {
  it("computes net earnings and outstanding commission", () => {
    const s = summarizeLedger([
      { type: "earning", amount: 1400 },
      { type: "commission", amount: -350 },
      { type: "earning", amount: 1700 },
      { type: "commission", amount: -300 },
    ]);
    expect(s.netEarnings).toBe(3100);
    expect(s.commissionGross).toBe(650);
    expect(s.commissionOwed).toBe(650);
  });

  it("reduces owed commission after a settlement", () => {
    const s = summarizeLedger([
      { type: "commission", amount: -350 },
      { type: "payout", amount: 200 },
    ]);
    expect(s.commissionGross).toBe(350);
    expect(s.settled).toBe(200);
    expect(s.commissionOwed).toBe(150);
  });

  it("never goes negative once over-settled", () => {
    const s = summarizeLedger([
      { type: "commission", amount: -100 },
      { type: "payout", amount: 250 },
    ]);
    expect(s.commissionOwed).toBe(0);
  });
});

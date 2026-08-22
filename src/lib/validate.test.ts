import { describe, it, expect } from "vitest";
import { normalizePkPhone, isValidPkPhone, isValidCnic, formatCnic } from "./validate";

describe("normalizePkPhone", () => {
  it("normalizes common local formats to +92", () => {
    expect(normalizePkPhone("03001234567")).toBe("+923001234567");
    expect(normalizePkPhone("0300 123 4567")).toBe("+923001234567");
    expect(normalizePkPhone("0300-1234567")).toBe("+923001234567");
    expect(normalizePkPhone("3001234567")).toBe("+923001234567");
    expect(normalizePkPhone("+923001234567")).toBe("+923001234567");
    expect(normalizePkPhone("00923001234567")).toBe("+923001234567");
  });
  it("rejects invalid numbers", () => {
    expect(normalizePkPhone("12345")).toBeNull();
    expect(normalizePkPhone("0211234567")).toBeNull(); // landline, not 3XX mobile
    expect(normalizePkPhone("")).toBeNull();
    expect(isValidPkPhone("03001234567")).toBe(true);
    expect(isValidPkPhone("nope")).toBe(false);
  });
});

describe("CNIC", () => {
  it("validates 13-digit CNICs", () => {
    expect(isValidCnic("42101-1234567-1")).toBe(true);
    expect(isValidCnic("4210112345671")).toBe(true);
    expect(isValidCnic("42101-123")).toBe(false);
  });
  it("formats progressively", () => {
    expect(formatCnic("42101")).toBe("42101");
    expect(formatCnic("421011234567")).toBe("42101-1234567");
    expect(formatCnic("4210112345671")).toBe("42101-1234567-1");
    expect(formatCnic("42101123456719999")).toBe("42101-1234567-1"); // truncates
  });
});

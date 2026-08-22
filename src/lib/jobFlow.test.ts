import { describe, it, expect } from "vitest";
import { canTransition } from "./jobFlow";

describe("job status state machine", () => {
  it("allows the happy path", () => {
    expect(canTransition("created", "assigned")).toBe(true);
    expect(canTransition("assigned", "en_route")).toBe(true);
    expect(canTransition("en_route", "arrived")).toBe(true);
    expect(canTransition("arrived", "in_progress")).toBe(true);
    expect(canTransition("in_progress", "completed")).toBe(true);
    expect(canTransition("completed", "paid")).toBe(true);
    expect(canTransition("paid", "rated")).toBe(true);
  });

  it("rejects illegal jumps", () => {
    expect(canTransition("created", "paid")).toBe(false);
    expect(canTransition("assigned", "completed")).toBe(false);
    expect(canTransition("rated", "paid")).toBe(false);
    expect(canTransition("in_progress", "paid")).toBe(false);
  });

  it("allows cancellation before completion but not after", () => {
    expect(canTransition("assigned", "cancelled")).toBe(true);
    expect(canTransition("in_progress", "cancelled")).toBe(true);
    expect(canTransition("paid", "cancelled")).toBe(false);
  });
});

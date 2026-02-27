import { describe, it, expect } from "vitest";
import { TIME_SIGNATURES } from "./duration";

describe("TIME_SIGNATURES", () => {
  it("FOUR_FOUR is 1", () => {
    expect(TIME_SIGNATURES.FOUR_FOUR).toBeCloseTo(1);
  });

  it("THREE_FOUR is 0.75", () => {
    expect(TIME_SIGNATURES.THREE_FOUR).toBeCloseTo(0.75);
  });

  it("SIX_EIGHT is 0.75", () => {
    expect(TIME_SIGNATURES.SIX_EIGHT).toBeCloseTo(0.75);
  });

  it("TWELVE_EIGHT is 1.5", () => {
    expect(TIME_SIGNATURES.TWELVE_EIGHT).toBeCloseTo(1.5);
  });

  it("TWO_FOUR is 0.5", () => {
    expect(TIME_SIGNATURES.TWO_FOUR).toBeCloseTo(0.5);
  });
});
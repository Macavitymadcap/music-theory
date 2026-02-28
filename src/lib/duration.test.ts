import { describe, it, expect } from "vitest";
import {
  DURATIONS,
  TIME_SIGNATURES,
} from "./duration";

describe("DURATIONS", () => {
  it("BREVE is 2", () => expect(DURATIONS.BREVE).toBe(2));
  it("SEMIBREVE is 1", () => expect(DURATIONS.SEMIBREVE).toBe(1));
  it("MINIM is 0.5", () => expect(DURATIONS.MINIM).toBe(0.5));
  it("CROTCHET is 0.25", () => expect(DURATIONS.CROTCHET).toBe(0.25));
  it("QUAVER is 0.125", () => expect(DURATIONS.QUAVER).toBe(0.125));
  it("SEMIQUAVER is 0.0625", () => expect(DURATIONS.SEMIQUAVER).toBe(0.0625));

  it("each smaller duration is half the preceding", () => {
    expect(DURATIONS.MINIM).toBeCloseTo(DURATIONS.SEMIBREVE / 2);
    expect(DURATIONS.CROTCHET).toBeCloseTo(DURATIONS.MINIM / 2);
    expect(DURATIONS.QUAVER).toBeCloseTo(DURATIONS.CROTCHET / 2);
    expect(DURATIONS.SEMIQUAVER).toBeCloseTo(DURATIONS.QUAVER / 2);
  });

  it("all duration values are positive", () => {
    for (const [, v] of Object.entries(DURATIONS)) {
      expect(v).toBeGreaterThan(0);
    }
  });
});

describe("TIME_SIGNATURES", () => {
  it("FOUR_FOUR is 1", () => expect(TIME_SIGNATURES.FOUR_FOUR).toBeCloseTo(1));
  it("THREE_FOUR is 0.75", () => expect(TIME_SIGNATURES.THREE_FOUR).toBeCloseTo(0.75));
  it("TWO_FOUR is 0.5", () => expect(TIME_SIGNATURES.TWO_FOUR).toBeCloseTo(0.5));
  it("SIX_EIGHT is 0.75", () => expect(TIME_SIGNATURES.SIX_EIGHT).toBeCloseTo(0.75));
  it("TWELVE_EIGHT is 1.5", () => expect(TIME_SIGNATURES.TWELVE_EIGHT).toBeCloseTo(1.5));

  it("THREE_FOUR equals SIX_EIGHT (both are 0.75 beats per beat)", () => {
    expect(TIME_SIGNATURES.THREE_FOUR).toBeCloseTo(TIME_SIGNATURES.SIX_EIGHT);
  });

  it("TWELVE_EIGHT is double SIX_EIGHT", () => {
    expect(TIME_SIGNATURES.TWELVE_EIGHT).toBeCloseTo(TIME_SIGNATURES.SIX_EIGHT * 2);
  });

  it("all time signature values are positive", () => {
    for (const [, v] of Object.entries(TIME_SIGNATURES)) {
      expect(v).toBeGreaterThan(0);
    }
  });
});

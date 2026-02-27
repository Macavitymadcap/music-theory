import { describe, it, expect } from "vitest";
import {
  getFrequencyFromName,
  getFrequencyFromTonicAndInterval,
  createNote,
  NOTE_FREQUENCIES,
  NOTE_NAMES,
} from "./notes";

describe("NOTE_FREQUENCIES", () => {
  it("contains entries for all 12 note names across octaves 0–8", () => {
    for (const name of NOTE_NAMES) {
      for (let oct = 0; oct <= 8; oct++) {
        expect(NOTE_FREQUENCIES[`${name}${oct}`]).toBeGreaterThan(0);
      }
    }
  });

  it("A4 is 440Hz", () => {
    expect(NOTE_FREQUENCIES["a4"]).toBeCloseTo(440, 1);
  });

  it("C4 is approximately 261.63Hz", () => {
    expect(NOTE_FREQUENCIES["c4"]).toBeCloseTo(261.63, 1);
  });

  it("each octave doubles the frequency of the same note", () => {
    expect(NOTE_FREQUENCIES["a5"]).toBeCloseTo(NOTE_FREQUENCIES["a4"] * 2, 1);
    expect(NOTE_FREQUENCIES["a3"]).toBeCloseTo(NOTE_FREQUENCIES["a4"] / 2, 1);
  });
});

describe("getFrequencyFromName", () => {
  it("returns the correct frequency for a known note", () => {
    expect(getFrequencyFromName("a4")).toBeCloseTo(440, 1);
  });

  it("is case-insensitive", () => {
    expect(getFrequencyFromName("A4")).toBeCloseTo(getFrequencyFromName("a4"), 5);
  });

  it("throws for an unknown note name", () => {
    expect(() => getFrequencyFromName("x9")).toThrow();
  });
});

describe("getFrequencyFromTonicAndInterval", () => {
  it("returns the tonic frequency at interval 0", () => {
    expect(getFrequencyFromTonicAndInterval(440, 0)).toBeCloseTo(440);
  });

  it("returns double the frequency at interval 12 (octave)", () => {
    expect(getFrequencyFromTonicAndInterval(440, 12)).toBeCloseTo(880);
  });

  it("returns correct frequency for a perfect fifth (7 semitones)", () => {
    // A4 (440) -> E5 (~659.26)
    expect(getFrequencyFromTonicAndInterval(440, 7)).toBeCloseTo(659.26, 1);
  });
});

describe("createNote", () => {
  it("returns an object with the given frequency and value", () => {
    const note = createNote(440, 0.25);
    expect(note.frequency).toBe(440);
    expect(note.value).toBe(0.25);
  });
});
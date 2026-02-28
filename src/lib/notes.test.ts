import { describe, it, expect } from "vitest";
import {
  getFrequencyFromName,
  getFrequencyFromTonicAndInterval,
  createNote,
  NOTE_FREQUENCIES,
  NOTE_NAMES,
  TOTAL_SEMITONES,
} from "./notes";

describe("NOTE_NAMES", () => {
  it("contains exactly 12 entries", () => {
    expect(NOTE_NAMES).toHaveLength(12);
  });

  it("starts with C", () => {
    expect(NOTE_NAMES[0]).toBe("c");
  });

  it("ends with B", () => {
    expect(NOTE_NAMES[11]).toBe("b");
  });

  it("all names are lowercase strings", () => {
    for (const name of NOTE_NAMES) {
      expect(name).toBe(name.toLowerCase());
    }
  });
});

describe("TOTAL_SEMITONES", () => {
  it("equals 12", () => {
    expect(TOTAL_SEMITONES).toBe(12);
  });
});

describe("NOTE_FREQUENCIES", () => {
  it("contains entries for all 12 note names across octaves 0–8", () => {
    for (const name of NOTE_NAMES) {
      for (let oct = 0; oct <= 8; oct++) {
        expect(NOTE_FREQUENCIES[`${name}${oct}`], `Missing: ${name}${oct}`).toBeGreaterThan(0);
      }
    }
  });

  it("A4 is exactly 440 Hz", () => {
    expect(NOTE_FREQUENCIES["a4"]).toBeCloseTo(440, 1);
  });

  it("C4 is approximately 261.63 Hz", () => {
    expect(NOTE_FREQUENCIES["c4"]).toBeCloseTo(261.63, 1);
  });

  it("C0 is the lowest note and has a positive frequency", () => {
    expect(NOTE_FREQUENCIES["c0"]).toBeGreaterThan(0);
  });

  it("B8 is the highest note and has a positive frequency", () => {
    expect(NOTE_FREQUENCIES["b8"]).toBeGreaterThan(0);
  });

  it("each octave doubles the frequency of the same note", () => {
    expect(NOTE_FREQUENCIES["a5"]).toBeCloseTo(NOTE_FREQUENCIES["a4"] * 2, 1);
    expect(NOTE_FREQUENCIES["a3"]).toBeCloseTo(NOTE_FREQUENCIES["a4"] / 2, 1);
  });

  it("frequencies increase monotonically across the note sequence", () => {
    const flat: number[] = [];
    for (let oct = 0; oct <= 8; oct++) {
      for (const n of NOTE_NAMES) {
        flat.push(NOTE_FREQUENCIES[`${n}${oct}`]);
      }
    }
    for (let i = 1; i < flat.length; i++) {
      // Allow tiny rounding errors
      expect(flat[i]).toBeGreaterThan(flat[i - 1] - 0.01);
    }
  });
});

describe("getFrequencyFromName", () => {
  it("returns correct frequency for A4", () => {
    expect(getFrequencyFromName("a4")).toBeCloseTo(440, 1);
  });

  it("is case-insensitive", () => {
    expect(getFrequencyFromName("A4")).toBeCloseTo(getFrequencyFromName("a4"), 5);
  });

  it("returns correct frequency for middle C (C4)", () => {
    expect(getFrequencyFromName("c4")).toBeCloseTo(261.63, 1);
  });

  it("handles flat note names like 'bb4'", () => {
    expect(getFrequencyFromName("bb4")).toBeGreaterThan(0);
  });

  it("throws for an unknown note name", () => {
    expect(() => getFrequencyFromName("x9")).toThrow();
  });

  it("throws for an empty string", () => {
    expect(() => getFrequencyFromName("")).toThrow();
  });

  it("throws for a number-only string", () => {
    expect(() => getFrequencyFromName("4")).toThrow();
  });
});

describe("getFrequencyFromTonicAndInterval", () => {
  it("interval 0 returns the tonic", () => {
    expect(getFrequencyFromTonicAndInterval(440, 0)).toBeCloseTo(440);
  });

  it("interval 12 returns one octave above (double)", () => {
    expect(getFrequencyFromTonicAndInterval(440, 12)).toBeCloseTo(880);
  });

  it("interval 24 returns two octaves above", () => {
    expect(getFrequencyFromTonicAndInterval(440, 24)).toBeCloseTo(1760);
  });

  it("interval -12 returns one octave below (half)", () => {
    expect(getFrequencyFromTonicAndInterval(440, -12)).toBeCloseTo(220);
  });

  it("perfect fifth (7 semitones) above A4 → E5", () => {
    expect(getFrequencyFromTonicAndInterval(440, 7)).toBeCloseTo(659.26, 1);
  });

  it("major third (4 semitones) above C4 → E4", () => {
    const c4 = getFrequencyFromName("c4");
    const e4 = getFrequencyFromName("e4");
    expect(getFrequencyFromTonicAndInterval(c4, 4)).toBeCloseTo(e4, 1);
  });
});

describe("createNote", () => {
  it("returns an object with the given frequency and value", () => {
    const note = createNote(440, 0.25);
    expect(note.frequency).toBe(440);
    expect(note.value).toBe(0.25);
  });

  it("note object shape has no extra properties", () => {
    const note = createNote(261.63, 0.5);
    expect(Object.keys(note).sort((a, b) => a.localeCompare(b))).toEqual(["frequency", "value"]);
  });

  it("allows any positive frequency", () => {
    expect(() => createNote(20000, 0.25)).not.toThrow();
  });
});

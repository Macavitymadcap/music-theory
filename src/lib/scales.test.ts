import { describe, it, expect } from "vitest";
import {
  createScale,
  createScaleFromNoteName,
  createScaleNotes,
  SCALES,
  SCALE_GROUPS,
  type ScaleName,
} from "./scales";
import { getFrequencyFromName } from "./notes";
import { DURATIONS } from "./duration";

describe("SCALES catalogue", () => {
  it("every scale referenced in SCALE_GROUPS exists in SCALES", () => {
    for (const group of SCALE_GROUPS) {
      for (const name of group.scales) {
        expect(SCALES[name], `Missing: ${name}`).toBeDefined();
      }
    }
  });

  it("every scale (except melodic minor descending) starts at semitone 0 and ends at semitone 12", () => {
    const excluded: Set<ScaleName> = new Set(["melodic-minor-descending"]);
    for (const [name, scale] of Object.entries(SCALES)) {
      if (excluded.has(name as ScaleName)) continue;
      expect(scale.intervals[0], `${name}: first interval`).toBe(0);
      expect(scale.intervals.at(-1), `${name}: last interval`).toBe(12);
    }
  });

  it("every scale's length matches its intervals array length", () => {
    for (const [name, scale] of Object.entries(SCALES)) {
      expect(scale.intervals.length, `${name}: length mismatch`).toBe(scale.length);
    }
  });

  it("all interval arrays are non-decreasing (ascending or flat)", () => {
    const excluded: Set<ScaleName> = new Set(["melodic-minor-descending"]);
    for (const [name, scale] of Object.entries(SCALES)) {
      if (excluded.has(name as ScaleName)) continue;
      for (let i = 1; i < scale.intervals.length; i++) {
        expect(scale.intervals[i], `${name}: interval[${i}] should be >= interval[${i - 1}]`)
          .toBeGreaterThanOrEqual(scale.intervals[i - 1]);
      }
    }
  });

  it("all intervals are non-negative integers", () => {
    for (const [name, scale] of Object.entries(SCALES)) {
      for (const interval of scale.intervals) {
        expect(Number.isInteger(interval), `${name}: ${interval} is not an integer`).toBe(true);
        expect(interval, `${name}: ${interval} is negative`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("every group label is a non-empty string", () => {
    for (const group of SCALE_GROUPS) {
      expect(group.label.length).toBeGreaterThan(0);
    }
  });

  it("every SCALE_GROUP contains at least one scale", () => {
    for (const group of SCALE_GROUPS) {
      expect(group.scales.length).toBeGreaterThan(0);
    }
  });
});

describe("createScale", () => {
  it("major scale has 8 notes", () => {
    expect(createScale("major", 261.63)).toHaveLength(8);
  });

  it("chromatic scale has 13 notes", () => {
    expect(createScale("chromatic", 261.63)).toHaveLength(13);
  });

  it("pentatonic scales have 6 notes", () => {
    expect(createScale("major-pentatonic", 261.63)).toHaveLength(6);
    expect(createScale("minor-pentatonic", 261.63)).toHaveLength(6);
  });

  it("blues scale has 7 notes", () => {
    expect(createScale("blues", 261.63)).toHaveLength(7);
  });

  it("first note matches the tonic", () => {
    const tonic = 440;
    expect(createScale("major", tonic)[0].frequency).toBeCloseTo(tonic);
  });

  it("last note is an octave above the tonic (12 semitones × tonic)", () => {
    const tonic = 440;
    const notes = createScale("major", tonic);
    expect(notes.at(-1)!.frequency).toBeCloseTo(tonic * 2, 1);
  });

  it("dorian scale's 3rd interval is 3 semitones (minor 3rd)", () => {
    const tonic = 261.63;
    const notes = createScale("dorian", tonic);
    const expected = tonic * Math.pow(2, 3 / 12);
    expect(notes[2].frequency).toBeCloseTo(expected, 1);
  });

  it("harmonic minor has an augmented 2nd between 6th and 7th degrees", () => {
    const tonic = 261.63;
    const notes = createScale("harmonic-minor", tonic);
    // intervals = [0, 2, 3, 5, 7, 8, 11, 12] — gap from 8 to 11 is 3 semitones
    const ratio = notes[6].frequency / notes[5].frequency;
    expect(ratio).toBeCloseTo(Math.pow(2, 3 / 12), 3);
  });

  it("all notes have a positive frequency", () => {
    const notes = createScale("major", 440);
    notes.forEach((n) => expect(n.frequency).toBeGreaterThan(0));
  });

  it("throws for an unknown scale name", () => {
    // @ts-expect-error intentional bad input
    expect(() => createScale("not-a-scale", 440)).toThrow();
  });
});

describe("createScaleNotes", () => {
  it("uses the provided duration for all notes", () => {
    const notes = createScaleNotes(440, SCALES.major, DURATIONS.QUAVER);
    notes.forEach((n) => expect(n.value).toBe(DURATIONS.QUAVER));
  });

  it("uses CROTCHET as default duration", () => {
    const notes = createScaleNotes(440, SCALES.major);
    notes.forEach((n) => expect(n.value).toBe(DURATIONS.CROTCHET));
  });
});

describe("createScaleFromNoteName", () => {
  it("produces the same notes as createScale with the equivalent frequency", () => {
    const fromName = createScaleFromNoteName("major", "a4");
    const fromFreq = createScale("major", getFrequencyFromName("a4"));
    expect(fromName.map((n) => n.frequency)).toEqual(fromFreq.map((n) => n.frequency));
  });

  it("is case-insensitive for note names", () => {
    const lower = createScaleFromNoteName("major", "c4");
    const upper = createScaleFromNoteName("major", "C4");
    expect(lower.map((n) => n.frequency)).toEqual(upper.map((n) => n.frequency));
  });
});
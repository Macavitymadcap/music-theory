import { describe, it, expect } from "vitest";
import {
  createScale,
  createScaleFromNoteName,
  createScaleNotes,
  SCALES,
  SCALE_GROUPS,
} from "./scales";
import { getFrequencyFromName } from "./notes";

describe("SCALES", () => {
  it("every scale referenced in SCALE_GROUPS exists in SCALES", () => {
    for (const group of SCALE_GROUPS) {
      for (const name of group.scales) {
        expect(SCALES[name]).toBeDefined();
      }
    }
  });

  it("every scale spans exactly one octave (intervals contain both 0 and 12)", () => {
    for (const [name, scale] of Object.entries(SCALES)) {
      expect(scale.intervals, `${name} should contain 0`).toContain(0);
      expect(scale.intervals, `${name} should contain 12`).toContain(12);
    }
  });

  it("every scale's length matches its intervals array length", () => {
    for (const [name, scale] of Object.entries(SCALES)) {
      expect(scale.intervals.length, `${name} length mismatch`).toBe(scale.length);
    }
  });
});

describe("createScale", () => {
  it("returns the correct number of notes for the major scale", () => {
    const notes = createScale("major", 261.63);
    expect(notes).toHaveLength(SCALES.major.length);
  });

  it("first note matches the tonic frequency", () => {
    const tonic = 261.63;
    expect(createScale("major", tonic)[0].frequency).toBeCloseTo(tonic);
  });

  it("last note is an octave above the tonic", () => {
    const tonic = 261.63;
    const notes = createScale("major", tonic);
    expect(notes.at(-1)?.frequency).toBeCloseTo(tonic * 2, 1);
  });

  it("throws for an unknown scale name", () => {
    // @ts-expect-error intentional bad input
    expect(() => createScale("made-up", 440)).toThrow();
  });
});

describe("createScaleFromNoteName", () => {
  it("produces the same notes as createScale with the equivalent frequency", () => {
    const fromName = createScaleFromNoteName("major", "a4");
    const fromFreq = createScale("major", getFrequencyFromName("a4"));
    expect(fromName.map((n) => n.frequency)).toEqual(fromFreq.map((n) => n.frequency));
  });
});

describe("createScaleNotes", () => {
  it("applies the provided duration to all notes", () => {
    const notes = createScaleNotes(440, SCALES.major, 0.5);
    notes.forEach((n) => expect(n.value).toBe(0.5));
  });
});
import { describe, it, expect } from "vitest";
import {
  createChord,
  createChordFromIntervals,
  createChordFromNoteName,
  CHORD_INTERVALS,
  CHORD_GROUPS,
  CHORD_DISPLAY_NAMES,
} from "./chords";
import { getFrequencyFromName } from "./notes";

describe("CHORD_INTERVALS", () => {
  it("every chord referenced in CHORD_GROUPS exists in CHORD_INTERVALS", () => {
    for (const group of CHORD_GROUPS) {
      for (const chord of group.chords) {
        expect(CHORD_INTERVALS[chord], `${chord} missing from CHORD_INTERVALS`).toBeDefined();
      }
    }
  });

  it("every chord has a display name", () => {
    for (const key of Object.keys(CHORD_INTERVALS) as (keyof typeof CHORD_INTERVALS)[]) {
      expect(CHORD_DISPLAY_NAMES[key], `${key} missing display name`).toBeDefined();
    }
  });

  it("all interval arrays start at 0", () => {
    for (const [name, intervals] of Object.entries(CHORD_INTERVALS)) {
      expect(intervals[0], `${name} should start at 0`).toBe(0);
    }
  });
});

describe("createChordFromIntervals", () => {
  it("returns a chord with one note per interval", () => {
    const chord = createChordFromIntervals(440, [0, 4, 7]);
    expect(chord.notes).toHaveLength(3);
    expect(chord.length).toBe(3);
  });

  it("first note matches the tonic", () => {
    const chord = createChordFromIntervals(440, [0, 4, 7]);
    expect(chord.notes[0].frequency).toBeCloseTo(440);
  });

  it("applies the provided duration to all notes", () => {
    const chord = createChordFromIntervals(440, [0, 4, 7], 0.5);
    chord.notes.forEach((n) => expect(n.value).toBe(0.5));
  });
});

describe("createChord", () => {
  it("creates a major triad with 3 notes", () => {
    const chord = createChord("majorTriad", 261.63);
    expect(chord.notes).toHaveLength(3);
  });

  it("major triad intervals are correct (root, major 3rd, perfect 5th)", () => {
    const tonic = 261.63;
    const chord = createChord("majorTriad", tonic);
    expect(chord.notes[0].frequency).toBeCloseTo(tonic);
    expect(chord.notes[1].frequency).toBeCloseTo(tonic * Math.pow(2, 4 / 12), 1);
    expect(chord.notes[2].frequency).toBeCloseTo(tonic * Math.pow(2, 7 / 12), 1);
  });

  it("throws for an unknown chord type", () => {
    // @ts-expect-error intentional bad input
    expect(() => createChord("notAChord", 440)).toThrow();
  });
});

describe("createChordFromNoteName", () => {
  it("produces the same notes as createChord with the equivalent frequency", () => {
    const fromName = createChordFromNoteName("majorTriad", "a4");
    const fromFreq = createChord("majorTriad", getFrequencyFromName("a4"));
    expect(fromName.notes.map((n) => n.frequency)).toEqual(
      fromFreq.notes.map((n) => n.frequency)
    );
  });
});
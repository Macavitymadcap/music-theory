import { describe, it, expect } from "vitest";
import {
  createChord,
  createChordFromIntervals,
  createChordFromNoteName,
  CHORD_INTERVALS,
  CHORD_GROUPS,
  CHORD_DISPLAY_NAMES,
  type ChordType,
} from "./chords";
import { DURATIONS } from "./duration";
import { getFrequencyFromName } from "./notes";

describe("CHORD_INTERVALS catalogue", () => {
  it("every chord in CHORD_GROUPS exists in CHORD_INTERVALS", () => {
    for (const group of CHORD_GROUPS) {
      for (const chord of group.chords) {
        expect(CHORD_INTERVALS[chord], `Missing: ${chord}`).toBeDefined();
      }
    }
  });

  it("every chord has a display name", () => {
    for (const key of Object.keys(CHORD_INTERVALS) as ChordType[]) {
      expect(CHORD_DISPLAY_NAMES[key], `Missing display name: ${key}`).toBeDefined();
    }
  });

  it("all interval arrays start at 0", () => {
    for (const [name, intervals] of Object.entries(CHORD_INTERVALS)) {
      expect(intervals[0], `${name}: first interval should be 0`).toBe(0);
    }
  });

  it("all intervals are non-negative integers", () => {
    for (const [name, intervals] of Object.entries(CHORD_INTERVALS)) {
      for (const interval of intervals) {
        expect(Number.isInteger(interval), `${name}: ${interval} is not an integer`).toBe(true);
        expect(interval, `${name}: ${interval} is negative`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("power chords have exactly 2 notes", () => {
    expect(CHORD_INTERVALS.powerChord).toHaveLength(2);
  });

  it("major triad has 3 notes", () => {
    expect(CHORD_INTERVALS.majorTriad).toHaveLength(3);
  });

  it("dominant 7th has 4 notes", () => {
    expect(CHORD_INTERVALS.dominant7th).toHaveLength(4);
  });

  it("dominant 9th has 5 notes", () => {
    expect(CHORD_INTERVALS.dominant9th).toHaveLength(5);
  });

  it("every CHORD_GROUP has at least one chord", () => {
    for (const group of CHORD_GROUPS) {
      expect(group.chords.length).toBeGreaterThan(0);
    }
  });
});

describe("createChordFromIntervals", () => {
  it("returns correct number of notes", () => {
    const chord = createChordFromIntervals(440, [0, 4, 7]);
    expect(chord.notes).toHaveLength(3);
    expect(chord.length).toBe(3);
  });

  it("first note equals the tonic", () => {
    const chord = createChordFromIntervals(440, [0, 4, 7]);
    expect(chord.notes[0].frequency).toBeCloseTo(440);
  });

  it("interval 12 is one octave above tonic", () => {
    const chord = createChordFromIntervals(440, [0, 12]);
    expect(chord.notes[1].frequency).toBeCloseTo(880);
  });

  it("applies the given duration to all notes", () => {
    const chord = createChordFromIntervals(440, [0, 4, 7], DURATIONS.MINIM);
    chord.notes.forEach((n) => expect(n.value).toBe(DURATIONS.MINIM));
  });

  it("uses CROTCHET as default duration", () => {
    const chord = createChordFromIntervals(440, [0, 4, 7]);
    chord.notes.forEach((n) => expect(n.value).toBe(DURATIONS.CROTCHET));
  });
});

describe("createChord", () => {
  it("major triad: 3 notes with correct root-third-fifth ratios", () => {
    const tonic = 261.63;
    const chord = createChord("majorTriad", tonic);
    expect(chord.notes[0].frequency).toBeCloseTo(tonic);
    expect(chord.notes[1].frequency).toBeCloseTo(tonic * Math.pow(2, 4 / 12), 1);
    expect(chord.notes[2].frequency).toBeCloseTo(tonic * Math.pow(2, 7 / 12), 1);
  });

  it("minor triad: minor 3rd (3 semitones) above root", () => {
    const tonic = 440;
    const chord = createChord("minorTriad", tonic);
    expect(chord.notes[1].frequency).toBeCloseTo(tonic * Math.pow(2, 3 / 12), 1);
  });

  it("diminished triad: diminished 5th (6 semitones)", () => {
    const tonic = 440;
    const chord = createChord("diminishedTriad", tonic);
    expect(chord.notes[2].frequency).toBeCloseTo(tonic * Math.pow(2, 6 / 12), 1);
  });

  it("dominant 7th has 4 notes", () => {
    expect(createChord("dominant7th", 440).notes).toHaveLength(4);
  });

  it("major 7th: minor 2nd below octave (11 semitones)", () => {
    const tonic = 440;
    const chord = createChord("major7th", tonic);
    expect(chord.notes[3].frequency).toBeCloseTo(tonic * Math.pow(2, 11 / 12), 1);
  });

  it("throws for unknown chord type", () => {
    // @ts-expect-error intentional bad input
    expect(() => createChord("notAChord", 440)).toThrow();
  });

  it("Sus2 has second degree (2 semitones)", () => {
    const tonic = 440;
    const chord = createChord("sus2", tonic);
    expect(chord.notes[1].frequency).toBeCloseTo(tonic * Math.pow(2, 2 / 12), 1);
  });

  it("power chord has exactly 2 notes", () => {
    const chord = createChord("powerChord", 440);
    expect(chord.notes).toHaveLength(2);
  });
});

describe("createChordFromNoteName", () => {
  it("matches createChord output for the same tonic", () => {
    const fromName = createChordFromNoteName("majorTriad", "a4");
    const fromFreq = createChord("majorTriad", getFrequencyFromName("a4"));
    expect(fromName.notes.map((n) => n.frequency)).toEqual(fromFreq.notes.map((n) => n.frequency));
  });

  it("is case-insensitive for note names", () => {
    const lower = createChordFromNoteName("majorTriad", "c4");
    const upper = createChordFromNoteName("majorTriad", "C4");
    expect(lower.notes.map((n) => n.frequency)).toEqual(upper.notes.map((n) => n.frequency));
  });
});
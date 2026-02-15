import {
  type Note,
  getFrequencyFromTonicAndInterval,
  getFrequencyFromName,
} from "./notes";
import { type Duration, DURATIONS } from "./duration";

export interface Chord {
  notes: Note[];
  length: number;
}

export interface ChordGroup {
  label: string;
  chords: ChordType[];
}

// --- Interval definitions ---

export const CHORD_INTERVALS = {
  // ── Power / dyad ──
  powerChord: [0, 7],
  powerChordOctave: [0, 7, 12],
  bassPedal: [0, 12],

  // ── Triads (root position) ──
  majorTriad: [0, 4, 7],
  minorTriad: [0, 3, 7],
  diminishedTriad: [0, 3, 6],
  augmentedTriad: [0, 4, 8],

  // ── Major triad inversions ──
  majorTriad1stInv: [0, 3, 8],
  majorTriad2ndInv: [0, 5, 9],

  // ── Minor triad inversions ──
  minorTriad1stInv: [0, 4, 9],
  minorTriad2ndInv: [0, 5, 8],

  // ── Diminished triad inversions ──
  diminishedTriad1stInv: [0, 3, 9],
  diminishedTriad2ndInv: [0, 6, 9],

  // ── Augmented triad inversions ──
  augmentedTriad1stInv: [0, 4, 8],
  augmentedTriad2ndInv: [0, 4, 8],

  // ── Suspended ──
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  sus2sus4: [0, 2, 5, 7],
  "7sus4": [0, 5, 7, 10],
  "7sus2": [0, 2, 7, 10],

  // ── Add chords ──
  add9: [0, 4, 7, 14],
  minorAdd9: [0, 3, 7, 14],
  add11: [0, 4, 7, 17],
  add13: [0, 4, 7, 21],

  // ── Sixth chords ──
  major6th: [0, 4, 7, 9],
  minor6th: [0, 3, 7, 9],
  "6/9": [0, 4, 7, 9, 14],

  // ── Seventh chords (root position) ──
  dominant7th: [0, 4, 7, 10],
  major7th: [0, 4, 7, 11],
  minor7th: [0, 3, 7, 10],
  minorMajor7th: [0, 3, 7, 11],
  diminished7th: [0, 3, 6, 9],
  halfDiminished7th: [0, 3, 6, 10],
  augmented7th: [0, 4, 8, 10],
  augmentedMajor7th: [0, 4, 8, 11],

  // ── Dominant 7th inversions ──
  dominant7th1stInv: [0, 3, 6, 8],
  dominant7th2ndInv: [0, 3, 5, 9],
  dominant7th3rdInv: [0, 2, 6, 9],

  // ── Major 7th inversions ──
  major7th1stInv: [0, 3, 7, 8],
  major7th2ndInv: [0, 4, 5, 9],
  major7th3rdInv: [0, 1, 5, 8],

  // ── Minor 7th inversions ──
  minor7th1stInv: [0, 4, 7, 9],
  minor7th2ndInv: [0, 3, 5, 8],
  minor7th3rdInv: [0, 2, 5, 9],

  // ── Diminished 7th inversions ──
  diminished7th1stInv: [0, 3, 6, 9],
  diminished7th2ndInv: [0, 3, 6, 9],
  diminished7th3rdInv: [0, 3, 6, 9],

  // ── Half-diminished 7th inversions ──
  halfDiminished7th1stInv: [0, 3, 7, 9],
  halfDiminished7th2ndInv: [0, 4, 6, 9],
  halfDiminished7th3rdInv: [0, 2, 5, 8],

  // ── Extended dominants ──
  dominant9th: [0, 4, 7, 10, 14],
  dominant11th: [0, 4, 7, 10, 14, 17],
  dominant13th: [0, 4, 7, 10, 14, 21],
  major9th: [0, 4, 7, 11, 14],
  minor9th: [0, 3, 7, 10, 14],
  minor11th: [0, 3, 7, 10, 14, 17],

  // ── Altered dominants ──
  "7sharp9": [0, 4, 7, 10, 15],     // Hendrix chord
  "7flat9": [0, 4, 7, 10, 13],
  "7sharp5": [0, 4, 8, 10],
  "7flat5": [0, 4, 6, 10],
  "7sharp5sharp9": [0, 4, 8, 10, 15],
  "7sharp5flat9": [0, 4, 8, 10, 13],
  "7flat5flat9": [0, 4, 6, 10, 13],

  // ── Special voicings ──
  soWhat: [0, 5, 10, 15, 19],       // Bill Evans "So What" voicing (4ths + maj3rd)
  quartal: [0, 5, 10, 15],          // Stacked 4ths
  quintal: [0, 7, 14, 21],          // Stacked 5ths
} as const;

export type ChordType = keyof typeof CHORD_INTERVALS;

/** Grouped chords for UI display */
export const CHORD_GROUPS: ChordGroup[] = [
  {
    label: "Power / dyad",
    chords: ["powerChord", "powerChordOctave", "bassPedal"],
  },
  {
    label: "Triads",
    chords: ["majorTriad", "minorTriad", "diminishedTriad", "augmentedTriad"],
  },
  {
    label: "Triad inversions",
    chords: [
      "majorTriad1stInv", "majorTriad2ndInv",
      "minorTriad1stInv", "minorTriad2ndInv",
      "diminishedTriad1stInv", "diminishedTriad2ndInv",
      "augmentedTriad1stInv", "augmentedTriad2ndInv",
    ],
  },
  {
    label: "Suspended",
    chords: ["sus2", "sus4", "sus2sus4", "7sus4", "7sus2"],
  },
  {
    label: "Add chords",
    chords: ["add9", "minorAdd9", "add11", "add13"],
  },
  {
    label: "Sixth chords",
    chords: ["major6th", "minor6th", "6/9"],
  },
  {
    label: "Seventh chords",
    chords: [
      "dominant7th", "major7th", "minor7th", "minorMajor7th",
      "diminished7th", "halfDiminished7th", "augmented7th", "augmentedMajor7th",
    ],
  },
  {
    label: "7th inversions",
    chords: [
      "dominant7th1stInv", "dominant7th2ndInv", "dominant7th3rdInv",
      "major7th1stInv", "major7th2ndInv", "major7th3rdInv",
      "minor7th1stInv", "minor7th2ndInv", "minor7th3rdInv",
      "halfDiminished7th1stInv", "halfDiminished7th2ndInv", "halfDiminished7th3rdInv",
    ],
  },
  {
    label: "Extended",
    chords: ["dominant9th", "dominant11th", "dominant13th", "major9th", "minor9th", "minor11th"],
  },
  {
    label: "Altered dominants",
    chords: [
      "7sharp9", "7flat9", "7sharp5", "7flat5",
      "7sharp5sharp9", "7sharp5flat9", "7flat5flat9",
    ],
  },
  {
    label: "Special voicings",
    chords: ["soWhat", "quartal", "quintal"],
  },
];

/** Human-readable chord name map */
export const CHORD_DISPLAY_NAMES: Record<ChordType, string> = {
  powerChord: "Power (5th)",
  powerChordOctave: "Power (5th + oct)",
  bassPedal: "Bass pedal (octave)",

  majorTriad: "Major",
  minorTriad: "Minor",
  diminishedTriad: "Diminished",
  augmentedTriad: "Augmented",

  majorTriad1stInv: "Major (1st inv)",
  majorTriad2ndInv: "Major (2nd inv)",
  minorTriad1stInv: "Minor (1st inv)",
  minorTriad2ndInv: "Minor (2nd inv)",
  diminishedTriad1stInv: "Dim (1st inv)",
  diminishedTriad2ndInv: "Dim (2nd inv)",
  augmentedTriad1stInv: "Aug (1st inv)",
  augmentedTriad2ndInv: "Aug (2nd inv)",

  sus2: "Sus2",
  sus4: "Sus4",
  sus2sus4: "Sus2/4",
  "7sus4": "7sus4",
  "7sus2": "7sus2",

  add9: "Add9",
  minorAdd9: "Minor add9",
  add11: "Add11",
  add13: "Add13",

  major6th: "Major 6th",
  minor6th: "Minor 6th",
  "6/9": "6/9",

  dominant7th: "Dom7",
  major7th: "Maj7",
  minor7th: "Min7",
  minorMajor7th: "MinMaj7",
  diminished7th: "Dim7",
  halfDiminished7th: "Half-dim7 (ø7)",
  augmented7th: "Aug7",
  augmentedMajor7th: "AugMaj7",

  dominant7th1stInv: "Dom7 (1st inv)",
  dominant7th2ndInv: "Dom7 (2nd inv)",
  dominant7th3rdInv: "Dom7 (3rd inv)",
  major7th1stInv: "Maj7 (1st inv)",
  major7th2ndInv: "Maj7 (2nd inv)",
  major7th3rdInv: "Maj7 (3rd inv)",
  minor7th1stInv: "Min7 (1st inv)",
  minor7th2ndInv: "Min7 (2nd inv)",
  minor7th3rdInv: "Min7 (3rd inv)",
  diminished7th1stInv: "Dim7 (1st inv)",
  diminished7th2ndInv: "Dim7 (2nd inv)",
  diminished7th3rdInv: "Dim7 (3rd inv)",
  halfDiminished7th1stInv: "ø7 (1st inv)",
  halfDiminished7th2ndInv: "ø7 (2nd inv)",
  halfDiminished7th3rdInv: "ø7 (3rd inv)",

  dominant9th: "Dom9",
  dominant11th: "Dom11",
  dominant13th: "Dom13",
  major9th: "Maj9",
  minor9th: "Min9",
  minor11th: "Min11",

  "7sharp9": "7♯9 (Hendrix)",
  "7flat9": "7♭9",
  "7sharp5": "7♯5",
  "7flat5": "7♭5",
  "7sharp5sharp9": "7♯5♯9",
  "7sharp5flat9": "7♯5♭9",
  "7flat5flat9": "7♭5♭9",

  soWhat: "So What (4ths)",
  quartal: "Quartal (stacked 4ths)",
  quintal: "Quintal (stacked 5ths)",
};

/**
 * Create a chord from a tonic frequency, interval set, and note duration.
 */
export function createChordFromIntervals(
  tonic: number,
  intervals: readonly number[],
  duration: Duration = DURATIONS.CROTCHET
): Chord {
  const notes: Note[] = intervals.map((interval) => ({
    frequency: getFrequencyFromTonicAndInterval(tonic, interval),
    value: duration,
  }));
  return { notes, length: notes.length };
}

export function createChord(chordType: ChordType, tonic: number, duration: Duration = DURATIONS.CROTCHET): Chord {
  const intervals = CHORD_INTERVALS[chordType];
  if (!intervals) throw new Error(`Unknown chord type: "${chordType}"`);
  return createChordFromIntervals(tonic, intervals, duration);
}

export function createChordFromNoteName(chordType: ChordType, tonicName: string, duration: Duration = DURATIONS.CROTCHET): Chord {
  return createChord(chordType, getFrequencyFromName(tonicName), duration);
}

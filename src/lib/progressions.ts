/**
 * Chord progression presets and types.
 *
 * Each progression step is defined as a scale degree (roman numeral)
 * mapped to a chord quality and interval set. Steps reference
 * semitone offsets from the tonic so they're key-agnostic.
 */

import { CHORD_INTERVALS, CHORD_DISPLAY_NAMES, CHORD_GROUPS, type ChordType, type ChordGroup } from ".";

// ── Types ──

export interface ProgressionStep {
  /** Display label e.g. "I", "ii", "V7", "♭VII" */
  label: string;
  /** Semitone offset from tonic for this degree */
  semitones: number;
  /** Which chord voicing to use */
  chordType: ChordType;
  /** How many bars this step lasts */
  bars: number;
  /** How many times the chord is struck per bar (subdivisions) */
  hitsPerBar: number;
}

export interface ProgressionPreset {
  name: string;
  description: string;
  steps: ProgressionStep[];
  beatsPerBar: number;
}

// ── Helpers ──

function step(
  label: string,
  semitones: number,
  chordType: ChordType,
  bars = 1,
  hitsPerBar = 1
): ProgressionStep {
  return { label, semitones, chordType, bars, hitsPerBar };
}

// ── Presets ──

export const PROGRESSION_PRESETS: ProgressionPreset[] = [
  {
    name: "Four Chords (I–V–vi–IV)",
    description: "The most common pop progression",
    beatsPerBar: 4,
    steps: [
      step("I", 0, "majorTriad"),
      step("V", 7, "majorTriad"),
      step("vi", 9, "minorTriad"),
      step("IV", 5, "majorTriad"),
    ],
  },
  {
    name: "I–IV–vi–V",
    description: "Classic pop variant",
    beatsPerBar: 4,
    steps: [
      step("I", 0, "majorTriad"),
      step("IV", 5, "majorTriad"),
      step("vi", 9, "minorTriad"),
      step("V", 7, "majorTriad"),
    ],
  },
  {
    name: "12 Bar Blues",
    description: "Standard blues form with dominant 7ths",
    beatsPerBar: 4,
    steps: [
      step("I7", 0, "dominant7th", 4),
      step("IV7", 5, "dominant7th", 2),
      step("I7", 0, "dominant7th", 2),
      step("V7", 7, "dominant7th", 1),
      step("IV7", 5, "dominant7th", 1),
      step("I7", 0, "dominant7th", 1),
      step("V7", 7, "dominant7th", 1),
    ],
  },
  {
    name: "ii–V–I",
    description: "The cornerstone of jazz harmony",
    beatsPerBar: 4,
    steps: [
      step("ii7", 2, "minor7th"),
      step("V7", 7, "dominant7th"),
      step("Imaj7", 0, "major7th", 2),
    ],
  },
  {
    name: "Andalusian Cadence",
    description: "i–♭VII–♭VI–V (flamenco / Spanish)",
    beatsPerBar: 4,
    steps: [
      step("i", 0, "minorTriad"),
      step("♭VII", 10, "majorTriad"),
      step("♭VI", 8, "majorTriad"),
      step("V", 7, "majorTriad"),
    ],
  },
  {
    name: "Pachelbel's Canon",
    description: "I–V–vi–iii–IV–I–IV–V",
    beatsPerBar: 4,
    steps: [
      step("I", 0, "majorTriad"),
      step("V", 7, "majorTriad"),
      step("vi", 9, "minorTriad"),
      step("iii", 4, "minorTriad"),
      step("IV", 5, "majorTriad"),
      step("I", 0, "majorTriad"),
      step("IV", 5, "majorTriad"),
      step("V", 7, "majorTriad"),
    ],
  },
  {
    name: "50s Doo-Wop",
    description: "I–vi–IV–V",
    beatsPerBar: 4,
    steps: [
      step("I", 0, "majorTriad"),
      step("vi", 9, "minorTriad"),
      step("IV", 5, "majorTriad"),
      step("V", 7, "majorTriad"),
    ],
  },
  {
    name: "Minor ii–V–i",
    description: "Jazz minor cadence with half-diminished ii",
    beatsPerBar: 4,
    steps: [
      step("iiø7", 2, "halfDiminished7th"),
      step("V7", 7, "dominant7th"),
      step("i", 0, "minorTriad", 2),
    ],
  },
  {
    name: "I–♭III–IV (Grunge)",
    description: "Nirvana-style power chord movement",
    beatsPerBar: 4,
    steps: [
      step("I", 0, "powerChord", 2),
      step("♭III", 3, "powerChord"),
      step("IV", 5, "powerChord"),
    ],
  },
  {
    name: "Rhythm Changes (A)",
    description: "I–vi–ii–V from Gershwin's 'I Got Rhythm'",
    beatsPerBar: 4,
    steps: [
      step("Imaj7", 0, "major7th"),
      step("vi7", 9, "minor7th"),
      step("ii7", 2, "minor7th"),
      step("V7", 7, "dominant7th"),
    ],
  },
  {
    name: "Coltrane Changes",
    description: "Giant Steps pattern: Imaj7–V7–Imaj7 in major thirds",
    beatsPerBar: 4,
    steps: [
      step("Imaj7", 0, "major7th"),
      step("V7/♭VI", 8, "dominant7th"),
      step("♭VImaj7", 8, "major7th"),
      step("V7/IV", 5, "dominant7th"),
      step("IVmaj7", 5, "major7th"),
      step("V7/I", 7, "dominant7th"),
      step("Imaj7", 0, "major7th", 2),
    ],
  },
  {
    name: "So What",
    description: "Modal jazz: 16 bars Dm, 8 bars E♭m, 8 bars Dm",
    beatsPerBar: 4,
    steps: [
      step("i (So What)", 0, "soWhat", 4),
      step("♭ii (So What)", 1, "soWhat", 2),
      step("i (So What)", 0, "soWhat", 2),
    ],
  },
];

// ── Builder chord types: all chords, grouped for <optgroup> ──

export interface BuilderChordOption {
  value: ChordType;
  label: string;
  group: string;
}

export const BUILDER_CHORD_OPTIONS: BuilderChordOption[] = CHORD_GROUPS.flatMap((g: ChordGroup) =>
  g.chords.map((c) => ({
    value: c,
    label: CHORD_DISPLAY_NAMES[c] ?? c,
    group: g.label,
  }))
);

// ── Degree options for the custom builder ──

export const DEGREE_OPTIONS: { label: string; semitones: number }[] = [
  { label: "I", semitones: 0 },
  { label: "♭II", semitones: 1 },
  { label: "II", semitones: 2 },
  { label: "♭III", semitones: 3 },
  { label: "III", semitones: 4 },
  { label: "IV", semitones: 5 },
  { label: "♭V", semitones: 6 },
  { label: "V", semitones: 7 },
  { label: "♭VI", semitones: 8 },
  { label: "VI", semitones: 9 },
  { label: "♭VII", semitones: 10 },
  { label: "VII", semitones: 11 },
];

/**
 * Resolve a progression's steps into concrete frequencies given a tonic.
 */
export function resolveProgression(
  steps: ProgressionStep[],
  tonicFreq: number
): { intervals: readonly number[]; tonicFreq: number; bars: number; hitsPerBar: number; label: string }[] {
  return steps.map((s) => {
    const freq = tonicFreq * Math.pow(2, s.semitones / 12);
    return {
      intervals: CHORD_INTERVALS[s.chordType],
      tonicFreq: freq,
      bars: s.bars,
      hitsPerBar: s.hitsPerBar,
      label: s.label,
    };
  });
}
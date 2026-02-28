/**
 * cheat-sheets.ts — Pure data & logic for the Cheat Sheets panel.
 *
 * No UI imports. All exports are stable reference data that components
 * render without needing to compute themselves.
 */

// ---------------------------------------------------------------------------
// Circle of Fifths
// ---------------------------------------------------------------------------

export interface KeyInfo {
  /** e.g. "C", "G", "F#" */
  name: string;
  /** Major key label */
  major: string;
  /** Relative minor label */
  minor: string;
  /** Number of sharps (positive) or flats (negative) */
  accidentals: number;
  /** Accidental type for display */
  accidentalType: "sharp" | "flat" | "none";
  /** Angle in degrees, 0 = top (C major) */
  angle: number;
}

/**
 * All 12 keys around the circle of fifths, clockwise from C.
 * Each step clockwise adds one sharp / removes one flat.
 */
export const CIRCLE_OF_FIFTHS: KeyInfo[] = [
  { name: "C",  major: "C",  minor: "Am", accidentals: 0,  accidentalType: "none",  angle: 0   },
  { name: "G",  major: "G",  minor: "Em", accidentals: 1,  accidentalType: "sharp", angle: 30  },
  { name: "D",  major: "D",  minor: "Bm", accidentals: 2,  accidentalType: "sharp", angle: 60  },
  { name: "A",  major: "A",  minor: "F#m",accidentals: 3,  accidentalType: "sharp", angle: 90  },
  { name: "E",  major: "E",  minor: "C#m",accidentals: 4,  accidentalType: "sharp", angle: 120 },
  { name: "B",  major: "B",  minor: "G#m",accidentals: 5,  accidentalType: "sharp", angle: 150 },
  { name: "F#", major: "F#", minor: "D#m",accidentals: 6,  accidentalType: "sharp", angle: 180 },
  { name: "Db", major: "Db", minor: "Bbm",accidentals: 6,  accidentalType: "flat",  angle: 210 },
  { name: "Ab", major: "Ab", minor: "Fm", accidentals: 4,  accidentalType: "flat",  angle: 240 },
  { name: "Eb", major: "Eb", minor: "Cm", accidentals: 3,  accidentalType: "flat",  angle: 270 },
  { name: "Bb", major: "Bb", minor: "Gm", accidentals: 2,  accidentalType: "flat",  angle: 300 },
  { name: "F",  major: "F",  minor: "Dm", accidentals: 1,  accidentalType: "flat",  angle: 330 },
];

// ---------------------------------------------------------------------------
// Key Signatures
// ---------------------------------------------------------------------------

export interface KeySignature {
  key: string;
  sharps: string[];
  flats: string[];
  /** Scale notes in order */
  scale: string[];
}

export const KEY_SIGNATURES: KeySignature[] = [
  { key: "C",  sharps: [],                                       flats: [],                                        scale: ["C","D","E","F","G","A","B"] },
  { key: "G",  sharps: ["F#"],                                   flats: [],                                        scale: ["G","A","B","C","D","E","F#"] },
  { key: "D",  sharps: ["F#","C#"],                              flats: [],                                        scale: ["D","E","F#","G","A","B","C#"] },
  { key: "A",  sharps: ["F#","C#","G#"],                         flats: [],                                        scale: ["A","B","C#","D","E","F#","G#"] },
  { key: "E",  sharps: ["F#","C#","G#","D#"],                    flats: [],                                        scale: ["E","F#","G#","A","B","C#","D#"] },
  { key: "B",  sharps: ["F#","C#","G#","D#","A#"],               flats: [],                                        scale: ["B","C#","D#","E","F#","G#","A#"] },
  { key: "F#", sharps: ["F#","C#","G#","D#","A#","E#"],          flats: [],                                        scale: ["F#","G#","A#","B","C#","D#","E#"] },
  { key: "F",  sharps: [],                                       flats: ["Bb"],                                    scale: ["F","G","A","Bb","C","D","E"] },
  { key: "Bb", sharps: [],                                       flats: ["Bb","Eb"],                               scale: ["Bb","C","D","Eb","F","G","A"] },
  { key: "Eb", sharps: [],                                       flats: ["Bb","Eb","Ab"],                          scale: ["Eb","F","G","Ab","Bb","C","D"] },
  { key: "Ab", sharps: [],                                       flats: ["Bb","Eb","Ab","Db"],                     scale: ["Ab","Bb","C","Db","Eb","F","G"] },
  { key: "Db", sharps: [],                                       flats: ["Bb","Eb","Ab","Db","Gb"],                scale: ["Db","Eb","F","Gb","Ab","Bb","C"] },
  { key: "C#", sharps: [],                                       flats: ["Bb","Eb","Ab","Db","Gb","Cb"],            scale: ["C#","D#","E#","F#","G#","A#","B#"] },
  { key: "Gb", sharps: [],                                       flats: ["Bb","Eb","Ab","Db","Gb","Cb"],            scale: ["Gb","Ab","Bb","Cb","Db","Eb","F"] },
  { key: "Cb", sharps: [],                                       flats: ["Bb","Eb","Ab","Db","Gb","Cb"],            scale: ["Cb","Db","Eb","F","Gb","Ab","Bb"] },
];

// ---------------------------------------------------------------------------
// Intervals
// ---------------------------------------------------------------------------

export interface IntervalInfo {
  semitones: number;
  shortName: string;
  fullName: string;
  /** e.g. "Perfect", "Major", "Minor", "Augmented", "Diminished" */
  quality: string;
  /** Typical example from C */
  example: string;
  consonance: "perfect" | "imperfect" | "dissonant";
}

export const INTERVALS: IntervalInfo[] = [
  { semitones: 0,  shortName: "P1",  fullName: "Perfect Unison",    quality: "Perfect",    example: "C–C",  consonance: "perfect"   },
  { semitones: 1,  shortName: "m2",  fullName: "Minor Second",      quality: "Minor",      example: "C–Db", consonance: "dissonant" },
  { semitones: 2,  shortName: "M2",  fullName: "Major Second",      quality: "Major",      example: "C–D",  consonance: "dissonant" },
  { semitones: 3,  shortName: "m3",  fullName: "Minor Third",       quality: "Minor",      example: "C–Eb", consonance: "imperfect" },
  { semitones: 4,  shortName: "M3",  fullName: "Major Third",       quality: "Major",      example: "C–E",  consonance: "imperfect" },
  { semitones: 5,  shortName: "P4",  fullName: "Perfect Fourth",    quality: "Perfect",    example: "C–F",  consonance: "perfect"   },
  { semitones: 6,  shortName: "TT",  fullName: "Tritone",           quality: "Augmented",  example: "C–F#", consonance: "dissonant" },
  { semitones: 7,  shortName: "P5",  fullName: "Perfect Fifth",     quality: "Perfect",    example: "C–G",  consonance: "perfect"   },
  { semitones: 8,  shortName: "m6",  fullName: "Minor Sixth",       quality: "Minor",      example: "C–Ab", consonance: "imperfect" },
  { semitones: 9,  shortName: "M6",  fullName: "Major Sixth",       quality: "Major",      example: "C–A",  consonance: "imperfect" },
  { semitones: 10, shortName: "m7",  fullName: "Minor Seventh",     quality: "Minor",      example: "C–Bb", consonance: "dissonant" },
  { semitones: 11, shortName: "M7",  fullName: "Major Seventh",     quality: "Major",      example: "C–B",  consonance: "dissonant" },
  { semitones: 12, shortName: "P8",  fullName: "Perfect Octave",    quality: "Perfect",    example: "C–C'", consonance: "perfect"   },
];

// ---------------------------------------------------------------------------
// Scale Degrees
// ---------------------------------------------------------------------------

export interface ScaleDegreeInfo {
  degree: number;
  /** e.g. "I", "ii", "iii" */
  roman: string;
  /** e.g. "Tonic", "Supertonic" */
  name: string;
  /** Typical triad quality in major */
  majorQuality: "major" | "minor" | "diminished" | "augmented";
  /** Typical triad quality in natural minor */
  minorQuality: "major" | "minor" | "diminished" | "augmented";
  /** Functional role */
  function: "tonic" | "subdominant" | "dominant" | "leading";
  /** Semitones above tonic in major scale */
  semitones: number;
}

export const SCALE_DEGREES: ScaleDegreeInfo[] = [
  { degree: 1, roman: "I",   name: "Tonic",       majorQuality: "major",      minorQuality: "minor",      function: "tonic",      semitones: 0  },
  { degree: 2, roman: "ii",  name: "Supertonic",  majorQuality: "minor",      minorQuality: "diminished", function: "subdominant",semitones: 2  },
  { degree: 3, roman: "iii", name: "Mediant",     majorQuality: "minor",      minorQuality: "major",      function: "tonic",      semitones: 4  },
  { degree: 4, roman: "IV",  name: "Subdominant", majorQuality: "major",      minorQuality: "minor",      function: "subdominant",semitones: 5  },
  { degree: 5, roman: "V",   name: "Dominant",    majorQuality: "major",      minorQuality: "major",      function: "dominant",   semitones: 7  },
  { degree: 6, roman: "vi",  name: "Submediant",  majorQuality: "minor",      minorQuality: "major",      function: "tonic",      semitones: 9  },
  { degree: 7, roman: "vii°",name: "Leading Tone",majorQuality: "diminished", minorQuality: "major",      function: "leading",    semitones: 11 },
];

// ---------------------------------------------------------------------------
// Note Reading (treble clef lines/spaces)
// ---------------------------------------------------------------------------

export interface StaffNote {
  /** Note name with octave */
  note: string;
  /** Display name */
  label: string;
  /** Position from bottom: 0 = first ledger below, 1 = first space, etc. */
  position: number;
  /** Whether this sits on a line (vs in a space) */
  onLine: boolean;
  mnemonic?: string;
}

/** Treble clef — lines bottom to top */
export const TREBLE_LINES: StaffNote[] = [
  { note: "E4", label: "E4", position: 1, onLine: true, mnemonic: "Every" },
  { note: "G4", label: "G4", position: 2, onLine: true, mnemonic: "Good" },
  { note: "B4", label: "B4", position: 3, onLine: true, mnemonic: "Boy" },
  { note: "D5", label: "D5", position: 4, onLine: true, mnemonic: "Does" },
  { note: "F5", label: "F5", position: 5, onLine: true, mnemonic: "Fine" },
];

/** Treble clef — spaces bottom to top */
export const TREBLE_SPACES: StaffNote[] = [
  { note: "F4", label: "F4", position: 1, onLine: false, mnemonic: "F" },
  { note: "A4", label: "A4", position: 2, onLine: false, mnemonic: "A" },
  { note: "C5", label: "C5", position: 3, onLine: false, mnemonic: "C" },
  { note: "E5", label: "E5", position: 4, onLine: false, mnemonic: "E" },
];

/** Bass clef — lines bottom to top */
export const BASS_LINES: StaffNote[] = [
  { note: "G2", label: "G2", position: 1, onLine: true, mnemonic: "Good" },
  { note: "B2", label: "B2", position: 2, onLine: true, mnemonic: "Boys" },
  { note: "D3", label: "D3", position: 3, onLine: true, mnemonic: "Do" },
  { note: "F3", label: "F3", position: 4, onLine: true, mnemonic: "Fine" },
  { note: "A3", label: "A3", position: 5, onLine: true, mnemonic: "Always" },
];

/** Bass clef — spaces bottom to top */
export const BASS_SPACES: StaffNote[] = [
  { note: "A2", label: "A2", position: 1, onLine: false, mnemonic: "All" },
  { note: "C3", label: "C3", position: 2, onLine: false, mnemonic: "Cows" },
  { note: "E3", label: "E3", position: 3, onLine: false, mnemonic: "Eat" },
  { note: "G3", label: "G3", position: 4, onLine: false, mnemonic: "Grass" },
];

// ---------------------------------------------------------------------------
// Chord formulas (display-only reference)
// ---------------------------------------------------------------------------

export interface ChordFormula {
  name: string;
  symbol: string;
  intervals: string;
  semitones: number[];
  example: string;
}

export const CHORD_FORMULAS: ChordFormula[] = [
  { name: "Major",            symbol: "",     intervals: "1 – 3 – 5",        semitones: [0,4,7],     example: "C–E–G"       },
  { name: "Minor",            symbol: "m",    intervals: "1 – ♭3 – 5",       semitones: [0,3,7],     example: "C–Eb–G"      },
  { name: "Diminished",       symbol: "°",    intervals: "1 – ♭3 – ♭5",      semitones: [0,3,6],     example: "C–Eb–Gb"     },
  { name: "Augmented",        symbol: "+",    intervals: "1 – 3 – ♯5",       semitones: [0,4,8],     example: "C–E–G#"      },
  { name: "Sus2",             symbol: "sus2", intervals: "1 – 2 – 5",        semitones: [0,2,7],     example: "C–D–G"       },
  { name: "Sus4",             symbol: "sus4", intervals: "1 – 4 – 5",        semitones: [0,5,7],     example: "C–F–G"       },
  { name: "Dom 7th",          symbol: "7",    intervals: "1 – 3 – 5 – ♭7",   semitones: [0,4,7,10],  example: "C–E–G–Bb"    },
  { name: "Major 7th",        symbol: "maj7", intervals: "1 – 3 – 5 – 7",    semitones: [0,4,7,11],  example: "C–E–G–B"     },
  { name: "Minor 7th",        symbol: "m7",   intervals: "1 – ♭3 – 5 – ♭7",  semitones: [0,3,7,10],  example: "C–Eb–G–Bb"   },
  { name: "Half-dim 7th",     symbol: "ø7",   intervals: "1 – ♭3 – ♭5 – ♭7", semitones: [0,3,6,10],  example: "C–Eb–Gb–Bb"  },
  { name: "Dim 7th",          symbol: "°7",   intervals: "1 – ♭3 – ♭5 – 𝄫7", semitones: [0,3,6,9],   example: "C–Eb–Gb–Bbb" },
  { name: "Dom 9th",          symbol: "9",    intervals: "1 – 3 – 5 – ♭7 – 9",semitones: [0,4,7,10,14],example: "C–E–G–Bb–D" },
];

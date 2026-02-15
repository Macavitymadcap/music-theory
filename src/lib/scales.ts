import {
  type Note,
  getFrequencyFromTonicAndInterval,
  getFrequencyFromName,
} from "./notes";
import { Duration, DURATIONS } from "./duration";

export interface Scale {
  name: string;
  length: number;
  intervals: readonly number[];
}

export interface ScaleGroup {
  label: string;
  scales: ScaleName[];
}

/** All scale definitions */
export const SCALES = {
  // ── Major modes ──
  major: { name: "major (ionian)", length: 8, intervals: [0, 2, 4, 5, 7, 9, 11, 12] },
  dorian: { name: "dorian", length: 8, intervals: [0, 2, 3, 5, 7, 9, 10, 12] },
  phrygian: { name: "phrygian", length: 8, intervals: [0, 1, 3, 5, 7, 8, 10, 12] },
  lydian: { name: "lydian", length: 8, intervals: [0, 2, 4, 6, 7, 9, 11, 12] },
  mixolydian: { name: "mixolydian", length: 8, intervals: [0, 2, 4, 5, 7, 9, 10, 12] },
  aeolian: { name: "aeolian (natural minor)", length: 8, intervals: [0, 2, 3, 5, 7, 8, 10, 12] },
  locrian: { name: "locrian", length: 8, intervals: [0, 1, 3, 5, 6, 8, 10, 12] },

  // ── Minor variants ──
  "natural-minor": { name: "natural minor", length: 8, intervals: [0, 2, 3, 5, 7, 8, 10, 12] },
  "harmonic-minor": { name: "harmonic minor", length: 8, intervals: [0, 2, 3, 5, 7, 8, 11, 12] },
  "melodic-minor-ascending": { name: "melodic minor (asc)", length: 8, intervals: [0, 2, 3, 5, 7, 9, 11, 12] },
  "melodic-minor-descending": { name: "melodic minor (desc)", length: 8, intervals: [12, 10, 8, 7, 5, 3, 2, 0] },

  // ── Pentatonic & blues ──
  "major-pentatonic": { name: "major pentatonic", length: 6, intervals: [0, 2, 4, 7, 9, 12] },
  "minor-pentatonic": { name: "minor pentatonic", length: 6, intervals: [0, 3, 5, 7, 10, 12] },
  blues: { name: "blues", length: 7, intervals: [0, 3, 5, 6, 7, 10, 12] },
  "major-blues": { name: "major blues", length: 7, intervals: [0, 2, 3, 4, 7, 9, 12] },

  // ── Jazz / extended ──
  "mixo-blues": { name: "mixo-blues", length: 10, intervals: [0, 1, 2, 3, 4, 5, 7, 8, 10, 12] },
  bebop: { name: "bebop dominant", length: 9, intervals: [0, 2, 4, 5, 7, 9, 10, 11, 12] },
  "bebop-major": { name: "bebop major", length: 9, intervals: [0, 2, 4, 5, 7, 8, 9, 11, 12] },
  "bebop-minor": { name: "bebop minor (dorian)", length: 9, intervals: [0, 2, 3, 4, 5, 7, 9, 10, 12] },
  "lydian-dominant": { name: "lydian dominant", length: 8, intervals: [0, 2, 4, 6, 7, 9, 10, 12] },
  altered: { name: "altered (super locrian)", length: 8, intervals: [0, 1, 3, 4, 6, 8, 10, 12] },
  "half-whole-diminished": { name: "half-whole diminished", length: 9, intervals: [0, 1, 3, 4, 6, 7, 9, 10, 12] },
  "whole-half-diminished": { name: "whole-half diminished", length: 9, intervals: [0, 2, 3, 5, 6, 8, 9, 11, 12] },
  "whole-tone": { name: "whole tone", length: 7, intervals: [0, 2, 4, 6, 8, 10, 12] },
  chromatic: { name: "chromatic", length: 13, intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },

  // ── Eastern & exotic ──
  "phrygian-dominant": { name: "phrygian dominant (freygish)", length: 8, intervals: [0, 1, 4, 5, 7, 8, 10, 12] },
  "double-harmonic-major": { name: "double harmonic major (byzantine)", length: 8, intervals: [0, 1, 4, 5, 7, 8, 11, 12] },
  "double-harmonic-minor": { name: "double harmonic minor (hungarian)", length: 8, intervals: [0, 2, 3, 6, 7, 8, 11, 12] },
  "hungarian-major": { name: "hungarian major", length: 8, intervals: [0, 3, 4, 6, 7, 9, 10, 12] },
  "romanian-minor": { name: "romanian minor", length: 8, intervals: [0, 2, 3, 6, 7, 9, 10, 12] },
  "maqam-hijaz": { name: "maqam hijaz", length: 8, intervals: [0, 1, 4, 5, 7, 8, 10, 12] },
  persian: { name: "persian", length: 8, intervals: [0, 1, 4, 5, 6, 8, 11, 12] },
  "raga-bhairav": { name: "raga bhairav", length: 8, intervals: [0, 1, 4, 5, 7, 8, 11, 12] },
  "raga-todi": { name: "raga todi", length: 8, intervals: [0, 1, 3, 6, 7, 8, 11, 12] },
  "raga-kafi": { name: "raga kafi (dorian)", length: 8, intervals: [0, 2, 3, 5, 7, 9, 10, 12] },
  hirajoshi: { name: "hirajoshi", length: 6, intervals: [0, 2, 3, 7, 8, 12] },
  "in-sen": { name: "in-sen", length: 6, intervals: [0, 1, 5, 7, 10, 12] },
  iwato: { name: "iwato", length: 6, intervals: [0, 1, 5, 6, 10, 12] },
  "chinese-pentatonic": { name: "chinese pentatonic", length: 6, intervals: [0, 4, 6, 7, 11, 12] },
  "balinese-pelog": { name: "balinese pelog", length: 6, intervals: [0, 1, 3, 7, 8, 12] },
  egyptian: { name: "egyptian", length: 6, intervals: [0, 2, 5, 7, 10, 12] },
  enigmatic: { name: "enigmatic", length: 8, intervals: [0, 1, 4, 6, 8, 10, 11, 12] },
  "neapolitan-major": { name: "neapolitan major", length: 8, intervals: [0, 1, 3, 5, 7, 9, 11, 12] },
  "neapolitan-minor": { name: "neapolitan minor", length: 8, intervals: [0, 1, 3, 5, 7, 8, 11, 12] },
  prometheus: { name: "prometheus", length: 7, intervals: [0, 2, 4, 6, 9, 10, 12] },
  tritone: { name: "tritone", length: 7, intervals: [0, 1, 4, 6, 7, 10, 12] },
} as const satisfies Record<string, Scale>;

export type ScaleName = keyof typeof SCALES;

/** Grouped scales for UI display */
export const SCALE_GROUPS: ScaleGroup[] = [
  {
    label: "Major modes",
    scales: ["major", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"],
  },
  {
    label: "Minor variants",
    scales: ["natural-minor", "harmonic-minor", "melodic-minor-ascending", "melodic-minor-descending"],
  },
  {
    label: "Pentatonic & blues",
    scales: ["major-pentatonic", "minor-pentatonic", "blues", "major-blues"],
  },
  {
    label: "Jazz / extended",
    scales: [
      "mixo-blues", "bebop", "bebop-major", "bebop-minor",
      "lydian-dominant", "altered", "half-whole-diminished", "whole-half-diminished",
      "whole-tone", "chromatic",
    ],
  },
  {
    label: "Eastern & exotic",
    scales: [
      "phrygian-dominant", "double-harmonic-major", "double-harmonic-minor",
      "hungarian-major", "romanian-minor", "maqam-hijaz", "persian",
      "raga-bhairav", "raga-todi", "raga-kafi",
      "hirajoshi", "in-sen", "iwato", "chinese-pentatonic", "balinese-pelog",
      "egyptian", "enigmatic", "neapolitan-major", "neapolitan-minor",
      "prometheus", "tritone",
    ],
  },
];

/** Create Notes for a scale from tonic frequency */
export function createScaleNotes(tonic: number, scale: Scale, duration: Duration = DURATIONS.CROTCHET): Note[] {
  return scale.intervals.map((interval) => ({
    frequency: getFrequencyFromTonicAndInterval(tonic, interval),
    value: duration,
  }));
}

export function createScale(scaleName: ScaleName, tonic: number): Note[] {
  const scale = SCALES[scaleName];
  if (!scale) throw new Error(`Unknown scale: "${scaleName}"`);
  return createScaleNotes(tonic, scale);
}

export function createScaleFromNoteName(scaleName: ScaleName, tonicName: string): Note[] {
  return createScale(scaleName, getFrequencyFromName(tonicName));
}
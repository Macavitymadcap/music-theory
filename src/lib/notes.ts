/**
 * Note frequencies from C0 to B8 (standard tuning A4 = 440Hz)
 * @see https://pages.mtu.edu/~suits/notefreqs.html
 */

export const TOTAL_SEMITONES = 12;

export const NOTE_NAMES = [
  "c", "db", "d", "eb", "e", "f", "gb", "g", "ab", "a", "bb", "b",
] as const;

export type NoteName = (typeof NOTE_NAMES)[number];

// Generate all note frequencies programmatically from A4 = 440Hz
const A4_FREQUENCY = 440;
const A4_MIDI = 69;

function midiToFrequency(midi: number): number {
  return A4_FREQUENCY * Math.pow(2, (midi - A4_MIDI) / 12);
}

/** Map of note name + octave (e.g. "c4", "db5") to frequency in Hz */
export const NOTE_FREQUENCIES: Record<string, number> = {};

for (let octave = 0; octave <= 8; octave++) {
  for (let i = 0; i < NOTE_NAMES.length; i++) {
    const name = `${NOTE_NAMES[i]}${octave}`;
    // C0 = MIDI 12, so MIDI = 12 + octave*12 + semitone
    const midi = 12 + octave * 12 + i;
    if (midi <= 12 + 8 * 12 + 11) {
      NOTE_FREQUENCIES[name] = Number.parseFloat(midiToFrequency(midi).toFixed(2));
    }
  }
}

export function getFrequencyFromName(noteName: string): number {
  const freq = NOTE_FREQUENCIES[noteName.toLowerCase()];
  if (freq === undefined) {
    throw new Error(`Unknown note: "${noteName}"`);
  }
  return freq;
}

export function getFrequencyFromTonicAndInterval(
  tonic: number,
  interval: number
): number {
  return tonic * Math.pow(2, interval / 12);
}

export interface Note {
  frequency: number;
  /** Duration in beats (e.g. 0.25 = crotchet/quarter note) */
  value: number;
}

export function createNote(frequency: number, value: number): Note {
  return { frequency, value };
}
export const BLACK_SEMITONES = new Set([1, 3, 6, 8, 10]);

const WHITE_DISPLAY: Record<number, string> = {
  0: "C", 2: "D", 4: "E", 5: "F", 7: "G", 9: "A", 11: "B",
};

const BLACK_DISPLAY: Record<number, string> = {
  1: "D♭ / C♯",
  3: "E♭ / D♯",
  6: "G♭ / F♯",
  8: "A♭ / G♯",
  10: "B♭ / A♯",
};

export function frequencyToMidi(freq: number): number {
  return Math.round(12 * Math.log2(freq / 440) + 69);
}

export function isBlackKey(midi: number): boolean {
  return BLACK_SEMITONES.has(midi % 12);
}

export function midiToDisplayName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = midi % 12;
  const base = BLACK_DISPLAY[semitone] ?? WHITE_DISPLAY[semitone] ?? "?";
  return `${base}${octave}`;
}

export function midiToOctave(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

/**
 * Given a set of active MIDI numbers, compute a display range with padding
 * and a minimum span of 3 octaves (36 semitones).
 */
export function computeMidiRange(midis: number[]): { low: number; high: number } {
  if (midis.length === 0) return { low: 48, high: 84 };

  const MIN_RANGE = 36;
  let low = Math.max(0, Math.min(...midis) - 5);
  let high = Math.min(127, Math.max(...midis) + 5);

  if (high - low < MIN_RANGE) {
    const expand = MIN_RANGE - (high - low);
    low = Math.max(0, low - Math.floor(expand / 2));
    high = Math.min(127, high + Math.ceil(expand / 2));
    if (high - low < MIN_RANGE) {
      if (low === 0) high = Math.min(127, MIN_RANGE);
      else low = Math.max(0, high - MIN_RANGE);
    }
  }

  return { low, high };
}

/** Black key left-position offset within an octave (in white-key units) */
export const BLACK_KEY_OFFSETS: Record<number, number> = {
  1: 0.6,
  3: 1.75,
  6: 3.6,
  8: 4.7,
  10: 5.8,
};

/**
 * Build the full list of white and black key descriptors for a MIDI range.
 * Range is expanded to start/end on octave boundaries.
 */
export interface KeyDescriptor {
  midi: number;
  isBlack: boolean;
  /** Only set for black keys — left position as a percentage of total keyboard width */
  leftPercent?: number;
}

export function buildKeyDescriptors(low: number, high: number): {
  whiteKeys: KeyDescriptor[];
  blackKeys: KeyDescriptor[];
} {
  const start = low - (low % 12);
  const end = high + ((12 - (high % 12)) % 12);

  const whiteKeys: KeyDescriptor[] = [];
  const blackKeys: KeyDescriptor[] = [];

  for (let midi = start; midi <= end; midi++) {
    if (isBlackKey(midi)) {
      blackKeys.push({ midi, isBlack: true });
    } else {
      whiteKeys.push({ midi, isBlack: false });
    }
  }

  const totalWhite = whiteKeys.length;

  // Compute left position for each black key
  for (const key of blackKeys) {
    const octaveStart = key.midi - (key.midi % 12);
    const whitesBefore = whiteKeys.filter((w) => w.midi >= start && w.midi < octaveStart).length;
    const semitone = key.midi % 12;
    const offsetInOctave = BLACK_KEY_OFFSETS[semitone] ?? 0;
    key.leftPercent = ((whitesBefore + offsetInOctave) / totalWhite) * 100;
  }

  return { whiteKeys, blackKeys };
}
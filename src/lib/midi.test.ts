import { describe, it, expect } from "vitest";
import {
  frequencyToMidi,
  isBlackKey,
  midiToDisplayName,
  midiToOctave,
  computeMidiRange,
  buildKeyDescriptors,
  BLACK_SEMITONES,
  BLACK_KEY_OFFSETS,
} from "./midi";

describe("frequencyToMidi", () => {
  it("A4 (440 Hz) → 69", () => expect(frequencyToMidi(440)).toBe(69));
  it("C4 (~261.63 Hz) → 60", () => expect(frequencyToMidi(261.63)).toBe(60));
  it("A5 (880 Hz) → 81", () => expect(frequencyToMidi(880)).toBe(81));
  it("A3 (220 Hz) → 57", () => expect(frequencyToMidi(220)).toBe(57));
  it("middle B4 (~493.88 Hz) → 71", () => expect(frequencyToMidi(493.88)).toBe(71));
  it("C1 (32.7 Hz) → 24", () => expect(frequencyToMidi(32.7)).toBe(24));

  it("rounds to nearest semitone for slightly off frequencies", () => {
    // 441 Hz is barely above A4 — should still round to 69
    expect(frequencyToMidi(441)).toBe(69);
  });
});

describe("isBlackKey", () => {
  const blacks = [1, 3, 6, 8, 10]; // semitones within octave
  const whites = [0, 2, 4, 5, 7, 9, 11];

  it.each(whites.map((s) => [s + 60]))("MIDI %i is white", (midi) => {
    expect(isBlackKey(midi)).toBe(false);
  });

  it.each(blacks.map((s) => [s + 60]))("MIDI %i is black", (midi) => {
    expect(isBlackKey(midi)).toBe(true);
  });

  it("works across octave boundaries (midi 73 = C#5)", () => {
    expect(isBlackKey(73)).toBe(true);
  });

  it("BLACK_SEMITONES exports the correct set", () => {
    expect(BLACK_SEMITONES).toEqual(new Set([1, 3, 6, 8, 10]));
  });
});

describe("midiToOctave", () => {
  it("MIDI 60 (C4) → octave 4", () => expect(midiToOctave(60)).toBe(4));
  it("MIDI 69 (A4) → octave 4", () => expect(midiToOctave(69)).toBe(4));
  it("MIDI 72 (C5) → octave 5", () => expect(midiToOctave(72)).toBe(5));
  it("MIDI 24 (C1) → octave 1", () => expect(midiToOctave(24)).toBe(1));
  it("MIDI 12 (C0) → octave 0", () => expect(midiToOctave(12)).toBe(0));
});

describe("midiToDisplayName", () => {
  it("renders C4", () => expect(midiToDisplayName(60)).toBe("C4"));
  it("renders A4", () => expect(midiToDisplayName(69)).toBe("A4"));
  it("renders B4", () => expect(midiToDisplayName(71)).toBe("B4"));
  it("renders C#4 / Db4 as enharmonic pair", () => {
    expect(midiToDisplayName(61)).toBe("D♭ / C♯4");
  });
  it("renders Eb4 / D#4 as enharmonic pair", () => {
    expect(midiToDisplayName(63)).toBe("E♭ / D♯4");
  });
  it("renders Gb4 / F#4 as enharmonic pair", () => {
    expect(midiToDisplayName(66)).toBe("G♭ / F♯4");
  });
  it("renders Ab4 / G#4 as enharmonic pair", () => {
    expect(midiToDisplayName(68)).toBe("A♭ / G♯4");
  });
  it("renders Bb4 / A#4 as enharmonic pair", () => {
    expect(midiToDisplayName(70)).toBe("B♭ / A♯4");
  });
  it("crosses octave boundary correctly — C5", () => {
    expect(midiToDisplayName(72)).toBe("C5");
  });
});

describe("computeMidiRange", () => {
  it("returns a sensible default for empty input (36+ semitones)", () => {
    const { low, high } = computeMidiRange([]);
    expect(high - low).toBeGreaterThanOrEqual(36);
  });

  it("enforces minimum 36-semitone range for a single note", () => {
    const { low, high } = computeMidiRange([69]);
    expect(high - low).toBeGreaterThanOrEqual(36);
  });

  it("pads below the lowest note", () => {
    const { low } = computeMidiRange([60, 67]);
    expect(low).toBeLessThan(60);
  });

  it("pads above the highest note", () => {
    const { high } = computeMidiRange([60, 67]);
    expect(high).toBeGreaterThan(67);
  });

  it("does not exceed MIDI lower bound 0", () => {
    const { low } = computeMidiRange([0]);
    expect(low).toBeGreaterThanOrEqual(0);
  });

  it("does not exceed MIDI upper bound 127", () => {
    const { high } = computeMidiRange([127]);
    expect(high).toBeLessThanOrEqual(127);
  });

  it("a wide span (0–127) stays within bounds", () => {
    const { low, high } = computeMidiRange([0, 127]);
    expect(low).toBeGreaterThanOrEqual(0);
    expect(high).toBeLessThanOrEqual(127);
  });

  it("returns symmetric padding when note is in the middle of the range", () => {
    const { low, high } = computeMidiRange([60]);
    // Note is centred-ish in the range
    expect(Math.abs((high - 60) - (60 - low))).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// buildKeyDescriptors
// ---------------------------------------------------------------------------

describe("buildKeyDescriptors", () => {
  it("always starts on a C (semitone 0)", () => {
    const { whiteKeys } = buildKeyDescriptors(48, 58);
    expect(whiteKeys[0].midi % 12).toBe(0);
  });

  it("always ends on a C (semitone 0)", () => {
    const { whiteKeys } = buildKeyDescriptors(48, 58);
    expect(whiteKeys.at(-1)!.midi % 12).toBe(0);
  });

  it("one octave C3–C4 yields 8 white keys", () => {
    const { whiteKeys } = buildKeyDescriptors(48, 58);
    expect(whiteKeys.length).toBe(8);
  });

  it("one octave C3–C4 yields 5 black keys", () => {
    const { blackKeys } = buildKeyDescriptors(48, 58);
    expect(blackKeys.length).toBe(5);
  });

  it("two octaves yield 15 white keys", () => {
    // C3 (48) to C5 (72)
    const { whiteKeys } = buildKeyDescriptors(48, 72);
    expect(whiteKeys.length).toBe(15);
  });

  it("two octaves yield 10 black keys", () => {
    const { blackKeys } = buildKeyDescriptors(48, 72);
    expect(blackKeys.length).toBe(10);
  });

  it("snaps range start down to nearest C", () => {
    // 50 = D3 → should snap to 48 (C3)
    const { whiteKeys } = buildKeyDescriptors(50, 70);
    expect(whiteKeys[0].midi).toBe(48);
  });

  it("snaps range end up to nearest C", () => {
    // 70 = Bb4 → should snap up to 72 (C5)
    const { whiteKeys } = buildKeyDescriptors(50, 70);
    expect(whiteKeys.at(-1)!.midi).toBe(72);
  });

  it("all white keys have isBlack: false", () => {
    const { whiteKeys } = buildKeyDescriptors(48, 60);
    expect(whiteKeys.every((k) => !k.isBlack)).toBe(true);
  });

  it("all black keys have isBlack: true", () => {
    const { blackKeys } = buildKeyDescriptors(48, 60);
    expect(blackKeys.every((k) => k.isBlack)).toBe(true);
  });

  it("every black key has a leftPercent between 0 and 100", () => {
    const { blackKeys } = buildKeyDescriptors(48, 72);
    for (const k of blackKeys) {
      expect(k.leftPercent).toBeGreaterThan(0);
      expect(k.leftPercent).toBeLessThan(100);
    }
  });

  it("black keys are in ascending MIDI order", () => {
    const { blackKeys } = buildKeyDescriptors(48, 72);
    for (let i = 1; i < blackKeys.length; i++) {
      expect(blackKeys[i].midi).toBeGreaterThan(blackKeys[i - 1].midi);
    }
  });

  it("white keys are in ascending MIDI order", () => {
    const { whiteKeys } = buildKeyDescriptors(48, 72);
    for (let i = 1; i < whiteKeys.length; i++) {
      expect(whiteKeys[i].midi).toBeGreaterThan(whiteKeys[i - 1].midi);
    }
  });

  it("BLACK_KEY_OFFSETS covers all 5 black semitone positions", () => {
    expect(Object.keys(BLACK_KEY_OFFSETS).map(Number).sort((a, b) => a - b)).toEqual([1, 3, 6, 8, 10]);
  });
});
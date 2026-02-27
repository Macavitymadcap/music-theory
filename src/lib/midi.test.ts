import { describe, it, expect } from "vitest";
import {
  frequencyToMidi,
  isBlackKey,
  midiToDisplayName,
  computeMidiRange,
  buildKeyDescriptors,
} from "./midi";

describe("frequencyToMidi", () => {
  it("A4 (440Hz) is MIDI 69", () => {
    expect(frequencyToMidi(440)).toBe(69);
  });

  it("C4 (~261.63Hz) is MIDI 60", () => {
    expect(frequencyToMidi(261.63)).toBe(60);
  });

  it("A5 (880Hz) is MIDI 81", () => {
    expect(frequencyToMidi(880)).toBe(81);
  });
});

describe("isBlackKey", () => {
  it("C (semitone 0) is white", () => expect(isBlackKey(60)).toBe(false));
  it("C# (semitone 1) is black", () => expect(isBlackKey(61)).toBe(true));
  it("D (semitone 2) is white", () => expect(isBlackKey(62)).toBe(false));
  it("F# (semitone 6) is black", () => expect(isBlackKey(66)).toBe(true));
});

describe("midiToDisplayName", () => {
  it("renders C4 correctly", () => {
    expect(midiToDisplayName(60)).toBe("C4");
  });

  it("renders A4 correctly", () => {
    expect(midiToDisplayName(69)).toBe("A4");
  });

  it("renders a black key with both names", () => {
    expect(midiToDisplayName(61)).toBe("D♭ / C♯4");
  });
});

describe("computeMidiRange", () => {
  it("returns default range for empty input", () => {
    const { low, high } = computeMidiRange([]);
    expect(high - low).toBeGreaterThanOrEqual(36);
  });

  it("enforces minimum 36 semitone range for a single note", () => {
    const { low, high } = computeMidiRange([69]);
    expect(high - low).toBeGreaterThanOrEqual(36);
  });

  it("pads around the active notes", () => {
    const { low, high } = computeMidiRange([60, 67]);
    expect(low).toBeLessThan(60);
    expect(high).toBeGreaterThan(67);
  });

  it("does not exceed MIDI bounds 0–127", () => {
    const { low, high } = computeMidiRange([0, 127]);
    expect(low).toBeGreaterThanOrEqual(0);
    expect(high).toBeLessThanOrEqual(127);
  });
});

describe("buildKeyDescriptors", () => {
  it("always starts the range on a C", () => {
    const { whiteKeys } = buildKeyDescriptors(48, 58);
    expect(whiteKeys[0].midi % 12).toBe(0);
  });

  it("always ends the range on a C", () => {
    const { whiteKeys } = buildKeyDescriptors(48, 58);
    expect(whiteKeys.at(-1)!.midi % 12).toBe(0);
  });

  it("white key count for C3–C4 (one octave inclusive) is 8", () => {
    // Any input in the C3–B3 range snaps to C3–C4, giving 8 white keys (C D E F G A B C)
    const { whiteKeys } = buildKeyDescriptors(48, 58);
    expect(whiteKeys.length).toBe(8);
  });

  it("black key count for C3–C4 is 5", () => {
    const { blackKeys } = buildKeyDescriptors(48, 58);
    expect(blackKeys.length).toBe(5);
  });

  it("expands range to octave boundaries", () => {
    // 50 (D3) snaps start down to 48 (C3), 70 (Bb4) snaps end up to 72 (C5)
    const { whiteKeys } = buildKeyDescriptors(50, 70);
    expect(whiteKeys[0].midi).toBe(48);
    expect(whiteKeys.at(-1)!.midi).toBe(72);
  });
});
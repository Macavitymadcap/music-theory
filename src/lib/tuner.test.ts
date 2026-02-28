import { describe, it, expect } from "vitest";
import {
  frequencyToMidiExact,
  midiToFrequency,
  analyseFrequency,
  computeNsdf,
  detectPitch,
} from "./tuner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a pure sine wave at the given frequency and sample rate. */
function sineWave(frequency: number, sampleRate: number, length: number): Float32Array {
  const buf = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buf[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }
  return buf;
}

/** Silent (zero) buffer. */
function silentBuffer(length: number): Float32Array {
  return new Float32Array(length);
}

// ---------------------------------------------------------------------------
// frequencyToMidiExact
// ---------------------------------------------------------------------------

describe("frequencyToMidiExact", () => {
  it("returns 69 for A4 (440 Hz)", () => {
    expect(frequencyToMidiExact(440)).toBeCloseTo(69, 5);
  });

  it("returns 60 for middle C (≈261.63 Hz)", () => {
    expect(frequencyToMidiExact(261.6255)).toBeCloseTo(60, 3);
  });

  it("returns 57 for A3 (220 Hz)", () => {
    expect(frequencyToMidiExact(220)).toBeCloseTo(57, 5);
  });
});

// ---------------------------------------------------------------------------
// midiToFrequency
// ---------------------------------------------------------------------------

describe("midiToFrequency", () => {
  it("returns 440 for MIDI 69", () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 5);
  });

  it("returns 880 for MIDI 81 (A5)", () => {
    expect(midiToFrequency(81)).toBeCloseTo(880, 5);
  });

  it("round-trips with frequencyToMidiExact for standard pitches", () => {
    for (const midi of [48, 60, 69, 72, 84]) {
      const freq = midiToFrequency(midi);
      expect(frequencyToMidiExact(freq)).toBeCloseTo(midi, 8);
    }
  });
});

// ---------------------------------------------------------------------------
// analyseFrequency
// ---------------------------------------------------------------------------

describe("analyseFrequency", () => {
  it("identifies A4 correctly", () => {
    const result = analyseFrequency(440);
    expect(result.note).toBe("A");
    expect(result.octave).toBe(4);
    expect(result.cents).toBe(0);
    expect(result.targetFrequency).toBeCloseTo(440, 3);
  });

  it("identifies C4 correctly", () => {
    const result = analyseFrequency(261.6255);
    expect(result.note).toBe("C");
    expect(result.octave).toBe(4);
    expect(Math.abs(result.cents)).toBeLessThanOrEqual(1);
  });

  it("identifies E4 correctly", () => {
    const result = analyseFrequency(329.6276);
    expect(result.note).toBe("E");
    expect(result.octave).toBe(4);
    expect(Math.abs(result.cents)).toBeLessThanOrEqual(1);
  });

  it("reports positive cents for a sharp pitch", () => {
    // A4 raised by 20 cents
    const sharpHz = 440 * Math.pow(2, 20 / 1200);
    const result = analyseFrequency(sharpHz);
    expect(result.note).toBe("A");
    expect(result.cents).toBeCloseTo(20, 0);
  });

  it("reports negative cents for a flat pitch", () => {
    // A4 lowered by 20 cents
    const flatHz = 440 * Math.pow(2, -20 / 1200);
    const result = analyseFrequency(flatHz);
    expect(result.note).toBe("A");
    expect(result.cents).toBeCloseTo(-20, 0);
  });

  it("wraps correctly into the next note for large deviations", () => {
    // 55 cents sharp of A4 → rounds to A♯4
    const hz = 440 * Math.pow(2, 55 / 1200);
    const result = analyseFrequency(hz);
    expect(result.note).toBe("A♯");
  });
});

// ---------------------------------------------------------------------------
// computeNsdf
// ---------------------------------------------------------------------------

describe("computeNsdf", () => {
  it("returns 1 at lag 0 for a non-silent signal", () => {
    const buf = sineWave(440, 44100, 2048);
    const nsdf = computeNsdf(buf);
    expect(nsdf[0]).toBeCloseTo(1, 4);
  });

  it("has a local maximum near the period of the sine wave", () => {
    const sampleRate = 44100;
    const frequency = 440;
    const period = Math.round(sampleRate / frequency); // ~100 samples
    const buf = sineWave(frequency, sampleRate, 2048);
    const nsdf = computeNsdf(buf);

    // The maximum in the range [period-5, period+5] should be a strong peak
    let peak = -Infinity;
    for (let tau = period - 5; tau <= period + 5; tau++) {
      if (nsdf[tau] > peak) peak = nsdf[tau];
    }
    expect(peak).toBeGreaterThan(0.7);
  });
});

// ---------------------------------------------------------------------------
// detectPitch
// ---------------------------------------------------------------------------

describe("detectPitch", () => {
  const sampleRate = 44100;

  it("returns null for a silent buffer", () => {
    const buf = silentBuffer(2048);
    expect(detectPitch(buf, sampleRate)).toBeNull();
  });

  it("returns null for a very low-amplitude buffer", () => {
    const buf = sineWave(440, sampleRate, 2048).map((v) => v * 0.001) as unknown as Float32Array;
    const lowBuf = new Float32Array(buf);
    expect(detectPitch(lowBuf, sampleRate, 0.01)).toBeNull();
  });

  it("detects A4 (440 Hz) within ±5 Hz", () => {
    const buf = sineWave(440, sampleRate, 2048);
    const result = detectPitch(buf, sampleRate);
    expect(result).not.toBeNull();
    expect(Math.abs(result! - 440)).toBeLessThan(5);
  });

  it("detects E4 (329.63 Hz) within ±5 Hz", () => {
    const buf = sineWave(329.6276, sampleRate, 2048);
    const result = detectPitch(buf, sampleRate);
    expect(result).not.toBeNull();
    expect(Math.abs(result! - 329.6276)).toBeLessThan(5);
  });

  it("detects A3 (220 Hz) within ±5 Hz", () => {
    const buf = sineWave(220, sampleRate, 2048);
    const result = detectPitch(buf, sampleRate);
    expect(result).not.toBeNull();
    expect(Math.abs(result! - 220)).toBeLessThan(5);
  });

  it("detects G4 (392 Hz) within ±5 Hz", () => {
    const buf = sineWave(392, sampleRate, 2048);
    const result = detectPitch(buf, sampleRate);
    expect(result).not.toBeNull();
    expect(Math.abs(result! - 392)).toBeLessThan(5);
  });

  it("assigns a correct note name via analyseFrequency round-trip for detected A4", () => {
    const buf = sineWave(440, sampleRate, 2048);
    const hz = detectPitch(buf, sampleRate)!;
    const { note, octave } = analyseFrequency(hz);
    expect(note).toBe("A");
    expect(octave).toBe(4);
  });
});
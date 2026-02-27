import { describe, it, expect } from "vitest";
import {
  resolveProgression,
  PROGRESSION_PRESETS,
  DEGREE_OPTIONS,
  BUILDER_CHORD_OPTIONS,
} from "./progressions";
import { CHORD_INTERVALS } from "./chords";

describe("DEGREE_OPTIONS", () => {
  it("contains 12 degrees covering all semitones 0–11", () => {
    expect(DEGREE_OPTIONS).toHaveLength(12);
    const semitones = DEGREE_OPTIONS.map((d) => d.semitones);
    for (let i = 0; i < 12; i++) {
      expect(semitones).toContain(i);
    }
  });
});

describe("PROGRESSION_PRESETS", () => {
  it("every preset has at least one step", () => {
    for (const preset of PROGRESSION_PRESETS) {
      expect(preset.steps.length, `${preset.name} has no steps`).toBeGreaterThan(0);
    }
  });

  it("every preset step references a valid chord type", () => {
    for (const preset of PROGRESSION_PRESETS) {
      for (const step of preset.steps) {
        expect(
          CHORD_INTERVALS[step.chordType],
          `${preset.name}: unknown chordType "${step.chordType}"`
        ).toBeDefined();
      }
    }
  });

  it("every step has bars >= 1 and hitsPerBar >= 1", () => {
    for (const preset of PROGRESSION_PRESETS) {
      for (const step of preset.steps) {
        expect(step.bars).toBeGreaterThanOrEqual(1);
        expect(step.hitsPerBar).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe("BUILDER_CHORD_OPTIONS", () => {
  it("every option has a non-empty label and value", () => {
    for (const opt of BUILDER_CHORD_OPTIONS) {
      expect(opt.label.length).toBeGreaterThan(0);
      expect(opt.value.length).toBeGreaterThan(0);
      expect(opt.group.length).toBeGreaterThan(0);
    }
  });
});

describe("resolveProgression", () => {
  const steps = [
    { label: "I", semitones: 0, chordType: "majorTriad" as const, bars: 1, hitsPerBar: 1 },
    { label: "V", semitones: 7, chordType: "majorTriad" as const, bars: 1, hitsPerBar: 1 },
  ];

  it("returns one resolved entry per step", () => {
    const resolved = resolveProgression(steps, 440);
    expect(resolved).toHaveLength(2);
  });

  it("tonic step has the same frequency as the input tonic", () => {
    const resolved = resolveProgression(steps, 440);
    expect(resolved[0].tonicFreq).toBeCloseTo(440);
  });

  it("V step frequency is a perfect fifth above the tonic", () => {
    const resolved = resolveProgression(steps, 440);
    expect(resolved[1].tonicFreq).toBeCloseTo(440 * Math.pow(2, 7 / 12), 2);
  });

  it("preserves bars and hitsPerBar from the step", () => {
    const resolved = resolveProgression(steps, 440);
    expect(resolved[0].bars).toBe(1);
    expect(resolved[0].hitsPerBar).toBe(1);
  });

  it("includes the correct intervals for the chord type", () => {
    const resolved = resolveProgression(steps, 440);
    expect(resolved[0].intervals).toEqual(CHORD_INTERVALS.majorTriad);
  });
});
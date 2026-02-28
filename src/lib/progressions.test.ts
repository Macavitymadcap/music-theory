import { describe, it, expect } from "vitest";
import {
  resolveProgression,
  PROGRESSION_PRESETS,
  DEGREE_OPTIONS,
  BUILDER_CHORD_OPTIONS,
  type ProgressionStep,
} from "./progressions";
import { CHORD_INTERVALS } from "./chords";

describe("DEGREE_OPTIONS", () => {
  it("contains exactly 12 degrees", () => {
    expect(DEGREE_OPTIONS).toHaveLength(12);
  });

  it("covers all semitones 0–11", () => {
    const semitones = DEGREE_OPTIONS.map((d) => d.semitones);
    for (let i = 0; i < 12; i++) {
      expect(semitones, `Missing semitone ${i}`).toContain(i);
    }
  });

  it("every degree has a non-empty label", () => {
    for (const d of DEGREE_OPTIONS) {
      expect(d.label.length).toBeGreaterThan(0);
    }
  });

  it("all semitone values are unique", () => {
    const semitones = DEGREE_OPTIONS.map((d) => d.semitones);
    expect(new Set(semitones).size).toBe(12);
  });

  it("tonic (I) has semitone 0", () => {
    const tonic = DEGREE_OPTIONS.find((d) => d.label === "I");
    expect(tonic).toBeDefined();
    expect(tonic!.semitones).toBe(0);
  });

  it("perfect fifth (V) has semitone 7", () => {
    const fifth = DEGREE_OPTIONS.find((d) => d.label === "V");
    expect(fifth).toBeDefined();
    expect(fifth!.semitones).toBe(7);
  });
});

describe("PROGRESSION_PRESETS", () => {
  it("contains at least 5 presets", () => {
    expect(PROGRESSION_PRESETS.length).toBeGreaterThanOrEqual(5);
  });

  it("every preset has a non-empty name", () => {
    for (const p of PROGRESSION_PRESETS) {
      expect(p.name.length).toBeGreaterThan(0);
    }
  });

  it("every preset has a non-empty description", () => {
    for (const p of PROGRESSION_PRESETS) {
      expect(p.description.length).toBeGreaterThan(0);
    }
  });

  it("every preset has at least one step", () => {
    for (const p of PROGRESSION_PRESETS) {
      expect(p.steps.length, `${p.name}: must have steps`).toBeGreaterThan(0);
    }
  });

  it("every step references a valid chord type in CHORD_INTERVALS", () => {
    for (const p of PROGRESSION_PRESETS) {
      for (const step of p.steps) {
        expect(
          CHORD_INTERVALS[step.chordType],
          `${p.name}: unknown chordType "${step.chordType}"`
        ).toBeDefined();
      }
    }
  });

  it("every step has bars >= 1", () => {
    for (const p of PROGRESSION_PRESETS) {
      for (const step of p.steps) {
        expect(step.bars, `${p.name}: bars < 1`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("every step has hitsPerBar >= 1", () => {
    for (const p of PROGRESSION_PRESETS) {
      for (const step of p.steps) {
        expect(step.hitsPerBar, `${p.name}: hitsPerBar < 1`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("every step semitone is in range 0–11", () => {
    for (const p of PROGRESSION_PRESETS) {
      for (const step of p.steps) {
        expect(step.semitones).toBeGreaterThanOrEqual(0);
        expect(step.semitones).toBeLessThanOrEqual(11);
      }
    }
  });

  it("preset names are unique", () => {
    const names = PROGRESSION_PRESETS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("includes a ii–V–I preset (jazz cornerstone)", () => {
    const jazz = PROGRESSION_PRESETS.find((p) => p.name.includes("ii–V–I") || p.name.includes("ii-V-I"));
    expect(jazz).toBeDefined();
  });

  it("includes a 12 Bar Blues preset", () => {
    const blues = PROGRESSION_PRESETS.find((p) => p.name.toLowerCase().includes("blues"));
    expect(blues).toBeDefined();
  });
});

describe("BUILDER_CHORD_OPTIONS", () => {
  it("every option has a non-empty label", () => {
    for (const opt of BUILDER_CHORD_OPTIONS) {
      expect(opt.label.length).toBeGreaterThan(0);
    }
  });

  it("every option has a non-empty value", () => {
    for (const opt of BUILDER_CHORD_OPTIONS) {
      expect(opt.value.length).toBeGreaterThan(0);
    }
  });

  it("every option has a non-empty group name", () => {
    for (const opt of BUILDER_CHORD_OPTIONS) {
      expect(opt.group.length).toBeGreaterThan(0);
    }
  });

  it("every option's value matches a key in CHORD_INTERVALS", () => {
    for (const opt of BUILDER_CHORD_OPTIONS) {
      expect(CHORD_INTERVALS[opt.value], `Missing: ${opt.value}`).toBeDefined();
    }
  });
});

describe("resolveProgression", () => {
  const tonic = 440; // A4

  const steps: ProgressionStep[] = [
    { label: "I", semitones: 0, chordType: "majorTriad", bars: 1, hitsPerBar: 1, beatsPerBar: 4 },
    { label: "IV", semitones: 5, chordType: "majorTriad", bars: 2, hitsPerBar: 2, beatsPerBar: 4 },
    { label: "V", semitones: 7, chordType: "majorTriad", bars: 1, hitsPerBar: 1, beatsPerBar: 4 },
  ];

  it("returns one resolved entry per step", () => {
    expect(resolveProgression(steps, tonic)).toHaveLength(3);
  });

  it("I (semitone 0) has the tonic frequency", () => {
    const resolved = resolveProgression(steps, tonic);
    expect(resolved[0].tonicFreq).toBeCloseTo(tonic);
  });

  it("IV (semitone 5) is a perfect fourth above tonic", () => {
    const resolved = resolveProgression(steps, tonic);
    expect(resolved[1].tonicFreq).toBeCloseTo(tonic * Math.pow(2, 5 / 12), 2);
  });

  it("V (semitone 7) is a perfect fifth above tonic", () => {
    const resolved = resolveProgression(steps, tonic);
    expect(resolved[2].tonicFreq).toBeCloseTo(tonic * Math.pow(2, 7 / 12), 2);
  });

  it("preserves bars from the step", () => {
    const resolved = resolveProgression(steps, tonic);
    expect(resolved[1].bars).toBe(2);
  });

  it("preserves hitsPerBar from the step", () => {
    const resolved = resolveProgression(steps, tonic);
    expect(resolved[1].hitsPerBar).toBe(2);
  });

  it("preserves beatsPerBar from the step", () => {
    const resolved = resolveProgression(steps, tonic);
    expect(resolved[0].beatsPerBar).toBe(4);
  });

  it("includes the correct intervals for the chord type", () => {
    const resolved = resolveProgression(steps, tonic);
    expect(resolved[0].intervals).toEqual(CHORD_INTERVALS.majorTriad);
  });

  it("preserves the label", () => {
    const resolved = resolveProgression(steps, tonic);
    expect(resolved[0].label).toBe("I");
    expect(resolved[1].label).toBe("IV");
  });

  it("handles an empty steps array", () => {
    expect(resolveProgression([], tonic)).toEqual([]);
  });

  it("works with minor chords", () => {
    const minorSteps: ProgressionStep[] = [
      { label: "i", semitones: 0, chordType: "minorTriad", bars: 1, hitsPerBar: 1, beatsPerBar: 4 },
    ];
    const resolved = resolveProgression(minorSteps, tonic);
    expect(resolved[0].intervals).toEqual(CHORD_INTERVALS.minorTriad);
  });

  it("works with jazz seventh chords", () => {
    const jazzSteps: ProgressionStep[] = [
      { label: "ii7", semitones: 2, chordType: "minor7th", bars: 1, hitsPerBar: 1, beatsPerBar: 4 },
      { label: "V7", semitones: 7, chordType: "dominant7th", bars: 1, hitsPerBar: 1, beatsPerBar: 4 },
      { label: "Imaj7", semitones: 0, chordType: "major7th", bars: 2, hitsPerBar: 1, beatsPerBar: 4 },
    ];
    const resolved = resolveProgression(jazzSteps, tonic);
    expect(resolved).toHaveLength(3);
    expect(resolved[0].intervals).toEqual(CHORD_INTERVALS.minor7th);
    expect(resolved[1].intervals).toEqual(CHORD_INTERVALS.dominant7th);
  });

  it("all resolved tonicFreq values are positive numbers", () => {
    const resolved = resolveProgression(steps, tonic);
    for (const r of resolved) {
      expect(r.tonicFreq).toBeGreaterThan(0);
    }
  });
});
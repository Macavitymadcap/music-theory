/**
 * web-audio.test.ts
 *
 * Tests for the pure scheduling logic in web-audio.ts.
 *
 * What IS testable here:
 *   - durationToSeconds: pure maths, no mocks needed
 *   - applyEnvelope: verifies the exact gain automation calls and their timing
 *   - chainNodes: verifies connect() wiring and correct return value
 *   - scheduleNote: verifies oscillator setup, gain chain, start/stop times
 *   - scheduleChord: verifies per-note gain division and one oscillator per note
 *   - scheduleChordAtTime: verifies frequency assignment, waveform, start/stop
 *   - playScale: verifies sequential scheduling offsets and return value
 *   - playChord: verifies simultaneous scheduling and return value
 *   - playChordProgression: verifies sequential chord timing and return value
 *
 * What is NOT meaningfully testable here:
 *   - Whether audio actually plays (requires a real AudioContext / browser)
 *   - Actual sound quality or envelope shape (analogue output)
 *
 * NOTE on TIME_SIGNATURES:
 *   TIME_SIGNATURES values are fractional ratios (e.g. FOUR_FOUR = 4/4 = 1),
 *   not raw beat counts. All expected durations are derived via durationToSeconds
 *   rather than hardcoded, so tests remain correct regardless of the internal
 *   representation.
 */

import { describe, it, expect, vi } from "vitest";
import {
  durationToSeconds,
  applyEnvelope,
  chainNodes,
  scheduleNote,
  scheduleChord,
  scheduleChordAtTime,
  playScale,
  playChord,
  playChordProgression,
} from "./web-audio";
import { DURATIONS, TIME_SIGNATURES } from "./duration";
import type { Note } from "./notes";
import type { Chord } from "./chords";

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

/** Returns a GainNode mock with spied automation methods. */
function makeGainNode() {
  return {
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
}

/** Returns an OscillatorNode mock. */
function makeOscillator() {
  return {
    type: "" as OscillatorType,
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

/**
 * Build a minimal AudioContext mock.
 * Each call to createGain() returns a *fresh* GainNode mock so
 * individual nodes can be inspected without index gymnastics.
 */
function makeContext(currentTime = 0) {
  return {
    currentTime,
    destination: { connect: vi.fn() } as unknown as AudioDestinationNode,
    createOscillator: vi.fn(() => makeOscillator()),
    createGain: vi.fn(() => makeGainNode()),
  } as unknown as AudioContext;
}

/** Convenience builders */
const note = (frequency: number, value = 0.25): Note => ({
  frequency,
  value,
});

const chord = (frequencies: number[], value = 0.25): Chord => ({
  notes: frequencies.map((f) => note(f, value)),
  length: frequencies.length,
});

// Shared timing constants derived from the library so tests never hardcode seconds.
const BPM = 120;
const TS = TIME_SIGNATURES.FOUR_FOUR;
const CROTCHET_S = durationToSeconds(DURATIONS.CROTCHET, BPM, TS);
const MINIM_S = durationToSeconds(DURATIONS.MINIM, BPM, TS);
const SEMIBREVE_S = durationToSeconds(DURATIONS.SEMIBREVE, BPM, TS);
const QUAVER_S = durationToSeconds(DURATIONS.QUAVER, BPM, TS);

describe("durationToSeconds", () => {
  it("a crotchet is shorter than a minim", () => {
    expect(CROTCHET_S).toBeLessThan(MINIM_S);
  });

  it("minim is exactly twice a crotchet", () => {
    expect(MINIM_S).toBeCloseTo(CROTCHET_S * 2);
  });

  it("semibreve is exactly four times a crotchet", () => {
    expect(SEMIBREVE_S).toBeCloseTo(CROTCHET_S * 4);
  });

  it("quaver is exactly half a crotchet", () => {
    expect(QUAVER_S).toBeCloseTo(CROTCHET_S / 2);
  });

  it("scales inversely with BPM — doubling BPM halves the duration", () => {
    const slow = durationToSeconds(DURATIONS.CROTCHET, 60, TS);
    const fast = durationToSeconds(DURATIONS.CROTCHET, 120, TS);
    expect(slow).toBeCloseTo(fast * 2);
  });

  it("scales proportionally with the time signature value", () => {
    const threeFour = durationToSeconds(DURATIONS.CROTCHET, BPM, TIME_SIGNATURES.THREE_FOUR);
    const sixEight = durationToSeconds(DURATIONS.CROTCHET, BPM, TIME_SIGNATURES.SIX_EIGHT);
    // THREE_FOUR = 3/4, SIX_EIGHT = 6/8 = 3/4 — they are equal
    expect(threeFour).toBeCloseTo(sixEight);
  });

  it("returns 0 for a zero-value note", () => {
    expect(durationToSeconds(0, BPM, TS)).toBe(0);
  });

  it("all durations are positive for positive inputs", () => {
    for (const d of Object.values(DURATIONS)) {
      expect(durationToSeconds(d, BPM, TS)).toBeGreaterThan(0);
    }
  });
});

describe("applyEnvelope", () => {
  it("sets initial gain to 0 at startTime", () => {
    const g = makeGainNode();
    applyEnvelope(g as unknown as GainNode, 1, 2);
    expect(g.gain.setValueAtTime).toHaveBeenCalledWith(0, 1);
  });

  it("attack reaches 1.0 at startTime + 25% of duration", () => {
    const g = makeGainNode();
    applyEnvelope(g as unknown as GainNode, 1, 2);
    // attack = 2 * 0.25 = 0.5 → ramp to 1 at t = 1.5
    expect(g.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, 1.5);
  });

  it("decay settles to 0.2 at startTime + 50% of duration", () => {
    const g = makeGainNode();
    applyEnvelope(g as unknown as GainNode, 1, 2);
    // attack + decay = 0.5 + 0.5 → ramp to 0.2 at t = 2.0
    expect(g.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.2, 2);
  });

  it("release reaches 0 at startTime + duration", () => {
    const g = makeGainNode();
    applyEnvelope(g as unknown as GainNode, 1, 2);
    // full duration = 2s → final ramp to 0 at t = 3.0
    expect(g.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 3);
  });

  it("makes exactly 1 setValueAtTime call and 3 linearRamp calls", () => {
    const g = makeGainNode();
    applyEnvelope(g as unknown as GainNode, 0, 1);
    expect(g.gain.setValueAtTime).toHaveBeenCalledTimes(1);
    expect(g.gain.linearRampToValueAtTime).toHaveBeenCalledTimes(3);
  });

  it("all automation times are >= startTime", () => {
    const g = makeGainNode();
    applyEnvelope(g as unknown as GainNode, 5, 4);
    for (const [, t] of g.gain.linearRampToValueAtTime.mock.calls) {
      expect(t).toBeGreaterThanOrEqual(5);
    }
  });

  it("final ramp lands at exactly startTime + duration", () => {
    const g = makeGainNode();
    applyEnvelope(g as unknown as GainNode, 5, 4);
    const ramps = g.gain.linearRampToValueAtTime.mock.calls;
    expect(ramps[2][1]).toBeCloseTo(9);
  });
});

describe("chainNodes", () => {
  it("returns context.destination when called with no nodes", () => {
    const ctx = makeContext();
    expect(chainNodes(ctx)).toBe(ctx.destination);
  });

  it("returns the first (input) node when one node is passed", () => {
    const ctx = makeContext();
    const a = { connect: vi.fn() } as unknown as AudioNode;
    expect(chainNodes(ctx, a)).toBe(a);
  });

  it("connects the single node to context.destination", () => {
    const ctx = makeContext();
    const a = { connect: vi.fn() } as unknown as AudioNode;
    chainNodes(ctx, a);
    expect(a.connect).toHaveBeenCalledWith(ctx.destination);
  });

  it("returns the first node when multiple nodes are passed", () => {
    const ctx = makeContext();
    const a = { connect: vi.fn() } as unknown as AudioNode;
    const b = { connect: vi.fn() } as unknown as AudioNode;
    const c = { connect: vi.fn() } as unknown as AudioNode;
    expect(chainNodes(ctx, a, b, c)).toBe(a);
  });

  it("chains nodes sequentially: a→b→c→destination", () => {
    const ctx = makeContext();
    const a = { connect: vi.fn() } as unknown as AudioNode;
    const b = { connect: vi.fn() } as unknown as AudioNode;
    const c = { connect: vi.fn() } as unknown as AudioNode;
    chainNodes(ctx, a, b, c);
    expect(a.connect).toHaveBeenCalledWith(b);
    expect(b.connect).toHaveBeenCalledWith(c);
    expect(c.connect).toHaveBeenCalledWith(ctx.destination);
  });

  it("does not call connect on context.destination itself", () => {
    const ctx = makeContext();
    const a = { connect: vi.fn() } as unknown as AudioNode;
    chainNodes(ctx, a);
    expect((ctx.destination as unknown as { connect: ReturnType<typeof vi.fn> }).connect).not.toHaveBeenCalled();
  });
});

describe("scheduleNote", () => {
  it("creates exactly one oscillator", () => {
    const ctx = makeContext();
    scheduleNote(note(440), 0, { context: ctx });
    expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
  });

  it("creates exactly two gain nodes (envelope + master)", () => {
    const ctx = makeContext();
    scheduleNote(note(440), 0, { context: ctx });
    expect(ctx.createGain).toHaveBeenCalledTimes(2);
  });

  it("sets oscillator frequency to the note's frequency", () => {
    const ctx = makeContext();
    scheduleNote(note(880), 2, { context: ctx });
    const osc = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(880, 2);
  });

  it("defaults oscillator waveform to 'sine'", () => {
    const ctx = makeContext();
    scheduleNote(note(440), 0, { context: ctx });
    const osc = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(osc.type).toBe("sine");
  });

  it("applies the waveform option", () => {
    const ctx = makeContext();
    scheduleNote(note(440), 0, { context: ctx, waveform: "sawtooth" });
    const osc = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(osc.type).toBe("sawtooth");
  });

  it("starts the oscillator at startTime", () => {
    const ctx = makeContext();
    scheduleNote(note(440), 3, { context: ctx });
    const osc = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(osc.start).toHaveBeenCalledWith(3);
  });

  it("stops the oscillator at startTime + duration", () => {
    const ctx = makeContext();
    scheduleNote(note(440, DURATIONS.CROTCHET), 1, { context: ctx, bpm: BPM, timeSignature: TS });
    const osc = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(osc.stop).toHaveBeenCalledWith(1 + CROTCHET_S);
  });

  it("sets master gain to the gain option at startTime", () => {
    const ctx = makeContext();
    scheduleNote(note(440), 2, { context: ctx, gain: 0.7 });
    // masterGain is the second createGain() result
    const masterGain = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results[1].value;
    expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(0.7, 2);
  });

  it("defaults master gain to 0.3", () => {
    const ctx = makeContext();
    scheduleNote(note(440), 0, { context: ctx });
    const masterGain = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results[1].value;
    expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 0);
  });

  it("connects oscillator → gainNode → masterGain → destination", () => {
    const ctx = makeContext();
    scheduleNote(note(440), 0, { context: ctx });
    const osc = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results[0].value;
    const gainNode = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results[0].value;
    const masterGain = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results[1].value;
    expect(osc.connect).toHaveBeenCalledWith(gainNode);
    expect(gainNode.connect).toHaveBeenCalledWith(masterGain);
    expect(masterGain.connect).toHaveBeenCalledWith(ctx.destination);
  });

  it("routes to a custom destination when supplied", () => {
    const ctx = makeContext();
    const customDest = { connect: vi.fn() } as unknown as AudioNode;
    scheduleNote(note(440), 0, { context: ctx, destination: customDest });
    const masterGain = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results[1].value;
    expect(masterGain.connect).toHaveBeenCalledWith(customDest);
  });

  it("returns the oscillator node", () => {
    const ctx = makeContext();
    const result = scheduleNote(note(440), 0, { context: ctx });
    const osc = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(result).toBe(osc);
  });
});

describe("scheduleChord", () => {
  it("returns one oscillator per note", () => {
    const ctx = makeContext();
    const oscs = scheduleChord(chord([261, 329, 392]), 0, { context: ctx });
    expect(oscs).toHaveLength(3);
  });

  it("returns an empty array for a chord with no notes", () => {
    const ctx = makeContext();
    const empty: Chord = { notes: [], length: 0 };
    expect(scheduleChord(empty, 0, { context: ctx })).toEqual([]);
  });

  it("divides master gain equally across notes to prevent clipping", () => {
    const ctx = makeContext();
    scheduleChord(chord([261, 329, 392]), 0, { context: ctx, gain: 0.9 });
    // masterGain is every other createGain result (index 1, 3, 5…)
    const allGainNodes = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results;
    const masterGains = allGainNodes.filter((_, i) => i % 2 === 1).map((r) => r.value);
    for (const mg of masterGains) {
      expect(mg.gain.setValueAtTime).toHaveBeenCalledWith(
        expect.closeTo(0.3, 5), // 0.9 / 3
        expect.any(Number)
      );
    }
  });

  it("schedules all notes at the same startTime", () => {
    const ctx = makeContext();
    scheduleChord(chord([261, 329]), 5, { context: ctx });
    const oscs = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results.map((r) => r.value);
    for (const osc of oscs) {
      expect(osc.start).toHaveBeenCalledWith(5);
    }
  });
});

describe("scheduleChordAtTime", () => {
  it("returns one oscillator per frequency", () => {
    const ctx = makeContext();
    expect(scheduleChordAtTime([261, 329, 392], 0, 1, { context: ctx })).toHaveLength(3);
  });

  it("returns an empty array for an empty frequency list", () => {
    const ctx = makeContext();
    expect(scheduleChordAtTime([], 0, 1, { context: ctx })).toEqual([]);
  });

  it("sets each oscillator's frequency correctly", () => {
    const ctx = makeContext();
    scheduleChordAtTime([440, 550], 0, 1, { context: ctx });
    const oscs = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results.map((r) => r.value);
    expect(oscs[0].frequency.setValueAtTime).toHaveBeenCalledWith(440, 0);
    expect(oscs[1].frequency.setValueAtTime).toHaveBeenCalledWith(550, 0);
  });

  it("applies the waveform option to all oscillators", () => {
    const ctx = makeContext();
    scheduleChordAtTime([261, 329], 0, 1, { context: ctx, waveform: "triangle" });
    const oscs = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results.map((r) => r.value);
    for (const osc of oscs) {
      expect(osc.type).toBe("triangle");
    }
  });

  it("starts all oscillators at startTime", () => {
    const ctx = makeContext();
    scheduleChordAtTime([440, 550], 3, 1, { context: ctx });
    const oscs = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results.map((r) => r.value);
    for (const osc of oscs) {
      expect(osc.start).toHaveBeenCalledWith(3);
    }
  });

  it("stops all oscillators at startTime + durationSeconds", () => {
    const ctx = makeContext();
    scheduleChordAtTime([440], 2, 1.5, { context: ctx });
    const osc = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(osc.stop).toHaveBeenCalledWith(3.5);
  });

  it("routes each oscillator chain to context.destination by default", () => {
    const ctx = makeContext();
    scheduleChordAtTime([440], 0, 1, { context: ctx });
    const masterGain = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results[1].value;
    expect(masterGain.connect).toHaveBeenCalledWith(ctx.destination);
  });
});

describe("playScale", () => {
  it("returns 0 for an empty note array", () => {
    expect(playScale([], { context: makeContext() })).toBe(0);
  });

  it("schedules each note sequentially with no overlap", () => {
    const ctx = makeContext(0);
    playScale(
      [note(261, DURATIONS.CROTCHET), note(293, DURATIONS.CROTCHET)],
      { context: ctx, bpm: BPM, timeSignature: TS }
    );
    const oscs = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results.map((r) => r.value);
    expect(oscs[0].start).toHaveBeenCalledWith(0);
    expect(oscs[1].start).toHaveBeenCalledWith(CROTCHET_S);
  });

  it("returns the total elapsed duration", () => {
    const ctx = makeContext(0);
    const total = playScale(
      [note(261, DURATIONS.CROTCHET), note(293, DURATIONS.CROTCHET), note(329, DURATIONS.CROTCHET)],
      { context: ctx, bpm: BPM, timeSignature: TS }
    );
    expect(total).toBeCloseTo(CROTCHET_S * 3);
  });

  it("respects context.currentTime as the scheduling base", () => {
    const ctx = makeContext(10);
    playScale([note(440, DURATIONS.CROTCHET)], { context: ctx, bpm: BPM, timeSignature: TS });
    const osc = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(osc.start).toHaveBeenCalledWith(10);
  });

  it("handles mixed note durations — second note starts after the first finishes", () => {
    const ctx = makeContext(0);
    playScale(
      [note(261, DURATIONS.MINIM), note(293, DURATIONS.CROTCHET)],
      { context: ctx, bpm: BPM, timeSignature: TS }
    );
    const oscs = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results.map((r) => r.value);
    expect(oscs[0].start).toHaveBeenCalledWith(0);
    expect(oscs[1].start).toHaveBeenCalledWith(MINIM_S);
  });
});

describe("playChord", () => {
  it("schedules all notes simultaneously at context.currentTime", () => {
    const ctx = makeContext(2);
    playChord(chord([261, 329, 392]), { context: ctx });
    const oscs = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results.map((r) => r.value);
    for (const osc of oscs) {
      expect(osc.start).toHaveBeenCalledWith(2);
    }
  });

  it("returns the duration of the first note", () => {
    const ctx = makeContext(0);
    const duration = playChord(
      chord([261, 329], DURATIONS.MINIM),
      { context: ctx, bpm: BPM, timeSignature: TS }
    );
    expect(duration).toBeCloseTo(MINIM_S);
  });

  it("creates one oscillator per note in the chord", () => {
    const ctx = makeContext(0);
    playChord(chord([261, 329, 392, 523]), { context: ctx });
    expect(ctx.createOscillator).toHaveBeenCalledTimes(4);
  });
});

// ---------------------------------------------------------------------------
// playChordProgression
// ---------------------------------------------------------------------------

describe("playChordProgression", () => {
  it("returns 0 for an empty chord list", () => {
    expect(playChordProgression([], { context: makeContext() })).toBe(0);
  });

  it("schedules the second chord to start after the first finishes", () => {
    const ctx = makeContext(0);
    playChordProgression(
      [chord([261, 329, 392], DURATIONS.CROTCHET), chord([293, 369, 440], DURATIONS.CROTCHET)],
      { context: ctx, bpm: BPM, timeSignature: TS }
    );
    const oscs = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results.map((r) => r.value);
    // First chord: all 3 notes at t=0
    expect(oscs[0].start).toHaveBeenCalledWith(0);
    expect(oscs[1].start).toHaveBeenCalledWith(0);
    expect(oscs[2].start).toHaveBeenCalledWith(0);
    // Second chord: all 3 notes at t=CROTCHET_S
    expect(oscs[3].start).toHaveBeenCalledWith(CROTCHET_S);
    expect(oscs[4].start).toHaveBeenCalledWith(CROTCHET_S);
    expect(oscs[5].start).toHaveBeenCalledWith(CROTCHET_S);
  });

  it("returns the sum of all chord durations", () => {
    const ctx = makeContext(0);
    const total = playChordProgression(
      [
        chord([261], DURATIONS.CROTCHET),
        chord([329], DURATIONS.MINIM),
        chord([392], DURATIONS.CROTCHET),
      ],
      { context: ctx, bpm: BPM, timeSignature: TS }
    );
    expect(total).toBeCloseTo(CROTCHET_S + MINIM_S + CROTCHET_S);
  });

  it("returns elapsed time, not absolute AudioContext time", () => {
    const ctx = makeContext(5);
    const total = playChordProgression(
      [chord([440], DURATIONS.CROTCHET)],
      { context: ctx, bpm: BPM, timeSignature: TS }
    );
    expect(total).toBeCloseTo(CROTCHET_S);
  });

  it("offsets all scheduling by context.currentTime", () => {
    const ctx = makeContext(10);
    playChordProgression(
      [chord([261], DURATIONS.CROTCHET), chord([329], DURATIONS.CROTCHET)],
      { context: ctx, bpm: BPM, timeSignature: TS }
    );
    const oscs = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results.map((r) => r.value);
    expect(oscs[0].start).toHaveBeenCalledWith(10);
    expect(oscs[1].start).toHaveBeenCalledWith(10 + CROTCHET_S);
  });
});
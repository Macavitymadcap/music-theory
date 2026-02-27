import { describe, it, expect, vi } from "vitest";
import { durationToSeconds, applyEnvelope, chainNodes } from "./web-audio";

describe("durationToSeconds", () => {
  it("crotchet at 120bpm in 4/4 is 0.5 seconds", () => {
    expect(durationToSeconds(0.25, 120, 4)).toBeCloseTo(0.5);
  });

  it("semibreve at 120bpm in 4/4 is 2 seconds", () => {
    expect(durationToSeconds(1, 120, 4)).toBeCloseTo(2);
  });

  it("minim at 60bpm in 4/4 is 2 seconds", () => {
    expect(durationToSeconds(0.5, 60, 4)).toBeCloseTo(2);
  });

  it("quaver at 120bpm in 4/4 is 0.25 seconds", () => {
    expect(durationToSeconds(0.125, 120, 4)).toBeCloseTo(0.25);
  });

  it("scales correctly with time signature — crotchet at 120bpm in 3/4", () => {
    // 3/4: beatsForNote = 0.25 * 3 = 0.75 beats; at 120bpm = 0.375s
    expect(durationToSeconds(0.25, 120, 3)).toBeCloseTo(0.375);
  });

  it("higher BPM produces shorter durations", () => {
    const slow = durationToSeconds(0.25, 60, 4);
    const fast = durationToSeconds(0.25, 240, 4);
    expect(fast).toBeLessThan(slow);
  });
});

// ── Minimal AudioNode/GainNode mocks ──

function makeGainNode() {
  return {
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
}

function makeAudioNode() {
  return { connect: vi.fn() };
}

function makeAudioContext(destination = makeAudioNode()) {
  return { destination };
}

describe("applyEnvelope", () => {
  it("sets initial gain to 0 at startTime", () => {
    const gain = makeGainNode();
    applyEnvelope(gain as unknown as GainNode, 1, 2);
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0, 1);
  });

  it("ramps to 1.0 at end of attack phase (25% of duration)", () => {
    const gain = makeGainNode();
    applyEnvelope(gain as unknown as GainNode, 0, 2);
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, 0.5);
  });

  it("decays to 0.2 at end of decay phase (50% of duration)", () => {
    const gain = makeGainNode();
    applyEnvelope(gain as unknown as GainNode, 0, 2);
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.2, 1);
  });

  it("ramps to 0 at end of release phase (100% of duration)", () => {
    const gain = makeGainNode();
    applyEnvelope(gain as unknown as GainNode, 0, 2);
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 2);
  });

  it("makes exactly 3 ramp calls", () => {
    const gain = makeGainNode();
    applyEnvelope(gain as unknown as GainNode, 0, 1);
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledTimes(3);
  });
});

describe("chainNodes", () => {
  it("returns the first node", () => {
    const ctx = makeAudioContext();
    const a = makeAudioNode();
    const b = makeAudioNode();
    const result = chainNodes(ctx as unknown as AudioContext, a as unknown as AudioNode, b as unknown as AudioNode);
    expect(result).toBe(a);
  });

  it("connects each node to the next", () => {
    const ctx = makeAudioContext();
    const a = makeAudioNode();
    const b = makeAudioNode();
    chainNodes(ctx as unknown as AudioContext, a as unknown as AudioNode, b as unknown as AudioNode);
    expect(a.connect).toHaveBeenCalledWith(b);
  });

  it("connects the last node to context.destination", () => {
    const ctx = makeAudioContext();
    const a = makeAudioNode();
    const b = makeAudioNode();
    chainNodes(ctx as unknown as AudioContext, a as unknown as AudioNode, b as unknown as AudioNode);
    expect(b.connect).toHaveBeenCalledWith(ctx.destination);
  });

  it("with a single node, connects it directly to context.destination", () => {
    const ctx = makeAudioContext();
    const a = makeAudioNode();
    chainNodes(ctx as unknown as AudioContext, a as unknown as AudioNode);
    expect(a.connect).toHaveBeenCalledWith(ctx.destination);
  });

  it("returns context.destination when called with no nodes", () => {
    const ctx = makeAudioContext();
    const result = chainNodes(ctx as unknown as AudioContext);
    expect(result).toBe(ctx.destination);
  });
});
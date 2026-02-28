import { describe, it, expect, beforeEach } from "vitest";
import {
  frequencyToVexKey,
  frequenciesToStaveNote,
  renderNotation,
  type NotationBar,
} from "./notation";
import { StaveNote } from "vexflow";

describe("frequencyToVexKey", () => {
  it("maps C4 (~261.63 Hz) to key c/4", () => {
    const result = frequencyToVexKey(261.63);
    expect(result.key).toBe("c/4");
    expect(result.accidental).toBeUndefined();
  });

  it("maps A4 (440 Hz) to key a/4", () => {
    const result = frequencyToVexKey(440);
    expect(result.key).toBe("a/4");
    expect(result.accidental).toBeUndefined();
  });

  it("maps C#4 / Db4 to a sharp key", () => {
    // MIDI 61 = C#4/Db4
    const freq = 440 * Math.pow(2, (61 - 69) / 12);
    const result = frequencyToVexKey(freq);
    expect(result.key).toMatch(/c#\/4/);
    expect(result.accidental).toBe("#");
  });

  it("maps G4 (~392 Hz) to key g/4", () => {
    const result = frequencyToVexKey(392);
    expect(result.key).toBe("g/4");
  });

  it("maps notes one octave higher correctly", () => {
    const c5 = frequencyToVexKey(523.25);
    expect(c5.key).toBe("c/5");
  });

  it("maps E4 to e/4 with no accidental", () => {
    const e4 = 440 * Math.pow(2, (64 - 69) / 12);
    const result = frequencyToVexKey(e4);
    expect(result.key).toBe("e/4");
    expect(result.accidental).toBeUndefined();
  });

  it("returns a default duration of 'q'", () => {
    const result = frequencyToVexKey(440);
    expect(result.duration).toBe("q");
  });
});

describe("frequenciesToStaveNote", () => {
  it("returns a StaveNote instance", () => {
    const note = frequenciesToStaveNote([440]);
    expect(note).toBeInstanceOf(StaveNote);
  });

  it("creates a single-note stave note from one frequency", () => {
    const note = frequenciesToStaveNote([440]);
    // VexFlow StaveNote exposes keys
    expect(note.getKeys()).toHaveLength(1);
    expect(note.getKeys()[0]).toBe("a/4");
  });

  it("creates a chord stave note from multiple frequencies", () => {
    const note = frequenciesToStaveNote([261.63, 329.63, 392]);
    expect(note.getKeys()).toHaveLength(3);
  });

  it("uses the supplied duration string", () => {
    const note = frequenciesToStaveNote([440], "h");
    expect(note.getDuration()).toBe("h");
  });

  it("adds accidental modifiers for sharp notes", () => {
    const c_sharp = 440 * Math.pow(2, (61 - 69) / 12);
    const note = frequenciesToStaveNote([c_sharp]);
    // The note should have one modifier (the accidental)
    expect(note.getModifiers().length).toBeGreaterThanOrEqual(1);
  });

  it("does not add accidental modifiers for natural notes", () => {
    const note = frequenciesToStaveNote([440]); // A4 — natural
    expect(note.getModifiers()).toHaveLength(0);
  });
});

describe("renderNotation", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.style.width = "600px";
    Object.defineProperty(container, "clientWidth", { value: 600, configurable: true });
    document.body.appendChild(container);
  });

  const singleBar: NotationBar[] = [
    { chords: [[261.63, 329.63, 392]], timeSignature: "4/4" },
  ];

  it("renders an SVG element into the container", () => {
    renderNotation(container, singleBar, { width: 600 });
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("returns a cleanup function", () => {
    const cleanup = renderNotation(container, singleBar, { width: 600 });
    expect(cleanup).toBeTypeOf("function");
  });

  it("cleanup removes all children from the container", () => {
    const cleanup = renderNotation(container, singleBar, { width: 600 });
    cleanup();
    expect(container.childNodes.length).toBe(0);
  });

  it("does nothing and returns a no-op when bars array is empty", () => {
    const cleanup = renderNotation(container, [], { width: 600 });
    expect(container.childNodes.length).toBe(0);
    expect(() => cleanup()).not.toThrow();
  });

  it("clears previous content before re-rendering", () => {
    renderNotation(container, singleBar, { width: 600 });
    const firstSvg = container.querySelector("svg");
    renderNotation(container, singleBar, { width: 600 });
    const secondSvg = container.querySelector("svg");
    // Should be a fresh SVG, not the same element
    expect(secondSvg).not.toBe(firstSvg);
    // Should only have one SVG
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("handles multiple bars without throwing", () => {
    const multiBars: NotationBar[] = [
      { chords: [[261.63]], timeSignature: "4/4" },
      { chords: [[293.66]], timeSignature: "4/4" },
      { chords: [[329.63]], timeSignature: "4/4" },
      { chords: [[349.23]], timeSignature: "4/4" },
    ];
    expect(() => renderNotation(container, multiBars, { width: 600 })).not.toThrow();
  });

  it("handles a multi-bar step (bars > 1) without throwing", () => {
    const bars: NotationBar[] = [
      { chords: [[261.63]], timeSignature: "4/4", bars: 4 },
    ];
    expect(() => renderNotation(container, bars, { width: 600 })).not.toThrow();
  });

  it("handles scale notation (noteCount > 4) without throwing", () => {
    const scaleFreqs = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
    const bars: NotationBar[] = [
      {
        chords: scaleFreqs.map((f) => [f]),
        timeSignature: "4/4",
        noteCount: scaleFreqs.length,
        forceDuration: "8",
      },
    ];
    expect(() => renderNotation(container, bars, { width: 600 })).not.toThrow();
  });

  it("uses fallback width of 600 when container.clientWidth is 0", () => {
    Object.defineProperty(container, "clientWidth", { value: 0, configurable: true });
    expect(() => renderNotation(container, singleBar)).not.toThrow();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
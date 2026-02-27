import { render } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import PianoKeyboard from "./PianoKeyboard";
import { createSignal } from "solid-js";

// Helper to avoid repetition
const defaultFreqs = [261.63, 329.63, 392]; // C4, E4, G4

describe("PianoKeyboard", () => {
  it("renders without error with no highlighted frequencies", () => {
    const { container } = render(() => (
      <PianoKeyboard highlightedFrequencies={[]} rangeFrequencies={defaultFreqs} />
    ));
    expect(container.querySelector(".piano-keyboard")).toBeInTheDocument();
  });

  it("renders white and black keys", () => {
    const { container } = render(() => (
      <PianoKeyboard highlightedFrequencies={[]} rangeFrequencies={defaultFreqs} />
    ));
    expect(container.querySelectorAll(".piano-key--white").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".piano-key--black").length).toBeGreaterThan(0);
  });

  it("applies active class to keys matching highlighted frequencies", () => {
    const { container } = render(() => (
      <PianoKeyboard highlightedFrequencies={[440]} rangeFrequencies={[440]} />
    ));
    const activeKeys = container.querySelectorAll(".piano-key--active");
    expect(activeKeys.length).toBe(1);
    expect(activeKeys[0]).toHaveAttribute("title", "A4");
  });

  it("applies active class to multiple highlighted keys", () => {
    const { container } = render(() => (
      <PianoKeyboard
        highlightedFrequencies={[261.63, 329.63, 392]}
        rangeFrequencies={[261.63, 329.63, 392]}
      />
    ));
    expect(container.querySelectorAll(".piano-key--active").length).toBe(3);
  });

  it("does not apply active class to non-highlighted keys", () => {
    const { container } = render(() => (
      <PianoKeyboard highlightedFrequencies={[440]} rangeFrequencies={[440]} />
    ));
    const inactive = container.querySelectorAll(".piano-key:not(.piano-key--active)");
    expect(inactive.length).toBeGreaterThan(0);
  });

  it("renders the keyboard label", () => {
    const { getByText } = render(() => (
      <PianoKeyboard highlightedFrequencies={[]} rangeFrequencies={defaultFreqs} />
    ));
    expect(getByText("keyboard")).toBeInTheDocument();
  });

  it("range does not change when only highlightedFrequencies changes", () => {
    const [highlighted, setHighlighted] = createSignal([261.63]);
    const { container } = render(() => (
      <PianoKeyboard
        highlightedFrequencies={highlighted()}
        rangeFrequencies={defaultFreqs}
      />
    ));
    const keyCountBefore = container.querySelectorAll(".piano-key--white").length;
    setHighlighted([392]);
    const keyCountAfter = container.querySelectorAll(".piano-key--white").length;
    expect(keyCountAfter).toBe(keyCountBefore);
  });
});
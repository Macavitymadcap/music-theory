import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, it, expect, afterEach } from "vitest";
import CustomProgressionBuilder from "./CustomProgressionBuilder";
import type { ProgressionStep } from "../../../lib/progressions";

afterEach(cleanup);

describe("CustomProgressionBuilder", () => {
  it("renders degree, chord and bars controls", () => {
    const { getAllByRole } = render(() => (
      <CustomProgressionBuilder steps={[]} onStepsChange={() => {}} />
    ));
    expect(getAllByRole("combobox").length).toBeGreaterThanOrEqual(2);
  });

  it("adds a step when add button is clicked", () => {
    const [steps, setSteps] = createSignal<ProgressionStep[]>([]);
    const { getByText } = render(() => (
      <CustomProgressionBuilder steps={steps()} onStepsChange={setSteps} />
    ));
    fireEvent.click(getByText("+ add step"));
    expect(steps()).toHaveLength(1);
  });

  it("removes a step when remove is clicked", () => {
    const [steps, setSteps] = createSignal<ProgressionStep[]>([
      { label: "I", semitones: 0, chordType: "majorTriad", bars: 1, hitsPerBar: 1 },
    ]);
    const { getByLabelText } = render(() => (
      <CustomProgressionBuilder steps={steps()} onStepsChange={setSteps} />
    ));
    fireEvent.click(getByLabelText("remove step"));
    expect(steps()).toHaveLength(0);
  });

  it("renders step badges for existing steps", () => {
    const steps: ProgressionStep[] = [
      { label: "I", semitones: 0, chordType: "majorTriad", bars: 1, hitsPerBar: 1 },
      { label: "IV", semitones: 5, chordType: "majorTriad", bars: 1, hitsPerBar: 1 },
    ];
    const { container } = render(() => (
      <CustomProgressionBuilder steps={steps} onStepsChange={() => {}} />
    ));
    const badges = container.querySelectorAll(".step-badge__chord");
    const chordTexts = Array.from(badges).map((b) => b.textContent);
    expect(chordTexts).toEqual(["Major", "Major"]);
  });
});
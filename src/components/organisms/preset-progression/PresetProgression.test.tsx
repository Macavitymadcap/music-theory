import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import { describe, it, expect, afterEach, vi } from "vitest";
import PresetProgression from "./PresetProgression";
import { PROGRESSION_PRESETS } from "../../../lib/progressions";

afterEach(cleanup);

describe("PresetProgression", () => {
  const first = PROGRESSION_PRESETS[0];

  it("renders the preset select", () => {
    const { getByRole } = render(() => (
      <PresetProgression value={first.name} onChange={() => {}} />
    ));
    expect(getByRole("combobox")).toBeInTheDocument();
  });

  it("renders step badges for the selected preset", () => {
    const { getAllByText } = render(() => (
      <PresetProgression value={first.name} onChange={() => {}} />
    ));
    // Each step should have a badge — check we have at least one
    expect(getAllByText(/b$/).length).toBeGreaterThanOrEqual(1);
  });

  it("calls onChange when a different preset is selected", () => {
    const handler = vi.fn();
    const second = PROGRESSION_PRESETS[1];
    const { getByRole } = render(() => (
      <PresetProgression value={first.name} onChange={handler} />
    ));
    fireEvent.change(getByRole("combobox"), { target: { value: second.name } });
    expect(handler).toHaveBeenCalledWith(second.name);
  });
});
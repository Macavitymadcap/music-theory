import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Progression from "./Progression";
import { stubAudioContext, TestProviders } from "../../../context/test-utils";
import { PROGRESSION_PRESETS } from "../../../lib/progressions";

vi.mock("../../../lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../lib")>();
  return { ...actual, scheduleChordAtTime: vi.fn(() => []) };
});

beforeEach(() => {
  vi.useFakeTimers();
  stubAudioContext();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  cleanup();
});

const noop = () => {};

describe("Progression", () => {
  // ── Rendering ──

  it("renders the play button", () => {
    const { getByText } = render(() => (
      <TestProviders><Progression onSelectionChange={noop} onNotationChange={noop} /></TestProviders>
    ));
    expect(getByText("▶ play")).toBeInTheDocument();
  });

  it("renders preset and custom sub-mode options", () => {
    const { getByLabelText } = render(() => (
      <TestProviders><Progression onSelectionChange={noop} onNotationChange={noop} /></TestProviders>
    ));
    // Use the radio's label+value for specificity
    expect(getByLabelText("preset", { selector: 'input[type="radio"]' })).toBeInTheDocument();
    expect(getByLabelText("custom", { selector: 'input[type="radio"]' })).toBeInTheDocument();
  });

  it("shows the preset selector in preset mode", () => {
    const { getByRole } = render(() => (
      <TestProviders><Progression onSelectionChange={noop} onNotationChange={noop} /></TestProviders>
    ));
    // The preset select should be present
    const selects = getByRole("combobox", { name: /preset/i });
    expect(selects).toBeInTheDocument();
  });

  it("play button is disabled in custom mode when there are no steps", () => {
    const { getByLabelText, getByText } = render(() => (
      <TestProviders><Progression onSelectionChange={noop} onNotationChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByLabelText("custom"));
    expect(getByText("▶ play")).toBeDisabled();
  });

  // ── Playback ──

  it("toggles to stop button when playing a preset", () => {
    const { getByText } = render(() => (
      <TestProviders><Progression onSelectionChange={noop} onNotationChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    expect(getByText("■ stop")).toBeInTheDocument();
  });

  it("stops when the stop button is clicked", () => {
    const { getByText } = render(() => (
      <TestProviders><Progression onSelectionChange={noop} onNotationChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    fireEvent.click(getByText("■ stop"));
    expect(getByText("▶ play")).toBeInTheDocument();
  });

  it("returns to play after all chords have played", () => {
    const { getByText } = render(() => (
      <TestProviders><Progression onSelectionChange={noop} onNotationChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    // Advance through all timers to exhaust the sequence
    vi.runAllTimers();
    expect(getByText("▶ play")).toBeInTheDocument();
  });

  // ── Sub-mode switching ──

  it("switches to custom builder mode", () => {
    const { getByLabelText, getByText } = render(() => (
      <TestProviders><Progression onSelectionChange={noop} onNotationChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByLabelText("custom"));
    expect(getByText("+ add step")).toBeInTheDocument();
  });

  it("switches back to preset mode", () => {
    const { getByLabelText, getByRole } = render(() => (
      <TestProviders><Progression onSelectionChange={noop} onNotationChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByLabelText("custom"));
    fireEvent.click(getByLabelText("preset"));
    expect(getByRole("combobox", { name: /preset/i })).toBeInTheDocument();
  });

  it("stops playback when switching sub-mode", () => {
    const { getByText, getByLabelText } = render(() => (
      <TestProviders><Progression onSelectionChange={noop} onNotationChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    expect(getByText("■ stop")).toBeInTheDocument();
    fireEvent.click(getByLabelText("custom"));
    expect(getByText("▶ play")).toBeInTheDocument();
  });

  // ── onSelectionChange ──

  it("calls onSelectionChange on mount with initial preset frequencies", () => {
    const handler = vi.fn();
    render(() => (
      <TestProviders>
        <Progression onSelectionChange={handler} onNotationChange={noop} />
      </TestProviders>
    ));
    expect(handler).toHaveBeenCalled();
    // Initial preset has steps — selection should be non-empty
    expect(handler.mock.calls[0][0].length).toBeGreaterThan(0);
  });

  it("calls onSelectionChange with empty array in custom mode with no steps", () => {
    const handler = vi.fn();
    const { getByLabelText } = render(() => (
      <TestProviders>
        <Progression onSelectionChange={handler} onNotationChange={noop} />
      </TestProviders>
    ));
    fireEvent.click(getByLabelText("custom"));
    const lastCall = handler.mock.calls.at(-1)!;
    expect(lastCall[0]).toEqual([]);
  });

  // ── onNotationChange ──

  it("calls onNotationChange on mount", () => {
    const handler = vi.fn();
    render(() => (
      <TestProviders>
        <Progression onSelectionChange={noop} onNotationChange={handler} />
      </TestProviders>
    ));
    expect(handler).toHaveBeenCalled();
    const bars = handler.mock.calls[0][0];
    expect(Array.isArray(bars)).toBe(true);
    expect(bars.length).toBeGreaterThan(0);
  });

  it("calls onNotationChange with empty array in custom mode with no steps", () => {
    const handler = vi.fn();
    const { getByLabelText } = render(() => (
      <TestProviders>
        <Progression onSelectionChange={noop} onNotationChange={handler} />
      </TestProviders>
    ));
    fireEvent.click(getByLabelText("custom"));
    const lastCall = handler.mock.calls.at(-1)!;
    expect(lastCall[0]).toEqual([]);
  });

  // ── Preset selector ──

  it("updates notation bars when a different preset is selected", () => {
    const handler = vi.fn();
    const { getByRole } = render(() => (
      <TestProviders>
        <Progression onSelectionChange={noop} onNotationChange={handler} />
      </TestProviders>
    ));
    handler.mockClear();
    const second = PROGRESSION_PRESETS[1];
    fireEvent.change(getByRole("combobox", { name: /preset/i }), {
      target: { value: second.name },
    });
    expect(handler).toHaveBeenCalled();
  });

  // ── Custom builder integration ──

  it("enables play button after adding a custom step", () => {
    const { getByLabelText, getByText } = render(() => (
      <TestProviders><Progression onSelectionChange={noop} onNotationChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByLabelText("custom"));
    expect(getByText("▶ play")).toBeDisabled();
    fireEvent.click(getByText("+ add step"));
    expect(getByText("▶ play")).not.toBeDisabled();
  });

  it("plays a custom progression after adding a step", () => {
    const { getByLabelText, getByText } = render(() => (
      <TestProviders><Progression onSelectionChange={noop} onNotationChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByLabelText("custom"));
    fireEvent.click(getByText("+ add step"));
    fireEvent.click(getByText("▶ play"));
    expect(getByText("■ stop")).toBeInTheDocument();
  });
});
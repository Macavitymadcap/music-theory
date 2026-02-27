import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Chord from "./Chord";
import { stubAudioContext, TestProviders } from "../../../context/test-utils";

vi.mock("../../../lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../lib")>();
  return { ...actual, playChord: vi.fn() };
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

describe("Chord", () => {
  it("renders play button", () => {
    const { getByText } = render(() => (
      <TestProviders><Chord onSelectionChange={noop} /></TestProviders>
    ));
    expect(getByText("▶ play")).toBeInTheDocument();
  });

  it("renders chord select, pitch, waveform, duration and bpm controls", () => {
    const { getAllByRole } = render(() => (
      <TestProviders><Chord onSelectionChange={noop} /></TestProviders>
    ));
    expect(getAllByRole("combobox").length).toBeGreaterThanOrEqual(4);
  });

  it("toggles to stop button when playing", () => {
    const { getByText } = render(() => (
      <TestProviders><Chord onSelectionChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    expect(getByText("■ stop")).toBeInTheDocument();
  });

  it("stops when stop is clicked", () => {
    const { getByText } = render(() => (
      <TestProviders><Chord onSelectionChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    fireEvent.click(getByText("■ stop"));
    expect(getByText("▶ play")).toBeInTheDocument();
  });

  it("returns to play after playback ends", () => {
    const { getByText } = render(() => (
      <TestProviders><Chord onSelectionChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    vi.runAllTimers();
    expect(getByText("▶ play")).toBeInTheDocument();
  });

  it("calls onSelectionChange on mount with initial chord frequencies", () => {
    const handler = vi.fn();
    render(() => (
      <TestProviders><Chord onSelectionChange={handler} /></TestProviders>
    ));
    expect(handler).toHaveBeenCalled();
    // Initial selection is C4 major triad — 3 notes
    expect(handler.mock.calls[0][0]).toHaveLength(3);
  });
});
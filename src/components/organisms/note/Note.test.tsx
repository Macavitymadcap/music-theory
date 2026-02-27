import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Note from "./Note";
import { stubAudioContext, TestProviders } from "../../../context/test-utils";

vi.mock("../../../lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../lib")>();
  return { ...actual, scheduleNote: vi.fn() };
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

describe("Note", () => {
  it("renders play button", () => {
    const { getByText } = render(() => (
      <TestProviders><Note onSelectionChange={noop} /></TestProviders>
    ));
    expect(getByText("▶ play")).toBeInTheDocument();
  });

  it("renders pitch, waveform, duration and bpm controls", () => {
    const { getAllByRole } = render(() => (
      <TestProviders><Note onSelectionChange={noop} /></TestProviders>
    ));
    const selects = getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(3);
  });

  it("toggles to stop button when playing", () => {
    const { getByText } = render(() => (
      <TestProviders><Note onSelectionChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    expect(getByText("■ stop")).toBeInTheDocument();
  });

  it("returns to play button after playback ends", () => {
    const { getByText } = render(() => (
      <TestProviders><Note onSelectionChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    vi.runAllTimers();
    expect(getByText("▶ play")).toBeInTheDocument();
  });

  it("stops playback when stop button is clicked", () => {
    const { getByText } = render(() => (
      <TestProviders><Note onSelectionChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    fireEvent.click(getByText("■ stop"));
    expect(getByText("▶ play")).toBeInTheDocument();
  });

  it("calls onSelectionChange when pitch changes", () => {
    const handler = vi.fn();
    const { getAllByRole } = render(() => (
      <TestProviders><Note onSelectionChange={handler} /></TestProviders>
    ));
    // Called on mount via createEffect
    expect(handler).toHaveBeenCalled();
    // Change pitch select (first combobox)
    fireEvent.change(getAllByRole("combobox")[0], { target: { value: "a4" } });
    expect(handler).toHaveBeenCalledWith([440]);
  });
});
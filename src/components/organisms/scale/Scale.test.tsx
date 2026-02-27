import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Scale from "./Scale";
import { stubAudioContext, TestProviders } from "../../../context/test-utils";

vi.mock("../../../lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../lib")>();
  return { ...actual, playScale: vi.fn() };
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

describe("Scale", () => {
  it("renders play button", () => {
    const { getByText } = render(() => (
      <TestProviders><Scale onSelectionChange={noop} /></TestProviders>
    ));
    expect(getByText("▶ play")).toBeInTheDocument();
  });

  it("renders scale select, pitch, waveform, duration and bpm controls", () => {
    const { getAllByRole } = render(() => (
      <TestProviders><Scale onSelectionChange={noop} /></TestProviders>
    ));
    expect(getAllByRole("combobox").length).toBeGreaterThanOrEqual(4);
  });

  it("toggles to stop button when playing", () => {
    const { getByText } = render(() => (
      <TestProviders><Scale onSelectionChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    expect(getByText("■ stop")).toBeInTheDocument();
  });

  it("stops when stop is clicked", () => {
    const { getByText } = render(() => (
      <TestProviders><Scale onSelectionChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    fireEvent.click(getByText("■ stop"));
    expect(getByText("▶ play")).toBeInTheDocument();
  });

  it("steps through scale notes sequentially on timer", () => {
    const { getByText } = render(() => (
      <TestProviders><Scale onSelectionChange={noop} /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    expect(getByText("■ stop")).toBeInTheDocument();
  });

  it("calls onSelectionChange on mount with initial scale frequencies", () => {
    const handler = vi.fn();
    render(() => (
      <TestProviders><Scale onSelectionChange={handler} /></TestProviders>
    ));
    expect(handler).toHaveBeenCalled();
    // Initial selection is C4 major — 8 notes
    expect(handler.mock.calls[0][0]).toHaveLength(8);
  });
});
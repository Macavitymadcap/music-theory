import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ModeShell from "./ModeShell";
import { stubAudioContext, TestProviders } from "../../../context/test-utils";

// Mock heavy lib functions to avoid real AudioContext scheduling
vi.mock("../../../lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../lib")>();
  return {
    ...actual,
    scheduleNote: vi.fn(),
    playScale: vi.fn(),
    playChord: vi.fn(),
    scheduleChordAtTime: vi.fn(() => []),
  };
});

// VexFlow renders into a div — mock renderNotation to prevent layout errors
vi.mock("../../../lib/notation", () => ({
  renderNotation: vi.fn(() => () => {}),
}));

beforeEach(() => {
  vi.useFakeTimers();
  stubAudioContext();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  cleanup();
});

describe("ModeShell", () => {
  // ── Rendering ──

  it("renders all four mode radio options", () => {
    const { getByLabelText } = render(() => (
      <TestProviders><ModeShell /></TestProviders>
    ));
    expect(getByLabelText("note")).toBeInTheDocument();
    expect(getByLabelText("scale")).toBeInTheDocument();
    expect(getByLabelText("chord")).toBeInTheDocument();
    expect(getByLabelText("progression")).toBeInTheDocument();
  });

  it("renders Note panel by default", () => {
    const { getByText } = render(() => (
      <TestProviders><ModeShell /></TestProviders>
    ));
    // Note panel renders a play button
    expect(getByText("▶ play")).toBeInTheDocument();
  });

  it("renders the piano keyboard", () => {
    const { container } = render(() => (
      <TestProviders><ModeShell /></TestProviders>
    ));
    expect(container.querySelector(".piano-keyboard")).toBeInTheDocument();
  });

  it("renders the notation container", () => {
    const { container } = render(() => (
      <TestProviders><ModeShell /></TestProviders>
    ));
    expect(container.querySelector(".notation")).toBeInTheDocument();
  });

  // ── Mode switching ──

  it("switches to Scale panel when scale is selected", () => {
    const { getByLabelText, container } = render(() => (
      <TestProviders><ModeShell /></TestProviders>
    ));
    fireEvent.click(getByLabelText("scale"));
    expect(container.querySelector(".scale-panel")).toBeInTheDocument();
  });

  it("switches to Chord panel when chord is selected", () => {
    const { getByLabelText, container } = render(() => (
      <TestProviders><ModeShell /></TestProviders>
    ));
    fireEvent.click(getByLabelText("chord"));
    expect(container.querySelector(".chord-panel")).toBeInTheDocument();
  });

  it("switches to Progression panel when progression is selected", () => {
    const { getByLabelText, container } = render(() => (
      <TestProviders><ModeShell /></TestProviders>
    ));
    fireEvent.click(getByLabelText("progression"));
    expect(container.querySelector(".progression")).toBeInTheDocument();
  });

  it("removes the previous panel when switching modes", () => {
    const { getByLabelText, container } = render(() => (
      <TestProviders><ModeShell /></TestProviders>
    ));
    expect(container.querySelector(".note-panel")).toBeInTheDocument();
    fireEvent.click(getByLabelText("scale"));
    expect(container.querySelector(".note-panel")).not.toBeInTheDocument();
  });

  it("can cycle through all four modes without error", () => {
    const { getByLabelText } = render(() => (
      <TestProviders><ModeShell /></TestProviders>
    ));
    expect(() => {
      fireEvent.click(getByLabelText("scale"));
      fireEvent.click(getByLabelText("chord"));
      fireEvent.click(getByLabelText("progression"));
      fireEvent.click(getByLabelText("note"));
    }).not.toThrow();
  });

  // ── Playback interaction ──

  it("note mode: play button starts playback", () => {
    const { getByText } = render(() => (
      <TestProviders><ModeShell /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    expect(getByText("■ stop")).toBeInTheDocument();
  });

  it("switching modes while playing stops playback", () => {
    const { getByText, getByLabelText } = render(() => (
      <TestProviders><ModeShell /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    expect(getByText("■ stop")).toBeInTheDocument();
    fireEvent.click(getByLabelText("scale"));
    // After switching, the new panel should show ▶ play (not ■ stop)
    expect(getByText("▶ play")).toBeInTheDocument();
  });

  // ── Piano keyboard integration ──

  it("piano keyboard renders white keys", () => {
    const { container } = render(() => (
      <TestProviders><ModeShell /></TestProviders>
    ));
    expect(container.querySelectorAll(".piano-key--white").length).toBeGreaterThan(0);
  });

  it("piano keyboard renders black keys", () => {
    const { container } = render(() => (
      <TestProviders><ModeShell /></TestProviders>
    ));
    expect(container.querySelectorAll(".piano-key--black").length).toBeGreaterThan(0);
  });

  it("piano keyboard shows active keys while playing note mode", () => {
    const { getByText, container } = render(() => (
      <TestProviders><ModeShell /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    expect(container.querySelectorAll(".piano-key--active").length).toBeGreaterThan(0);
  });

  it("piano keyboard clears active keys after stop", () => {
    const { getByText, container } = render(() => (
      <TestProviders><ModeShell /></TestProviders>
    ));
    fireEvent.click(getByText("▶ play"));
    fireEvent.click(getByText("■ stop"));
    expect(container.querySelectorAll(".piano-key--active").length).toBe(0);
  });
});
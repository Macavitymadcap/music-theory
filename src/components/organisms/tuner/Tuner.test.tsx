/**
 * Tuner.test.tsx — Component tests for the instrument tuner organism.
 *
 * Strategy
 * --------
 * `startTuner` is mocked at module level via `vi.mock`. The mock captures the
 * `onResult` callback so tests can drive it with `simulateResult` /
 * `simulateSilence` to assert on rendered output — no real browser APIs needed.
 *
 * The mock path ("../../../lib/tuner") must match the path used inside
 * Tuner.tsx itself. vi.mock hoists to the top of the file so `mockStartTuner`
 * is populated before any test runs.
 *
 * Async notes
 * -----------
 * `handleStart` is async (it awaits `startTuner`). After `fireEvent.click` we
 * use `findBy*` queries (which poll via a MutationObserver) rather than
 * `getBy*` after a bare `await Promise.resolve()`, because SolidJS flushes
 * reactive updates synchronously but the microtask queue still needs to drain
 * for the `async` function body to complete and set signals.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@solidjs/testing-library";
import Tuner from "./Tuner";
import type { TunerResult } from "../../../lib/tuner";

// ---------------------------------------------------------------------------
// Module-level mock
// ---------------------------------------------------------------------------
// vi.mock is hoisted by Vitest so the factory runs before any imports.
// We capture both the callback and the stop function at module scope so every
// test can access them without dynamic imports or vi.mocked() calls.

let capturedCallback: ((result: TunerResult | null) => void) | null = null;
const mockStop = vi.fn();

vi.mock("../../../lib/tuner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../lib/tuner")>();
  return {
    ...actual,
    startTuner: vi.fn(async (onResult: (result: TunerResult | null) => void) => {
      capturedCallback = onResult;
      return mockStop;
    }),
  };
});

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function simulateResult(
  note: string,
  octave: number,
  cents: number,
  frequency: number,
  targetFrequency: number,
) {
  capturedCallback?.({ note, octave, cents, frequency, targetFrequency });
}

function simulateSilence() {
  capturedCallback?.(null);
}

// Render the component, click Start, wait for the async handler to resolve,
// then push a result through the callback.
async function startAndSimulate(
  note: string,
  octave: number,
  cents: number,
  frequency: number,
  targetFrequency: number,
) {
  render(() => <Tuner />);
  fireEvent.click(screen.getByRole("button", { name: /start tuner/i }));
  // Wait for the Stop button to appear — this confirms the async handleStart
  // has resolved and isRunning is true before we push a result.
  await screen.findByRole("button", { name: /stop tuner/i });
  simulateResult(note, octave, cents, frequency, targetFrequency);
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  capturedCallback = null;
  mockStop.mockReset();
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Tuner — stopped state", () => {
  it("renders the Start Tuner button", () => {
    render(() => <Tuner />);
    expect(screen.getByRole("button", { name: /start tuner/i })).toBeInTheDocument();
  });

  it("shows the hint text before starting", () => {
    render(() => <Tuner />);
    expect(screen.getByText(/press start to enable the microphone/i)).toBeInTheDocument();
  });

  it("does not show the Stop Tuner button initially", () => {
    render(() => <Tuner />);
    expect(screen.queryByRole("button", { name: /stop tuner/i })).toBeNull();
  });
});

describe("Tuner — starting the tuner", () => {
  it("switches to the Stop Tuner button after start", async () => {
    render(() => <Tuner />);
    fireEvent.click(screen.getByRole("button", { name: /start tuner/i }));
    expect(await screen.findByRole("button", { name: /stop tuner/i })).toBeInTheDocument();
  });

  it("shows the 'Listening…' indicator while running but silent", async () => {
    render(() => <Tuner />);
    fireEvent.click(screen.getByRole("button", { name: /start tuner/i }));
    await screen.findByRole("button", { name: /stop tuner/i });
    simulateSilence();
    expect(screen.getByText(/listening/i)).toBeInTheDocument();
  });
});

describe("Tuner — result display", () => {
  it("displays the detected note name", async () => {
    await startAndSimulate("A", 4, 0, 440, 440);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("displays the octave number", async () => {
    await startAndSimulate("A", 4, 0, 440, 440);
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("shows 'In tune' when cents deviation is 0", async () => {
    await startAndSimulate("A", 4, 0, 440, 440);
    expect(screen.getByText("In tune")).toBeInTheDocument();
  });

  it("shows the frequency in Hz", async () => {
    await startAndSimulate("A", 4, 0, 440, 440);
    // The freq container holds "440.0 Hz" as a text node alongside a child
    // span, so we query by class rather than text to avoid ambiguity with
    // the "(target 440.0 Hz)" span that also matches the regex.
    const freqEl = document.querySelector(".tuner__freq");
    expect(freqEl).not.toBeNull();
    expect(freqEl!.textContent).toMatch(/440\.0\s*Hz/i);
  });

  it("shows positive cents with + sign", async () => {
    await startAndSimulate("A", 4, 15, 444, 440);
    expect(screen.getByText("+15 ¢")).toBeInTheDocument();
  });

  it("shows negative cents with − sign", async () => {
    await startAndSimulate("A", 4, -20, 436, 440);
    expect(screen.getByText("-20 ¢")).toBeInTheDocument();
  });

  it("shows the target frequency", async () => {
    await startAndSimulate("A", 4, 10, 444.5, 440);
    expect(screen.getByText(/target 440\.0 hz/i)).toBeInTheDocument();
  });
});

describe("Tuner — stopping the tuner", () => {
  it("calls the stop function when Stop Tuner is clicked", async () => {
    render(() => <Tuner />);
    fireEvent.click(screen.getByRole("button", { name: /start tuner/i }));
    fireEvent.click(await screen.findByRole("button", { name: /stop tuner/i }));
    expect(mockStop).toHaveBeenCalledOnce();
  });

  it("returns to the Start Tuner button after stopping", async () => {
    render(() => <Tuner />);
    fireEvent.click(screen.getByRole("button", { name: /start tuner/i }));
    fireEvent.click(await screen.findByRole("button", { name: /stop tuner/i }));
    expect(screen.getByRole("button", { name: /start tuner/i })).toBeInTheDocument();
  });

  it("clears the result display after stopping", async () => {
    render(() => <Tuner />);
    fireEvent.click(screen.getByRole("button", { name: /start tuner/i }));
    await screen.findByRole("button", { name: /stop tuner/i });
    simulateResult("A", 4, 0, 440, 440);
    fireEvent.click(screen.getByRole("button", { name: /stop tuner/i }));
    expect(screen.queryByText("A")).toBeNull();
  });
});

describe("Tuner — error states", () => {
  // For each test we grab the already-mocked startTuner (vi.mock replaced it
  // for the whole file) and use mockRejectedValueOnce to simulate failure.

  it("shows a permission denied message for NotAllowedError", async () => {
    const { startTuner } = await import("../../../lib/tuner");
    vi.mocked(startTuner).mockRejectedValueOnce(
      Object.assign(new Error("Denied"), { name: "NotAllowedError" }),
    );
    render(() => <Tuner />);
    fireEvent.click(screen.getByRole("button", { name: /start tuner/i }));
    expect(await screen.findByText(/microphone access was denied/i)).toBeInTheDocument();
  });

  it("shows a secure context message for SecurityError", async () => {
    const { startTuner } = await import("../../../lib/tuner");
    vi.mocked(startTuner).mockRejectedValueOnce(
      Object.assign(new Error("Insecure"), { name: "SecurityError" }),
    );
    render(() => <Tuner />);
    fireEvent.click(screen.getByRole("button", { name: /start tuner/i }));
    expect(await screen.findByText(/not available/i)).toBeInTheDocument();
  });

  it("shows a secure context message for TypeError (mediaDevices undefined)", async () => {
    const { startTuner } = await import("../../../lib/tuner");
    vi.mocked(startTuner).mockRejectedValueOnce(
      Object.assign(new TypeError("Cannot read properties of undefined"), { name: "TypeError" }),
    );
    render(() => <Tuner />);
    fireEvent.click(screen.getByRole("button", { name: /start tuner/i }));
    expect(await screen.findByText(/not available/i)).toBeInTheDocument();
  });

  it("shows a not found message for NotFoundError", async () => {
    const { startTuner } = await import("../../../lib/tuner");
    vi.mocked(startTuner).mockRejectedValueOnce(
      Object.assign(new Error("NotFound"), { name: "NotFoundError" }),
    );
    render(() => <Tuner />);
    fireEvent.click(screen.getByRole("button", { name: /start tuner/i }));
    expect(await screen.findByText(/no microphone was found/i)).toBeInTheDocument();
  });

  it("shows a generic message for unknown errors", async () => {
    const { startTuner } = await import("../../../lib/tuner");
    vi.mocked(startTuner).mockRejectedValueOnce(new Error("Something else"));
    render(() => <Tuner />);
    fireEvent.click(screen.getByRole("button", { name: /start tuner/i }));
    expect(await screen.findByText(/could not access the microphone/i)).toBeInTheDocument();
  });
});
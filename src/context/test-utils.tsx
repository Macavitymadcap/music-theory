import { type ParentComponent, type JSX } from "solid-js";
import { render } from "@solidjs/testing-library";
import { vi } from "vitest";
import { AudioProvider } from "./AudioContext";
import { PlaybackProvider } from "./PlaybackContext";

export const TestProviders: ParentComponent = (props) => (
  <AudioProvider>
    <PlaybackProvider>
      {props.children}
    </PlaybackProvider>
  </AudioProvider>
);

export function renderWithProviders(ui: () => JSX.Element) {
  return render(() => <TestProviders>{ui()}</TestProviders>);
}

export interface MockAudioContext {
  state: AudioContextState;
  resume: ReturnType<typeof vi.fn>;
  suspend: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  createOscillator: ReturnType<typeof vi.fn>;
  createGain: ReturnType<typeof vi.fn>;
  currentTime: number;
  destination: object;
}

/**
 * Stubs window.AudioContext with a class-based mock so `new AudioContext()`
 * works correctly in jsdom. Returns the shared instance for assertions.
 */
export function stubAudioContext(
  initialState: AudioContextState = "running"
): MockAudioContext {
  const instance: MockAudioContext = {
    state: initialState,
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    currentTime: 0,
    destination: {},
    createOscillator: vi.fn(() => ({
      type: "" as OscillatorType,
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createGain: vi.fn(() => ({
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    })),
  };

  class MockAudioContextClass {
    constructor() {
      Object.assign(this, instance);
    }
  }

  vi.stubGlobal("AudioContext", vi.fn(MockAudioContextClass));
  return instance;
}
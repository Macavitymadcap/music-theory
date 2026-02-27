import { render, cleanup } from "@solidjs/testing-library";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AudioProvider } from "./AudioContext";
import { PlaybackProvider, usePlayback, type PlaybackSequence } from "./PlaybackContext";
import { stubAudioContext } from "./test-utils";
import type { Component } from "solid-js";

let mockContext: ReturnType<typeof stubAudioContext>;

const PlaybackConsumer: Component<{
  onMount: (v: ReturnType<typeof usePlayback>) => void;
}> = (props) => {
  props.onMount(usePlayback());
  return null;
};

function renderPlayback() {
  let value!: ReturnType<typeof usePlayback>;
  render(() => (
    <AudioProvider>
      <PlaybackProvider>
        <PlaybackConsumer onMount={(v) => (value = v)} />
      </PlaybackProvider>
    </AudioProvider>
  ));
  return value;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockContext = stubAudioContext();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  cleanup();
});

describe("PlaybackProvider / usePlayback", () => {
  it("is not playing initially", () => {
    const pb = renderPlayback();
    expect(pb.isPlaying()).toBe(false);
  });

  it("sets isPlaying to true on start (instant)", () => {
    const pb = renderPlayback();
    pb.start({ type: "instant", frequencies: [440] });
    expect(pb.isPlaying()).toBe(true);
  });

  it("sets currentFrequencies on instant start", () => {
    const pb = renderPlayback();
    pb.start({ type: "instant", frequencies: [440, 550] });
    expect(pb.currentFrequencies()).toEqual([440, 550]);
  });

  it("stop clears isPlaying and currentFrequencies", () => {
    const pb = renderPlayback();
    pb.start({ type: "instant", frequencies: [440] });
    pb.stop();
    expect(pb.isPlaying()).toBe(false);
    expect(pb.currentFrequencies()).toEqual([]);
  });

  it("stop calls audio.suspend", () => {
    const pb = renderPlayback();
    pb.start({ type: "instant", frequencies: [440] });
    pb.stop();
    expect(mockContext.suspend).toHaveBeenCalled();
  });

  it("sequential start sets first frequency immediately", () => {
    const pb = renderPlayback();
    const seq: PlaybackSequence = {
      type: "sequential",
      frequencies: [440, 550, 660],
      intervalMs: 500,
    };
    pb.start(seq);
    expect(pb.currentFrequencies()).toEqual([440]);
  });

  it("sequential playback steps through frequencies on timer", () => {
    const pb = renderPlayback();
    const seq: PlaybackSequence = {
      type: "sequential",
      frequencies: [440, 550, 660],
      intervalMs: 500,
    };
    pb.start(seq);
    expect(pb.currentFrequencies()).toEqual([440]);

    vi.advanceTimersByTime(500);
    expect(pb.currentFrequencies()).toEqual([550]);

    vi.advanceTimersByTime(500);
    expect(pb.currentFrequencies()).toEqual([660]);
  });

  it("sequential playback ends after last frequency", () => {
    const pb = renderPlayback();
    const seq: PlaybackSequence = {
      type: "sequential",
      frequencies: [440, 550],
      intervalMs: 500,
    };
    pb.start(seq);
    vi.advanceTimersByTime(500);
    vi.advanceTimersByTime(500);
    expect(pb.isPlaying()).toBe(false);
    expect(pb.currentFrequencies()).toEqual([]);
  });

  it("starting a new sequence stops the previous one", () => {
    const pb = renderPlayback();
    pb.start({ type: "instant", frequencies: [440] });
    pb.start({ type: "instant", frequencies: [880] });
    expect(pb.currentFrequencies()).toEqual([880]);
  });

  it("throws when usePlayback is used outside PlaybackProvider", () => {
    expect(() =>
      render(() => <PlaybackConsumer onMount={() => {}} />)
    ).toThrow("usePlayback must be used within PlaybackProvider");
  });
});
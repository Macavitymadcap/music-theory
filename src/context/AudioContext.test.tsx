import { render, cleanup } from "@solidjs/testing-library";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AudioProvider, useAudio } from "./AudioContext";
import { stubAudioContext, type MockAudioContext } from "./test-utils";
import type { Component } from "solid-js";

const AudioConsumer: Component<{
  onMount: (v: ReturnType<typeof useAudio>) => void;
}> = (props) => {
  props.onMount(useAudio());
  return null;
};

let mockCtx: MockAudioContext;

beforeEach(() => {
  vi.clearAllMocks();
  mockCtx = stubAudioContext();
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

function renderAudio() {
  let value!: ReturnType<typeof useAudio>;
  render(() => (
    <AudioProvider>
      <AudioConsumer onMount={(v) => (value = v)} />
    </AudioProvider>
  ));
  return value;
}

describe("AudioProvider / useAudio", () => {
  it("provides getAudioContext", () => {
    const value = renderAudio();
    expect(value.getAudioContext).toBeTypeOf("function");
  });

  it("creates an AudioContext on first call", () => {
    const value = renderAudio();
    value.getAudioContext();
    expect(AudioContext).toHaveBeenCalledOnce();
  });

  it("returns the same instance on subsequent calls", () => {
    const value = renderAudio();
    const a = value.getAudioContext();
    const b = value.getAudioContext();
    expect(a).toBe(b);
  });

  it("resumes a suspended context on getAudioContext", () => {
    mockCtx = stubAudioContext("suspended");
    const value = renderAudio();
    value.getAudioContext();
    expect(mockCtx.resume).toHaveBeenCalled();
  });

  it("suspend calls ctx.suspend when running", async () => {
    const value = renderAudio();
    value.getAudioContext();
    await value.suspend();
    expect(mockCtx.suspend).toHaveBeenCalled();
  });

  it("throws when useAudio is used outside AudioProvider", () => {
    expect(() =>
      render(() => <AudioConsumer onMount={() => {}} />)
    ).toThrow("useAudio must be used within AudioProvider");
  });
});
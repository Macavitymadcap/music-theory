import { createSignal, onCleanup, Show } from "solid-js";
import type { Component } from "solid-js";
import "./Tuner.css";
import { TunerResult, startTuner } from "../../../lib/tuner";
import Button from "../../atoms/button/Button";

type PermissionState = "idle" | "requesting" | "granted" | "denied" | "error";

const Tuner: Component = () => {
  const [permission, setPermission] = createSignal<PermissionState>("idle");
  const [result, setResult] = createSignal<TunerResult | null>(null);
  const [isRunning, setIsRunning] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal("");

  let stopFn: (() => void) | null = null;

  async function handleStart() {
    console.log("[Tuner] handleStart called");
    setPermission("requesting");
    setResult(null);
    setErrorMessage("");
    try {
      console.log("[Tuner] calling startTuner...");
      stopFn = await startTuner((r) => setResult(r));
      console.log("[Tuner] startTuner resolved, stopFn =", stopFn);
      setPermission("granted");
      setIsRunning(true);
      console.log("[Tuner] isRunning set to true");
    } catch (err) {
      console.error("[Tuner] caught error:", err);
      const name = err instanceof Error ? err.name : "";
      console.log("[Tuner] error name:", name, "message:", err instanceof Error ? err.message : String(err));
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setPermission("denied");
        setErrorMessage(
          "Microphone access was denied. Please allow microphone access in your browser settings and try again.",
        );
      } else if (name === "SecurityError" || name === "TypeError") {
        setPermission("error");
        setErrorMessage(
          "Microphone access is not available. Please ensure you are using HTTPS or localhost.",
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setPermission("error");
        setErrorMessage("No microphone was found. Please connect a microphone and try again.");
      } else {
        setPermission("error");
        setErrorMessage(
          "Could not access the microphone. Please check your browser and device settings.",
        );
      }
    }
  }

  function handleStop() {
    stopFn?.();
    stopFn = null;
    setIsRunning(false);
    setResult(null);
    setPermission("idle");
  }

  onCleanup(() => {
    stopFn?.();
  });

  const centsFraction = () => {
    const c = result()?.cents ?? 0;
    return Math.max(0, Math.min(100, (c + 50) / 100));
  };

  const centsLabel = () => {
    const c = result()?.cents;
    if (c === undefined || c === null) return "—";
    if (c === 0) return "In tune";
    return `${c > 0 ? "+" : ""}${c} ¢`;
  };

  const inTune = () => {
    const c = result()?.cents;
    return c !== undefined && c !== null && Math.abs(c) <= 5;
  };

  return (
    <div class="tuner">
      <div class="tuner__display" classList={{ "tuner__display--active": isRunning() }}>
        <Show
          when={isRunning() && result()}
          fallback={
            <div class="tuner__placeholder">
              <Show when={isRunning()}>
                <span class="tuner__listening">Listening…</span>
              </Show>
              <Show when={!isRunning()}>
                <span class="tuner__hint">Press Start to enable the microphone</span>
              </Show>
            </div>
          }
        >
          {(r) => (
            <>
              <div class="tuner__note" classList={{ "tuner__note--in-tune": inTune() }}>
                <span class="tuner__note-name">{r().note}</span>
                <span class="tuner__note-octave">{r().octave}</span>
              </div>

              <div class="tuner__freq">
                {r().frequency.toFixed(1)} Hz
                <span class="tuner__freq-target">
                  (target {r().targetFrequency.toFixed(1)} Hz)
                </span>
              </div>

              <div class="tuner__meter" aria-label={`Cents deviation: ${centsLabel()}`}>
                <div class="tuner__meter-track">
                  <div class="tuner__meter-centre" />
                  <div
                    class="tuner__meter-indicator"
                    classList={{ "tuner__meter-indicator--in-tune": inTune() }}
                    style={{ left: `${centsFraction() * 100}%` }}
                  />
                </div>
                <div class="tuner__meter-labels">
                  <span>−50 ¢</span>
                  <span class="tuner__cents-label">{centsLabel()}</span>
                  <span>+50 ¢</span>
                </div>
              </div>
            </>
          )}
        </Show>
      </div>

      <Show when={permission() === "denied" || permission() === "error"}>
        <p class="tuner__error" role="alert">
          {errorMessage()}
        </p>
      </Show>

      <Show when={permission() === "requesting"}>
        <p class="tuner__status">Requesting microphone access…</p>
      </Show>

      <div class="tuner__controls">
        <Show
          when={isRunning()}
          fallback={
            <Button
              variant="primary"
              onClick={handleStart}
              disabled={permission() === "requesting"}
            >
              Start Tuner
            </Button>
          }
        >
          <Button variant="danger" onClick={handleStop}>
            Stop Tuner
          </Button>
        </Show>
      </div>
    </div>
  );
};

export default Tuner;
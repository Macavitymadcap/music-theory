import {
  createContext,
  useContext,
  createSignal,
  onCleanup,
  type ParentComponent,
} from "solid-js";
import { useAudio } from "./AudioContext";

export type PlaybackSequence =
  | { type: "instant"; frequencies: number[] }
  | { type: "sequential"; frequencies: number[]; intervalMs: number };

interface PlaybackContextValue {
  isPlaying: () => boolean;
  currentFrequencies: () => number[];
  start: (sequence: PlaybackSequence, onEnd?: () => void) => void;
  /** Update highlighted frequencies without interrupting playback state.
   *  Used by Progression to animate chord changes without stop/start cycling. */
  updateFrequencies: (frequencies: number[]) => void;
  stop: () => void;
}

const PlaybackCtx = createContext<PlaybackContextValue>();

export const PlaybackProvider: ParentComponent = (props) => {
  const audio = useAudio();

  const [isPlaying, setIsPlaying] = createSignal(false);
  const [currentFrequencies, setCurrentFrequencies] = createSignal<number[]>([]);

  let endTimer: ReturnType<typeof setTimeout> | null = null;
  let sequenceTimer: ReturnType<typeof setInterval> | null = null;

  function clearTimers() {
    if (endTimer !== null) { clearTimeout(endTimer); endTimer = null; }
    if (sequenceTimer !== null) { clearInterval(sequenceTimer); sequenceTimer = null; }
  }

  function stop() {
    clearTimers();
    audio.suspend();
    setIsPlaying(false);
    setCurrentFrequencies([]);
  }

  function updateFrequencies(frequencies: number[]) {
    // Only update the visual highlight — does not touch playing state or audio
    setCurrentFrequencies(frequencies);
  }

  function start(sequence: PlaybackSequence, onEnd?: () => void) {
    // Stop any existing managed sequence (scale/note/chord modes)
    // but don't call the full stop() which suspends audio —
    // just clear timers and reset state
    clearTimers();
    setIsPlaying(false);
    setCurrentFrequencies([]);

    audio.getAudioContext(); // ensure context is created and resumed
    setIsPlaying(true);

    if (sequence.type === "instant") {
      setCurrentFrequencies(sequence.frequencies);
    } else {
      // Sequential — step through frequencies on a timer (scales)
      let idx = 0;
      const step = () => {
        if (idx >= sequence.frequencies.length) {
          clearTimers();
          setIsPlaying(false);
          setCurrentFrequencies([]);
          onEnd?.();
          return;
        }
        setCurrentFrequencies([sequence.frequencies[idx]]);
        idx++;
      };
      step();
      sequenceTimer = setInterval(step, sequence.intervalMs);
    }
  }

  onCleanup(stop);

  return (
    <PlaybackCtx.Provider value={{ isPlaying, currentFrequencies, start, updateFrequencies, stop }}>
      {props.children}
    </PlaybackCtx.Provider>
  );
};

export function usePlayback(): PlaybackContextValue {
  const ctx = useContext(PlaybackCtx);
  if (!ctx) throw new Error("usePlayback must be used within PlaybackProvider");
  return ctx;
}
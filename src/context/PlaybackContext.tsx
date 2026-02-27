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

  function start(sequence: PlaybackSequence, onEnd?: () => void) {
    if (isPlaying()) stop();

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
    <PlaybackCtx.Provider value={{ isPlaying, currentFrequencies, start, stop }}>
      {props.children}
    </PlaybackCtx.Provider>
  );
};

export function usePlayback(): PlaybackContextValue {
  const ctx = useContext(PlaybackCtx);
  if (!ctx) throw new Error("usePlayback must be used within PlaybackProvider");
  return ctx;
}
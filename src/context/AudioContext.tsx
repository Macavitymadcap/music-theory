import {
  createContext,
  useContext,
  onCleanup,
  type ParentComponent,
} from "solid-js";

interface AudioContextValue {
  getAudioContext: () => AudioContext;
  suspend: () => Promise<void>;
  resume: () => Promise<void>;
}

const AudioCtx = createContext<AudioContextValue>();

export const AudioProvider: ParentComponent = (props) => {
  let ctx: AudioContext | null = null;

  function getAudioContext(): AudioContext {
    if (!ctx || ctx.state === "closed") {
      ctx = new AudioContext();
    }
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }

  async function suspend() {
    if (ctx?.state === "running") {
      await ctx.suspend();
    }
  }

  async function resume() {
    if (ctx?.state === "suspended") {
      await ctx.resume();
    }
  }

  onCleanup(() => {
    ctx?.close();
  });

  return (
    <AudioCtx.Provider value={{ getAudioContext, suspend, resume }}>
      {props.children}
    </AudioCtx.Provider>
  );
};

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}
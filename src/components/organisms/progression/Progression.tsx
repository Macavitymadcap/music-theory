import { type Component, createSignal, createMemo, Switch, Match, createEffect } from "solid-js";
import { useAudio } from "../../../context/AudioContext";
import { usePlayback } from "../../../context/PlaybackContext";
import RadioGroup from "../../atoms/radio-group/RadioGroup";
import Field from "../../atoms/field/Field";
import Label from "../../atoms/label/Label";
import Button from "../../atoms/button/Button";
import ProgressionControls from "../../molecules/ProgressionControls";
import PresetProgression from "../preset-progression/PresetProgression";
import CustomProgressionBuilder from "../custom-progression-builder/CustomProgressionBuilder";
import { PROGRESSION_PRESETS, resolveProgression, type ProgressionStep } from "../../../lib/progressions";
import { getFrequencyFromName, scheduleChordAtTime, type WaveformType } from "../../../lib";
import type { NotationBar } from "../../../lib/notation";
import "./Progression.css";

const SUB_MODE_OPTIONS = [
  { value: "preset", label: "preset" },
  { value: "custom", label: "custom" },
];

interface ProgressionProps {
  onSelectionChange: (frequencies: number[]) => void;
  onNotationChange: (bars: NotationBar[]) => void;
}

const Progression: Component<ProgressionProps> = (props) => {
  const audio = useAudio();
  const playback = usePlayback();

  const [subMode, setSubMode] = createSignal<"preset" | "custom">("preset");
  const [presetName, setPresetName] = createSignal(PROGRESSION_PRESETS[0].name);
  const [customSteps, setCustomSteps] = createSignal<ProgressionStep[]>([]);

  const [pitch, setPitch] = createSignal("c4");
  const [repeats, setRepeats] = createSignal(1);
  const [waveform, setWaveform] = createSignal<WaveformType>("sine");
  const [bpm, setBpm] = createSignal(120);
  const [keySig, setKeySig] = createSignal("C");

  let activeToken: { cancelled: boolean } | null = null;

  const activeSteps = createMemo<ProgressionStep[]>(() =>
    subMode() === "preset"
      ? (PROGRESSION_PRESETS.find((p) => p.name === presetName())?.steps ?? [])
      : customSteps()
  );

  // Read ALL reactive signals at the top of createEffect so SolidJS tracks them.
  // keySig() must be read here — if it's only accessed inside .map() further
  // down, it is still tracked, but being explicit at the top makes it obvious.
  createEffect(() => {
    const steps = activeSteps();
    const tonic = getFrequencyFromName(pitch());
    const currentKeySig = keySig(); // ← tracked here, used below

    if (!steps.length) {
      props.onSelectionChange([]);
      props.onNotationChange([]);
      return;
    }

    const resolved = resolveProgression(steps, tonic);

    props.onSelectionChange(
      resolved.flatMap((r) =>
        r.intervals.map((i) => r.tonicFreq * Math.pow(2, i / 12))
      )
    );

    props.onNotationChange(
      resolved.map((r, i) => ({
        chords: [r.intervals.map((int) => r.tonicFreq * Math.pow(2, int / 12))],
        // Only the first bar carries time signature and key signature —
        // VexFlow only needs them declared once per system.
        timeSignature: i === 0 ? `${r.beatsPerBar ?? 4}/4` : undefined,
        keySignature: i === 0 ? currentKeySig : undefined,
        bars: r.bars,
      }))
    );
  });

  function stopPlayback() {
    if (activeToken) {
      activeToken.cancelled = true;
      activeToken = null;
    }
    playback.stop();
  }

  function play() {
    if (playback.isPlaying()) {
      stopPlayback();
      return;
    }
    if (!activeSteps().length) return;

    const ctx = audio.getAudioContext();
    const tonic = getFrequencyFromName(pitch());
    const resolved = resolveProgression(activeSteps(), tonic);
    const currentBpm = bpm();
    const currentWaveform = waveform();
    const currentRepeats = repeats();

    const sequence: { freqs: number[]; durationMs: number }[] = [];
    let audioTime = ctx.currentTime + 0.05;

    for (let rep = 0; rep < currentRepeats; rep++) {
      for (const r of resolved) {
        const msPerBeat = 60000 / currentBpm;
        const msPerBar = msPerBeat * (r.beatsPerBar ?? 4);
        const hitMs = msPerBar / r.hitsPerBar;
        const hitSeconds = hitMs / 1000;
        const freqs = r.intervals.map((i) => r.tonicFreq * Math.pow(2, i / 12));
        const totalHits = r.bars * r.hitsPerBar;

        for (let h = 0; h < totalHits; h++) {
          scheduleChordAtTime(freqs, audioTime, hitSeconds, {
            context: ctx,
            waveform: currentWaveform,
            gain: 0.35,
          });
          sequence.push({ freqs, durationMs: hitMs });
          audioTime += hitSeconds;
        }
      }
    }

    if (!sequence.length) return;

    const token = { cancelled: false };
    activeToken = token;

    playback.start({ type: "instant", frequencies: sequence[0].freqs });

    let idx = 1;

    function tick() {
      if (token.cancelled || !playback.isPlaying()) return;
      if (idx >= sequence.length) {
        stopPlayback();
        return;
      }
      const { freqs, durationMs } = sequence[idx++];
      playback.updateFrequencies(freqs);
      setTimeout(tick, durationMs);
    }

    setTimeout(tick, sequence[0].durationMs);
  }

  return (
    <div class="progression">
      <Field>
        <Label>mode</Label>
        <RadioGroup
          name="prog-submode"
          options={SUB_MODE_OPTIONS}
          value={subMode()}
          onChange={(v) => {
            stopPlayback();
            setSubMode(v as "preset" | "custom");
          }}
        />
      </Field>

      <Switch>
        <Match when={subMode() === "preset"}>
          <PresetProgression value={presetName()} onChange={setPresetName} />
        </Match>
        <Match when={subMode() === "custom"}>
          <CustomProgressionBuilder steps={customSteps()} onStepsChange={setCustomSteps} />
        </Match>
      </Switch>

      <ProgressionControls
        pitch={pitch()} onPitchChange={setPitch}
        repeats={repeats()} onRepeatsChange={setRepeats}
        waveform={waveform()} onWaveformChange={setWaveform}
        bpm={bpm()} onBpmChange={setBpm}
        keySig={keySig()} onKeySigChange={setKeySig}
      />

      <Button
        onClick={play}
        variant={playback.isPlaying() ? "danger" : "primary"}
        disabled={subMode() === "custom" && !customSteps().length}
      >
        {playback.isPlaying() ? "■ stop" : "▶ play"}
      </Button>
    </div>
  );
};

export default Progression;
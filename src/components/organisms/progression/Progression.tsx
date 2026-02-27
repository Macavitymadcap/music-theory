import { type Component, createSignal, createMemo, Switch, Match, createEffect, onCleanup } from "solid-js";
import { useAudio } from "../../../context/AudioContext";
import { usePlayback } from "../../../context/PlaybackContext";
import RadioGroup from "../../atoms/radio-group/RadioGroup";
import Field from "../../atoms/field/Field";
import Label from "../../atoms/label/Label";
import Button from "../../atoms/button/Button";
import ProgressionControls from "../../molecules/progression-controls/ProgressionControls";
import PresetProgression from "./PresetProgression";
import CustomProgressionBuilder from "./CustomProgressionBuilder";
import { PROGRESSION_PRESETS, resolveProgression, type ProgressionStep } from "../../../lib/progressions";
import { getFrequencyFromName, playChordProgression, type WaveformType } from "../../../lib";
import { TIME_SIGNATURES } from "../../../lib/duration";
import "./Progression.css";

const SUB_MODE_OPTIONS = [
  { value: "preset", label: "preset" },
  { value: "custom", label: "custom" },
];

interface ProgressionProps {
  onSelectionChange: (frequencies: number[]) => void;
}

const Progression: Component<ProgressionProps> = (props) => {
  const audio = useAudio();
  const playback = usePlayback();

  const [subMode, setSubMode] = createSignal<"preset" | "custom">("preset");
  const [presetName, setPresetName] = createSignal(PROGRESSION_PRESETS[0].name);
  const [customSteps, setCustomSteps] = createSignal<ProgressionStep[]>([]);

  const [pitch, setPitch] = createSignal("c4");
  const [octave, setOctave] = createSignal(4);
  const [repeats, setRepeats] = createSignal(1);
  const [waveform, setWaveform] = createSignal<WaveformType>("sine");
  const [bpm, setBpm] = createSignal(120);

  const activeSteps = createMemo<ProgressionStep[]>(() =>
    subMode() === "preset"
      ? (PROGRESSION_PRESETS.find((p) => p.name === presetName())?.steps ?? [])
      : customSteps()
  );

  // Notify parent of full chord set for keyboard range
  const allFrequencies = createMemo(() => {
    const steps = activeSteps();
    if (!steps.length) return [];
    const tonic = getFrequencyFromName(pitch());
    return resolveProgression(steps, tonic).flatMap((r) =>
      r.intervals.map((i) => r.tonicFreq * Math.pow(2, i / 12))
    );
  });

  createEffect(() => props.onSelectionChange(allFrequencies())); 
  
  function play() {
    if (playback.isPlaying()) { playback.stop(); return; }
    if (!activeSteps().length) return;

    const ctx = audio.getAudioContext();
    const tonic = getFrequencyFromName(pitch());
    const resolved = resolveProgression(activeSteps(), tonic);
    const msPerBar = (60 / bpm()) * 4 * 1000;

    const sequence: { freqs: number[]; durationMs: number }[] = [];
    for (let rep = 0; rep < repeats(); rep++) {
      for (const r of resolved) {
        const hitDurationMs = (msPerBar * r.bars) / r.hitsPerBar;
        for (let h = 0; h < r.hitsPerBar; h++) {
          const freqs = r.intervals.map((i) => r.tonicFreq * Math.pow(2, i / 12));
          sequence.push({ freqs, durationMs: hitDurationMs });
        }
      }
    }

    // Map resolved steps to Chord objects
    const chords = resolved.map((step) => ({
      notes: step.intervals.map((i) => ({
        frequency: step.tonicFreq * Math.pow(2, i / 12),
        value: 1, // quarter note = 1 beat; adjust as needed
      })),
      length: step.bars,
      label: step.label,
    }));

    playChordProgression(chords, {
      context: ctx,
      waveform: waveform(),
      bpm: bpm(),
      gain: 0.35,
      timeSignature: TIME_SIGNATURES.FOUR_FOUR,
    });

    // cancelled becomes true when stop() is called externally
    let cancelled = false;
    const cancel = () => { cancelled = true; };
    onCleanup(cancel);

    let idx = 0;

    function step() {
      if (cancelled || !playback.isPlaying()) return;
      if (idx >= sequence.length) {
        playback.stop();
        return;
      }
      const { freqs, durationMs } = sequence[idx++];
      playback.start({ type: "instant", frequencies: freqs });
      setTimeout(step, durationMs);
    }

    playback.start({ type: "instant", frequencies: sequence[0].freqs });
    idx = 1;
    setTimeout(step, sequence[0].durationMs);
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
            playback.stop();
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
        octave={octave()} onOctaveChange={setOctave}
        repeats={repeats()} onRepeatsChange={setRepeats}
        waveform={waveform()} onWaveformChange={setWaveform}
        bpm={bpm()} onBpmChange={setBpm}
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
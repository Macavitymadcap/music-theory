import { type Component, createSignal, createMemo, createEffect } from "solid-js";
import { useAudio } from "../../../context/AudioContext";
import { usePlayback } from "../../../context/PlaybackContext";
import PitchSelect from "../shared/PitchSelect";
import WaveformSelect from "../shared/WaveformSelect";
import DurationSelect from "../shared/DurationSelect";
import BpmInput from "../shared/BpmInput";
import Button from "../../atoms/button/Button";
import Row from "../../molecules/row/Row";
import Field from "../../atoms/field/Field";
import Label from "../../atoms/label/Label";
import Select from "../../atoms/select/Select";
import {
  SCALES,
  SCALE_GROUPS,
  type ScaleName,
} from "../../../lib/scales";
import {
  getFrequencyFromName,
  createScale,
  playScale,
  durationToSeconds,
  type WaveformType,
} from "../../../lib";
import { DURATIONS, TIME_SIGNATURES, type Duration } from "../../../lib/duration";

interface ScaleProps {
  onSelectionChange: (frequencies: number[]) => void;
}

const SCALE_GROUPS_FOR_SELECT = SCALE_GROUPS.map((g) => ({
  label: g.label,
  options: g.scales.map((s) => ({ value: s, label: SCALES[s].name })),
}));

const Scale: Component<ScaleProps> = (props) => {
  const audio = useAudio();
  const playback = usePlayback();

  const [pitch, setPitch] = createSignal("c4");
  const [scaleName, setScaleName] = createSignal<ScaleName>("major");
  const [waveform, setWaveform] = createSignal<WaveformType>("sine");
  const [duration, setDuration] = createSignal<Duration>(DURATIONS.CROTCHET);
  const [bpm, setBpm] = createSignal(120);

  createEffect(() => {
    const tonic = getFrequencyFromName(pitch());
    const notes = createScale(scaleName(), tonic);
    props.onSelectionChange(notes.map((n) => n.frequency));
  });

  const intervalMs = createMemo(() =>
    durationToSeconds(duration(), bpm(), TIME_SIGNATURES.FOUR_FOUR) * 1000
  );

  function play() {
    if (playback.isPlaying()) { playback.stop(); return; }

    const ctx = audio.getAudioContext();
    const tonic = getFrequencyFromName(pitch());
    const notes = createScale(scaleName(), tonic);
    notes.forEach((n) => (n.value = duration()));

    playScale(notes, {
      context: ctx,
      waveform: waveform(),
      bpm: bpm(),
      gain: 0.35,
      timeSignature: TIME_SIGNATURES.FOUR_FOUR,
    });

    playback.start({
      type: "sequential",
      frequencies: notes.map((n) => n.frequency),
      intervalMs: intervalMs(),
    });
  }

  return (
    <div class="scale-panel">
      <Row>
        <PitchSelect id="scale-pitch" value={pitch()} onChange={setPitch} />
        <WaveformSelect id="scale-waveform" value={waveform()} onChange={setWaveform} />
      </Row>
      <Field>
        <Label for="scale-type">scale</Label>
        <Select
          id="scale-type"
          value={scaleName()}
          onChange={(v) => setScaleName(v as ScaleName)}
          groups={SCALE_GROUPS_FOR_SELECT}
        />
      </Field>
      <Row>
        <DurationSelect id="scale-duration" value={duration()} onChange={setDuration} />
        <BpmInput id="scale-bpm" value={bpm()} onChange={setBpm} />
      </Row>
      <Button onClick={play} variant={playback.isPlaying() ? "danger" : "primary"}>
        {playback.isPlaying() ? "■ stop" : "▶ play"}
      </Button>
    </div>
  );
};

export default Scale;
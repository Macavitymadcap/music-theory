import { type Component, createEffect, createSignal } from "solid-js";
import { useAudio } from "../../../context/AudioContext";
import { usePlayback } from "../../../context/PlaybackContext";
import Button from "../../atoms/button/Button";
import Row from "../../molecules/row/Row";
import Field from "../../atoms/field/Field";
import Label from "../../atoms/label/Label";
import Select from "../../atoms/select/Select";
import {
  CHORD_GROUPS,
  CHORD_DISPLAY_NAMES,
  type ChordType,
} from "../../../lib/chords";
import {
  getFrequencyFromName,
  createChord,
  playChord,
  durationToSeconds,
  type WaveformType,
} from "../../../lib";
import { DURATIONS, TIME_SIGNATURES, type Duration } from "../../../lib/duration";
import BpmInput from "../../molecules/BpmInput";
import DurationSelect from "../../molecules/DurationSelect";
import PitchSelect from "../../molecules/PitchSelect";
import WaveformSelect from "../../molecules/WaveformSelect";

interface ChordProps {
  onSelectionChange: (frequencies: number[]) => void;
}

const CHORD_GROUPS_FOR_SELECT = CHORD_GROUPS.map((g) => ({
  label: g.label,
  options: g.chords.map((c) => ({ value: c, label: CHORD_DISPLAY_NAMES[c] })),
}));

const Chord: Component<ChordProps> = (props) => {
  const audio = useAudio();
  const playback = usePlayback();

  const [pitch, setPitch] = createSignal("c4");
  const [chordType, setChordType] = createSignal<ChordType>("majorTriad");
  const [waveform, setWaveform] = createSignal<WaveformType>("sine");
  const [duration, setDuration] = createSignal<Duration>(DURATIONS.CROTCHET);
  const [bpm, setBpm] = createSignal(120);

  createEffect(() => {
    const tonic = getFrequencyFromName(pitch());
    const chord = createChord(chordType(), tonic, DURATIONS.CROTCHET);
    props.onSelectionChange(chord.notes.map((n) => n.frequency));
  });

  function play() {
    if (playback.isPlaying()) { playback.stop(); return; }

    const ctx = audio.getAudioContext();
    const tonic = getFrequencyFromName(pitch());
    const chord = createChord(chordType(), tonic, duration());
    const totalMs = durationToSeconds(duration(), bpm(), TIME_SIGNATURES.FOUR_FOUR) * 1000;

    playChord(chord, {
      context: ctx,
      waveform: waveform(),
      bpm: bpm(),
      gain: 0.35,
      timeSignature: TIME_SIGNATURES.FOUR_FOUR,
    });

    playback.start(
      { type: "instant", frequencies: chord.notes.map((n) => n.frequency) },
      () => playback.stop()
    );

    setTimeout(() => playback.stop(), totalMs + 100);
  }

  return (
    <div class="chord-panel">
      <Row>
        <PitchSelect id="chord-pitch" value={pitch()} onChange={setPitch} />
        <WaveformSelect id="chord-waveform" value={waveform()} onChange={setWaveform} />
      </Row>
      <Field>
        <Label for="chord-type">chord</Label>
        <Select
          id="chord-type"
          value={chordType()}
          onChange={(v) => setChordType(v as ChordType)}
          groups={CHORD_GROUPS_FOR_SELECT}
        />
      </Field>
      <Row>
        <DurationSelect id="chord-duration" value={duration()} onChange={setDuration} />
        <BpmInput id="chord-bpm" value={bpm()} onChange={setBpm} />
      </Row>
      <Button onClick={play} variant={playback.isPlaying() ? "danger" : "primary"}>
        {playback.isPlaying() ? "■ stop" : "▶ play"}
      </Button>
    </div>
  );
};

export default Chord;
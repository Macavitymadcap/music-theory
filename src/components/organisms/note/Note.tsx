import { type Component, createEffect, createSignal } from "solid-js";
import { useAudio } from "../../../context/AudioContext";
import { usePlayback } from "../../../context/PlaybackContext";
import PitchSelect from "../shared/PitchSelect";
import WaveformSelect from "../shared/WaveformSelect";
import DurationSelect from "../shared/DurationSelect";
import BpmInput from "../shared/BpmInput";
import Button from "../../atoms/button/Button";
import Row from "../../molecules/row/Row";
import {
  getFrequencyFromName,
  createNote,
  scheduleNote,
  durationToSeconds,
  type WaveformType,
} from "../../../lib";
import { DURATIONS, TIME_SIGNATURES, type Duration } from "../../../lib/duration";

interface NotePanelProps {
  onSelectionChange: (frequencies: number[]) => void;
}

const Note: Component<NotePanelProps> = (props) => {
  const audio = useAudio();
  const playback = usePlayback();

  const [pitch, setPitch] = createSignal("c4");
  const [waveform, setWaveform] = createSignal<WaveformType>("sine");
  const [duration, setDuration] = createSignal<Duration>(DURATIONS.CROTCHET);
  const [bpm, setBpm] = createSignal(120);
  

  createEffect(() => {
    const freq = getFrequencyFromName(pitch());
    props.onSelectionChange([freq]);
  })

  function handlePitchChange(v:string) {
    setPitch(v);
  }

  function play() {
    if (playback.isPlaying()) { playback.stop(); return; }

    const ctx = audio.getAudioContext();
    const freq = getFrequencyFromName(pitch());
    const note = createNote(freq, duration());
    const totalMs = durationToSeconds(duration(), bpm(), TIME_SIGNATURES.FOUR_FOUR) * 1000;

    scheduleNote(note, ctx.currentTime, {
      context: ctx,
      waveform: waveform(),
      bpm: bpm(),
      gain: 0.35,
      timeSignature: TIME_SIGNATURES.FOUR_FOUR,
    });

    playback.start(
      { type: "instant", frequencies: [freq] },
      () => playback.stop()
    );

    setTimeout(() => playback.stop(), totalMs + 100);
  }

  return (
    <div class="note-panel">
      <Row>
        <PitchSelect id="note-pitch" value={pitch()} onChange={handlePitchChange} />
        <WaveformSelect id="note-waveform" value={waveform()} onChange={setWaveform} />
      </Row>
      <Row>
        <DurationSelect id="note-duration" value={duration()} onChange={setDuration} />
        <BpmInput id="note-bpm" value={bpm()} onChange={setBpm} />
      </Row>
      <Button onClick={play} variant={playback.isPlaying() ? "danger" : "primary"}>
        {playback.isPlaying() ? "■ stop" : "▶ play"}
      </Button>
    </div>
  );
};

export default Note;
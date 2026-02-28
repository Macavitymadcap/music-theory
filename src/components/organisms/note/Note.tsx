import { type Component, createEffect, createSignal } from "solid-js";
import { useAudio } from "../../../context/AudioContext";
import { usePlayback } from "../../../context/PlaybackContext";
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
import BpmInput from "../../molecules/BpmInput";
import DurationSelect from "../../molecules/DurationSelect";
import PitchSelect from "../../molecules/PitchSelect";
import WaveformSelect from "../../molecules/WaveformSelect";
import type { NotationBar } from "../../../lib/notation";
import KeySignatureSelect from "../../molecules/KeySignatureSelect";

function durationToVex(d: Duration): string {
  if (d >= 1) return "w";
  if (d >= 0.75) return "hd";
  if (d >= 0.5) return "h";
  if (d >= 0.375) return "qd";
  if (d >= 0.25) return "q";
  if (d >= 0.125) return "8";
  return "16";
}

interface NotePanelProps {
  onSelectionChange: (frequencies: number[]) => void;
  onNotationChange?: (bars: NotationBar[]) => void; // Add optional prop
}

const Note: Component<NotePanelProps> = (props) => {
  const audio = useAudio();
  const playback = usePlayback();

  const [pitch, setPitch] = createSignal("c4");
  const [waveform, setWaveform] = createSignal<WaveformType>("sine");
  const [duration, setDuration] = createSignal<Duration>(DURATIONS.CROTCHET);
  const [bpm, setBpm] = createSignal(120);
  const [keySig, setKeySig] = createSignal("C");
  

  createEffect(() => {
    const freq = getFrequencyFromName(pitch());
    props.onSelectionChange([freq]);
    if (props.onNotationChange) {
      props.onNotationChange([{
        chords: [[freq]],
        timeSignature: "4/4",
        keySignature: keySig(),
        forceDuration: durationToVex(duration()),
      }]);
    }
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
        <KeySignatureSelect id="note-key-sig" value={keySig()} onChange={setKeySig} />
      </Row>
      <Button onClick={play} variant={playback.isPlaying() ? "danger" : "primary"}>
        {playback.isPlaying() ? "■ stop" : "▶ play"}
      </Button>
    </div>
  );
};

export default Note;
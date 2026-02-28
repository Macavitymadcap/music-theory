import type { Component } from "solid-js";
import Row from "./row/Row";
import Field from "../atoms/field/Field";
import Label from "../atoms/label/Label";
import NumberInput from "../atoms/number-input/NumberInput";
import type { WaveformType } from "../../lib/web-audio";
import BpmInput from "./BpmInput";
import PitchSelect from "./PitchSelect";
import WaveformSelect from "./WaveformSelect";
import KeySignatureSelect from "./KeySignatureSelect";

interface ProgressionControlsProps {
  pitch: string;
  onPitchChange: (v: string) => void;
  repeats: number;
  onRepeatsChange: (v: number) => void;
  waveform: WaveformType;
  onWaveformChange: (v: WaveformType) => void;
  bpm: number;
  onBpmChange: (v: number) => void;
  keySig: string;
  onKeySigChange: (v: string) => void;
}

const ProgressionControls: Component<ProgressionControlsProps> = (props) => (
  <div class="progression-controls">
    <Row>
      <PitchSelect id="prog-pitch" value={props.pitch} onChange={props.onPitchChange} />
      <WaveformSelect id="prog-waveform" value={props.waveform} onChange={props.onWaveformChange} />
      <BpmInput id="prog-bpm" value={props.bpm} onChange={props.onBpmChange} />
    </Row>
    <Row>
      <KeySignatureSelect id="prog-key-sig" value={props.keySig} onChange={props.onKeySigChange} />
      <Field>
        <Label for="prog-repeats">repeats</Label>
        <NumberInput id="prog-repeats" value={props.repeats} onChange={props.onRepeatsChange} min={1} max={8} />
      </Field>
    </Row>
  </div>
);

export default ProgressionControls;
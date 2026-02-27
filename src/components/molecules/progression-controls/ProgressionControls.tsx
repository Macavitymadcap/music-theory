import type { Component } from "solid-js";
import Row from "../row/Row";
import PitchSelect from "../../organisms/shared/PitchSelect";
import WaveformSelect from "../../organisms/shared/WaveformSelect";
import BpmInput from "../../organisms/shared/BpmInput";
import Field from "../../atoms/field/Field";
import Label from "../../atoms/label/Label";
import NumberInput from "../../atoms/number-input/NumberInput";
import type { WaveformType } from "../../../lib/web-audio";

interface ProgressionControlsProps {
  pitch: string;
  onPitchChange: (v: string) => void;
  octave: number;
  onOctaveChange: (v: number) => void;
  repeats: number;
  onRepeatsChange: (v: number) => void;
  waveform: WaveformType;
  onWaveformChange: (v: WaveformType) => void;
  bpm: number;
  onBpmChange: (v: number) => void;
}

const ProgressionControls: Component<ProgressionControlsProps> = (props) => (
  <div class="progression-controls">
    <Row>
      <PitchSelect id="prog-pitch" value={props.pitch} onChange={props.onPitchChange} />
      <WaveformSelect id="prog-waveform" value={props.waveform} onChange={props.onWaveformChange} />
    </Row>
    <Row>
      <Field>
        <Label for="prog-octave">octave</Label>
        <NumberInput id="prog-octave" value={props.octave} onChange={props.onOctaveChange} min={0} max={8} />
      </Field>
      <Field>
        <Label for="prog-repeats">repeats</Label>
        <NumberInput id="prog-repeats" value={props.repeats} onChange={props.onRepeatsChange} min={1} max={8} />
      </Field>
      <BpmInput id="prog-bpm" value={props.bpm} onChange={props.onBpmChange} />
    </Row>
  </div>
);

export default ProgressionControls;
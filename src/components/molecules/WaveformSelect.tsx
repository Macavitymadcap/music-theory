import type { Component } from "solid-js";
import Select from "../atoms/select/Select";
import Field from "../atoms/field/Field";
import Label from "../atoms/label/Label";
import type { WaveformType } from "../../lib/web-audio";

const WAVEFORM_OPTIONS = [
  { value: "sine", label: "sine" },
  { value: "sawtooth", label: "sawtooth" },
  { value: "square", label: "square" },
  { value: "triangle", label: "triangle" },
];

interface WaveformSelectProps {
  id: string;
  value: WaveformType;
  onChange: (v: WaveformType) => void;
}

const WaveformSelect: Component<WaveformSelectProps> = (props) => (
  <Field>
    <Label for={props.id}>waveform</Label>
    <Select
      id={props.id}
      value={props.value}
      onChange={(v) => props.onChange(v as WaveformType)}
      options={WAVEFORM_OPTIONS}
    />
  </Field>
);

export default WaveformSelect;
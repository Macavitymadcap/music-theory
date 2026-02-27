import type { Component } from "solid-js";
import NumberInput from "../../atoms/number-input/NumberInput";
import Field from "../../atoms/field/Field";
import Label from "../../atoms/label/Label";

interface BpmInputProps {
  id: string;
  value: number;
  onChange: (v: number) => void;
}

const BpmInput: Component<BpmInputProps> = (props) => (
  <Field>
    <Label for={props.id}>bpm</Label>
    <NumberInput id={props.id} value={props.value} onChange={props.onChange} min={1} max={300} />
  </Field>
);

export default BpmInput;
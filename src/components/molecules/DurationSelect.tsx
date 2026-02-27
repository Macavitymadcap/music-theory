import type { Component } from "solid-js";
import Select from "../atoms/select/Select";
import Field from "../atoms/field/Field";
import Label from "../atoms/label/Label";
import type { Duration } from "../../lib/duration";
import { DURATIONS } from "../../lib/duration";

const DURATION_OPTIONS = [
  { value: String(DURATIONS.SEMIQUAVER), label: "1/16" },
  { value: String(DURATIONS.QUAVER), label: "1/8" },
  { value: String(DURATIONS.CROTCHET), label: "1/4" },
  { value: String(DURATIONS.MINIM), label: "1/2" },
  { value: String(DURATIONS.SEMIBREVE), label: "1" },
  { value: String(DURATIONS.BREVE), label: "2" },
];

interface DurationSelectProps {
  id: string;
  value: Duration;
  onChange: (v: Duration) => void;
}

const DurationSelect: Component<DurationSelectProps> = (props) => (
  <Field>
    <Label for={props.id}>duration</Label>
    <Select
      id={props.id}
      value={String(props.value)}
      onChange={(v) => props.onChange(Number.parseFloat(v) as Duration)}
      options={DURATION_OPTIONS}
    />
  </Field>
);

export default DurationSelect;
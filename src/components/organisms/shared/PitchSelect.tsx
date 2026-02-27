import type { Component } from "solid-js";
import Select from "../../atoms/select/Select";
import Field from "../../atoms/field/Field";
import Label from "../../atoms/label/Label";
import { NOTE_NAMES } from "../../../lib/notes";

const OCTAVES = [0, 1, 2, 3, 4, 5, 6, 7, 8];

const NOTE_DISPLAY: Record<string, string> = {
  c: "C", db: "D♭/C♯", d: "D", eb: "E♭/D♯", e: "E",
  f: "F", gb: "G♭/F♯", g: "G", ab: "A♭/G♯", a: "A",
  bb: "B♭/A♯", b: "B",
};

function buildPitchOptions() {
  const opts: { value: string; label: string }[] = [];
  for (const oct of OCTAVES) {
    for (const name of NOTE_NAMES) {
      opts.push({
        value: `${name}${oct}`,
        label: `${NOTE_DISPLAY[name] ?? name.toUpperCase()}${oct}`,
      });
    }
  }
  return opts;
}

const PITCH_OPTIONS = buildPitchOptions();

interface PitchSelectProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
}

const PitchSelect: Component<PitchSelectProps> = (props) => (
  <Field>
    <Label for={props.id}>pitch</Label>
    <Select
      id={props.id}
      value={props.value}
      onChange={props.onChange}
      options={PITCH_OPTIONS}
    />
  </Field>
);

export default PitchSelect;
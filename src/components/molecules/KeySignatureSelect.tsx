// src/components/molecules/KeySignatureSelect.tsx
import type { Component } from "solid-js";
import Field from "../atoms/field/Field";
import Label from "../atoms/label/Label";
import Select from "../atoms/select/Select";

const KEY_SIG_OPTIONS = [
  // No key sig
  { value: "C", label: "C / Am — no sharps or flats" },
  // Sharps
  { value: "G",  label: "G / Em — 1♯" },
  { value: "D",  label: "D / Bm — 2♯" },
  { value: "A",  label: "A / F♯m — 3♯" },
  { value: "E",  label: "E / C♯m — 4♯" },
  { value: "B",  label: "B / G♯m — 5♯" },
  { value: "F#", label: "F♯ / D♯m — 6♯" },
  { value: "C#", label: "C♯ / A♯m — 7♯" },
  // Flats
  { value: "F",  label: "F / Dm — 1♭" },
  { value: "Bb", label: "B♭ / Gm — 2♭" },
  { value: "Eb", label: "E♭ / Cm — 3♭" },
  { value: "Ab", label: "A♭ / Fm — 4♭" },
  { value: "Db", label: "D♭ / B♭m — 5♭" },
  { value: "Gb", label: "G♭ / E♭m — 6♭" },
  { value: "Cb", label: "C♭ / A♭m — 7♭" },
];

interface KeySignatureSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}

const KeySignatureSelect: Component<KeySignatureSelectProps> = (props) => (
  <Field>
    <Label for={props.id ?? "key-sig"}>key</Label>
    <Select
      id={props.id ?? "key-sig"}
      value={props.value}
      onChange={props.onChange}
      options={KEY_SIG_OPTIONS}
    />
  </Field>
);

export default KeySignatureSelect;
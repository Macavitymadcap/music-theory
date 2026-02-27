import type { Component } from "solid-js";
import { createSignal } from "solid-js";
import Button from "./components/atoms/button/Button";
import Field from "./components/atoms/field/Field";
import Label from "./components/atoms/label/Label";
import NumberInput from "./components/atoms/number-input/NumberInput";
import RadioGroup from "./components/atoms/radio-group/RadioGroup";
import Select from "./components/atoms/select/Select";

import PianoKeyboard from "./components/molecules/piano-keyboard/PianoKeyboard";

const App: Component = () => {
  const [mode, setMode] = createSignal("note");
  const [note, setNote] = createSignal("c4");
  const [bpm, setBpm] = createSignal(120);

  return (
    <div style={{ padding: "2rem", "max-width": "640px", margin: "0 auto" }}>
      <header>
        <h1 style={{ "font-family": "var(--mono)", color: "var(--accent)" }}>
          music theory
        </h1>
      </header>
      <Field>
        <Label>mode</Label>
        <RadioGroup
          name="mode"
          options={[
            { value: "note", label: "note" },
            { value: "scale", label: "scale" },
            { value: "chord", label: "chord" },
          ]}
          value={mode()}
          onChange={setMode}
        />
      </Field>
      <Field>
        <Label for="note-select">note</Label>
        <Select
          id="note-select"
          value={note()}
          onChange={setNote}
          options={[
            { value: "c4", label: "C4" },
            { value: "d4", label: "D4" },
          ]}
        />
      </Field>
      <Field>
        <Label for="bpm-input">bpm</Label>
        <NumberInput id="bpm-input" value={bpm()} onChange={setBpm} min={1} max={300} />
      </Field>
      <Button onClick={() => console.log(mode(), note(), bpm())}>▶ play</Button>
      <PianoKeyboard highlightedFrequencies={[261.63, 329.63, 392]} />
    </div>
  );
};

export default App;
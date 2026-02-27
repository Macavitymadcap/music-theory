import { type Component, createSignal, Switch, Match } from "solid-js";
import RadioGroup from "../../atoms/radio-group/RadioGroup";
import Field from "../../atoms/field/Field";
import Label from "../../atoms/label/Label";
import PianoKeyboard from "../../molecules/piano-keyboard/PianoKeyboard";
import NotePanel from "../note/NotePanel";
import Scale from "../scale-panel/Scale";
import Chord from "../chord/Chord";
import { usePlayback } from "../../../context/PlaybackContext";
import "./ModeShell.css";
import Progression from "../progression/Progression";

type Mode = "note" | "scale" | "chord" | "progression";

const MODE_OPTIONS = [
  { value: "note", label: "note" },
  { value: "scale", label: "scale" },
  { value: "chord", label: "chord" },
  { value: "progression", label: "progression" }
];

const ModeShell: Component = () => {
  const [mode, setMode] = createSignal<Mode>("note");
  const playback = usePlayback();

  // Tracks the full set of frequencies for the current selection —
  // updated by panels via callback, never touched during playback
  const [selectionFrequencies, setSelectionFrequencies] = createSignal<number[]>([]);

  return (
    <div class="mode-shell">
      <Field>
        <Label>mode</Label>
        <RadioGroup
          name="mode"
          options={MODE_OPTIONS}
          value={mode()}
          onChange={(v) => {
            playback.stop();
            setMode(v as Mode);
            setSelectionFrequencies([]);
          }}
        />
      </Field>

      <Switch>
        <Match when={mode() === "note"}>
          <NotePanel onSelectionChange={setSelectionFrequencies} />
        </Match>
        <Match when={mode() === "scale"}>
          <Scale onSelectionChange={setSelectionFrequencies} />
        </Match>
        <Match when={mode() === "chord"}>
          <Chord onSelectionChange={setSelectionFrequencies} />
        </Match>
        <Match when={mode() === "progression"}>
          <Progression onSelectionChange={setSelectionFrequencies} />
        </Match>
      </Switch>

      <PianoKeyboard
        highlightedFrequencies={playback.currentFrequencies()}
        rangeFrequencies={selectionFrequencies()}
      />
    </div>
  );
};

export default ModeShell;
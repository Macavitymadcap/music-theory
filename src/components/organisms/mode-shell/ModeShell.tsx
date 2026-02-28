import { type Component, createSignal, Switch, Match, createMemo } from "solid-js";
import RadioGroup from "../../atoms/radio-group/RadioGroup";
import Field from "../../atoms/field/Field";
import Label from "../../atoms/label/Label";
import PianoKeyboard from "../../molecules/piano-keyboard/PianoKeyboard";
import Note from "../note/Note";
import Scale from "../scale/Scale";
import Chord from "../chord/Chord";
import Progression from "../progression/Progression";
import Notation from "../../molecules/notation/Notation";
import { usePlayback } from "../../../context/PlaybackContext";
import type { NotationBar } from "../../../lib/notation";
import "./ModeShell.css";
import CheatSheet from "../cheat-sheet/CheatSheet";

type Mode = "note" | "scale" | "chord" | "progression" | "cheetsheats";

const MODE_OPTIONS = [
  { value: "note", label: "note" },
  { value: "scale", label: "scale" },
  { value: "chord", label: "chord" },
  { value: "progression", label: "progression" },
  { value: "cheetsheats", label: "cheat sheets" }
];

const ModeShell: Component = () => {
  const [mode, setMode] = createSignal<Mode>("note");
  const playback = usePlayback();

  const [selectionFrequencies, setSelectionFrequencies] = createSignal<number[]>([]);
  const [progressionBars, setProgressionBars] = createSignal<NotationBar[]>([]);
  const [scaleBars, setScaleBars] = createSignal<NotationBar[]>([]);

  const notationBars = createMemo<NotationBar[]>(() => {
    if (mode() === "progression") return progressionBars();
    // For note, scale, chord: always use scaleBars (set by panel's onNotationChange)
    return scaleBars();
  });

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
            // Do NOT reset selectionFrequencies here — the incoming panel's
            // createEffect will update it on mount, avoiding a blank notation flash
            setMode(v as Mode);
          }}
        />
      </Field>

      <Switch>
        <Match when={mode() === "note"}>
          <Note
            onSelectionChange={setSelectionFrequencies}
            onNotationChange={setScaleBars} // Use setScaleBars for note/chord notation
          />
        </Match>
        <Match when={mode() === "scale"}>
          <Scale
            onSelectionChange={setSelectionFrequencies}
            onNotationChange={setScaleBars}
          />
        </Match>
        <Match when={mode() === "chord"}>
          <Chord
            onSelectionChange={setSelectionFrequencies}
            onNotationChange={setScaleBars}
          />
        </Match>
        <Match when={mode() === "progression"}>
          <Progression
            onSelectionChange={setSelectionFrequencies}
            onNotationChange={setProgressionBars}
          />
        </Match>
        <Match when={mode() === "cheetsheats"}>
          <CheatSheet />
        </Match>
      </Switch>

      <Notation bars={notationBars()} label="notation" />

      <PianoKeyboard
        highlightedFrequencies={playback.currentFrequencies()}
        rangeFrequencies={selectionFrequencies()}
      />
    </div>
  );
};

export default ModeShell;
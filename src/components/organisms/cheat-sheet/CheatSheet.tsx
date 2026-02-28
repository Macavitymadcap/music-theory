import { createSignal, Match, Switch } from "solid-js";
import "./CheatSheet.css";
import CircleOfFifths from "../../molecules/circle-of-fifths/CircleOfFifths";
import IntervalReference from "../../molecules/interval-reference/IntervalReference";
import KeySignatures from "../../molecules/key-signatures/KeySignatures";
import NoteReading from "../../molecules/note-reading/NoteReading";
import ScaleDegrees from "../../molecules/scale-degrees/ScaleDegrees";
import RadioGroup from "../../atoms/radio-group/RadioGroup";
import Field from "../../atoms/field/Field";
import Label from "../../atoms/label/Label";

type Tab = "circle" | "keys" | "reading" | "intervals" | "degrees";

const TABS: { id: Tab; label: string }[] = [
  { id: "circle",    label: "Circle of 5ths" },
  { id: "keys",      label: "Key Signatures" },
  { id: "reading",   label: "Note Reading"   },
  { id: "intervals", label: "Intervals"      },
  { id: "degrees",   label: "Scale Degrees"  },
];

export default function CheatSheet() {
  const [activeTab, setActiveTab] = createSignal<Tab>("circle");

  return (
    <div class="cheat-sheet" aria-label="Music theory cheat sheets">
      <Field>
        <Label>Cheat Sheet</Label>
        <RadioGroup
          name="cheat-sheet-tabs"
          options={TABS.map(tab => ({ value: tab.id, label: tab.label }))}
          value={activeTab()}
          onChange={v => setActiveTab(v as Tab)}
        />
      </Field>

      <div
        class="cheat-sheet__content"
        role="tabpanel"
        id={`cs-panel-${activeTab()}`}
        aria-labelledby={`cs-tab-${activeTab()}`}
      >
        <Switch>
          <Match when={activeTab() === "circle"}>
            <CircleOfFifths />
          </Match>
          <Match when={activeTab() === "keys"}>
            <KeySignatures />
          </Match>
          <Match when={activeTab() === "reading"}>
            <NoteReading />
          </Match>
          <Match when={activeTab() === "intervals"}>
            <IntervalReference />
          </Match>
          <Match when={activeTab() === "degrees"}>
            <ScaleDegrees />
          </Match>
        </Switch>
      </div>
    </div>
  );
}
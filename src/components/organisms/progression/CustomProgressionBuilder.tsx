import { type Component, createSignal, For } from "solid-js";
import Field from "../../atoms/field/Field";
import Label from "../../atoms/label/Label";
import Select from "../../atoms/select/Select";
import NumberInput from "../../atoms/number-input/NumberInput";
import Button from "../../atoms/button/Button";
import StepBadge from "../../atoms/step-badge/StepBadge";
import Row from "../../molecules/row/Row";
import { DEGREE_OPTIONS, type ProgressionStep } from "../../../lib/progressions";
import { CHORD_GROUPS, CHORD_DISPLAY_NAMES, type ChordType } from "../../../lib/chords";

const DEGREE_SELECT_OPTIONS = DEGREE_OPTIONS.map((d) => ({
  value: d.label,
  label: d.label,
}));

const CHORD_GROUPS_FOR_SELECT = CHORD_GROUPS.map((g) => ({
  label: g.label,
  options: g.chords.map((c) => ({ value: c, label: CHORD_DISPLAY_NAMES[c] })),
}));

interface CustomProgressionBuilderProps {
  steps: ProgressionStep[];
  onStepsChange: (steps: ProgressionStep[]) => void;
}

const CustomProgressionBuilder: Component<CustomProgressionBuilderProps> = (props) => {
  const [degree, setDegree] = createSignal(DEGREE_OPTIONS[0].label);
  const [chordType, setChordType] = createSignal<ChordType>("majorTriad");
  const [bars, setBars] = createSignal(1);

  function addStep() {
    const selected = DEGREE_OPTIONS.find((d) => d.label === degree())!;
    const newStep: ProgressionStep = {
      label: selected.label,
      semitones: selected.semitones,
      chordType: chordType(),
      bars: bars(),
      hitsPerBar: 1,
    };
    props.onStepsChange([...props.steps, newStep]);
  }

  function removeStep(index: number) {
    props.onStepsChange(props.steps.filter((_, i) => i !== index));
  }

  return (
    <div class="custom-progression-builder">
      <Row>
        <Field>
          <Label for="builder-degree">degree</Label>
          <Select
            id="builder-degree"
            value={degree()}
            onChange={setDegree}
            options={DEGREE_SELECT_OPTIONS}
          />
        </Field>
        <Field>
          <Label for="builder-chord">chord</Label>
          <Select
            id="builder-chord"
            value={chordType()}
            onChange={(v) => setChordType(v as ChordType)}
            groups={CHORD_GROUPS_FOR_SELECT}
          />
        </Field>
        <Field>
          <Label for="builder-bars">bars</Label>
          <NumberInput id="builder-bars" value={bars()} onChange={setBars} min={1} max={8} />
        </Field>
      </Row>
      <Button variant="ghost" onClick={addStep}>+ add step</Button>
      <div class="custom-progression-builder__steps">
        <For each={props.steps}>
          {(step, i) => (
            <StepBadge
              label={step.label}
              chord={CHORD_DISPLAY_NAMES[step.chordType]}
              bars={step.bars}
              onRemove={() => removeStep(i())}
            />
          )}
        </For>
      </div>
    </div>
  );
};

export default CustomProgressionBuilder;
import { type Component, For } from "solid-js";
import Field from "../../atoms/field/Field";
import Label from "../../atoms/label/Label";
import Select from "../../atoms/select/Select";
import StepBadge from "../../atoms/step-badge/StepBadge";
import { PROGRESSION_PRESETS } from "../../../lib/progressions";
import { CHORD_DISPLAY_NAMES } from "../../../lib/chords";

const PRESET_OPTIONS = PROGRESSION_PRESETS.map((p) => ({
  value: p.name,
  label: p.name,
}));

interface PresetProgressionProps {
  value: string;
  onChange: (name: string) => void;
}

const PresetProgression: Component<PresetProgressionProps> = (props) => {
  const preset = () =>
    PROGRESSION_PRESETS.find((p) => p.name === props.value) ?? PROGRESSION_PRESETS[0];

  return (
    <div class="preset-progression">
      <Field>
        <Label for="preset-select">preset</Label>
        <Select
          id="preset-select"
          value={props.value}
          onChange={props.onChange}
          options={PRESET_OPTIONS}
        />
      </Field>
      <div class="preset-progression__description">{preset().description}</div>
      <div class="preset-progression__steps">
        <For each={preset().steps}>
          {(step) => (
            <StepBadge
              label={step.label}
              chord={CHORD_DISPLAY_NAMES[step.chordType]}
              bars={step.bars}
            />
          )}
        </For>
      </div>
    </div>
  );
};

export default PresetProgression;
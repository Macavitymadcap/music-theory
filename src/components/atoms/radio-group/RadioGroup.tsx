import type { Component } from "solid-js";
import { For } from "solid-js";
import "./RadioGroup.css";

export interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
}

const RadioGroup: Component<RadioGroupProps> = (props) => {
  return (
    <div class="radio-group">
      <For each={props.options}>
        {(opt) => {
          const id = `${props.name}-${opt.value}`;
          return (
            <>
              <input
                type="radio"
                name={props.name}
                id={id}
                value={opt.value}
                checked={props.value === opt.value}
                onChange={() => props.onChange(opt.value)}
              />
              <label for={id}>{opt.label}</label>
            </>
          );
        }}
      </For>
    </div>
  );
};

export default RadioGroup;
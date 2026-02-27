import type { Component } from "solid-js";
import "./NumberInput.css";

interface NumberInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const NumberInput: Component<NumberInputProps> = (props) => {
  return (
    <input
      id={props.id}
      type="number"
      class="number-input"
      value={props.value}
      min={props.min}
      max={props.max}
      step={props.step ?? 1}
      onInput={(e) => {
        const val = Number.parseInt(e.currentTarget.value, 10);
        if (!Number.isNaN(val)) props.onChange(val);
      }}
    />
  );
};

export default NumberInput;
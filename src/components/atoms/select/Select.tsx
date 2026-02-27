import type { Component } from "solid-js";
import { For } from "solid-js";
import "./Select.css";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface SelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
}

const Select: Component<SelectProps> = (props) => {
  return (
    <select
      id={props.id}
      class="select"
      value={props.value}
      onChange={(e) => props.onChange(e.currentTarget.value)}
    >
      {props.groups ? (
        <For each={props.groups}>
          {(group) => (
            <optgroup label={group.label}>
              <For each={group.options}>
                {(opt) => (
                  <option value={opt.value} selected={opt.value === props.value}>
                    {opt.label}
                  </option>
                )}
              </For>
            </optgroup>
          )}
        </For>
      ) : (
        <For each={props.options ?? []}>
          {(opt) => (
            <option value={opt.value} selected={opt.value === props.value}>
              {opt.label}
            </option>
          )}
        </For>
      )}
    </select>
  );
};

export default Select;
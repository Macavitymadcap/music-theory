import type { Component } from "solid-js";
import { Show } from "solid-js";
import "./StepBadge.css";

interface StepBadgeProps {
  label: string;
  chord: string;
  bars: number;
  onRemove?: () => void;
}

const StepBadge: Component<StepBadgeProps> = (props) => (
  <div class="step-badge">
    <span class="step-badge__degree">{props.label}</span>
    <span class="step-badge__chord">{props.chord}</span>
    <span class="step-badge__bars">{props.bars}b</span>
    <Show when={props.onRemove}>
      <button class="step-badge__remove" onClick={props.onRemove} aria-label="remove step">
        ×
      </button>
    </Show>
  </div>
);

export default StepBadge;
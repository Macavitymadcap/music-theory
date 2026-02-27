import type { Component } from "solid-js";
import { Show } from "solid-js";
import { midiToDisplayName, midiToOctave } from "../../../lib/midi";
import "./PianoKey.css";

interface PianoKeyProps {
  midi: number;
  isBlack: boolean;
  isActive: boolean;
  leftPercent?: number;
}

const PianoKey: Component<PianoKeyProps> = (props) => {
  return (
    <div
      class={`piano-key ${props.isBlack ? "piano-key--black" : "piano-key--white"} ${props.isActive ? "piano-key--active" : ""}`}
      style={props.isBlack ? { left: `${props.leftPercent}%` } : undefined}
      title={midiToDisplayName(props.midi)}
      tabIndex={-1}
      aria-label={midiToDisplayName(props.midi)}
    >
      <Show when={!props.isBlack && props.midi % 12 === 0}>
        <span class="piano-key__octave-marker">
          C{midiToOctave(props.midi)}
        </span>
      </Show>
    </div>
  );
};

export default PianoKey;
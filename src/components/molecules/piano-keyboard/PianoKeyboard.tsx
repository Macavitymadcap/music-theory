import type { Component } from "solid-js";
import { For, createMemo } from "solid-js";
import PianoKey from "../../atoms/piano-key/PianoKey";
import {
  frequencyToMidi,
  computeMidiRange,
  buildKeyDescriptors,
} from "../../../lib/midi";
import "./PianoKeyboard.css";

interface PianoKeyboardProps {
  highlightedFrequencies: number[];
}

const PianoKeyboard: Component<PianoKeyboardProps> = (props) => {
  // Derive active MIDI set from frequencies
  const activeMidis = createMemo(() =>
    new Set(props.highlightedFrequencies.map(frequencyToMidi))
  );

  // Derive MIDI range from active midis — only changes when range shifts
  const range = createMemo(() => computeMidiRange([...activeMidis()]));

  // Derive key descriptors — only changes when range changes
  const keys = createMemo(() => buildKeyDescriptors(range().low, range().high));

  const whiteCount = createMemo(() => keys().whiteKeys.length);

  return (
    <div class="piano-keyboard">
      <span class="piano-keyboard__label">keyboard</span>
      <div
        class="piano-keyboard__keys"
        style={{ "--white-count": whiteCount() }}
      >
        <For each={keys().whiteKeys}>
          {(key) => (
            <PianoKey
              midi={key.midi}
              isBlack={false}
              isActive={activeMidis().has(key.midi)}
            />
          )}
        </For>
        <For each={keys().blackKeys}>
          {(key) => (
            <PianoKey
              midi={key.midi}
              isBlack={true}
              isActive={activeMidis().has(key.midi)}
              leftPercent={key.leftPercent}
            />
          )}
        </For>
      </div>
    </div>
  );
};

export default PianoKeyboard;
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
  rangeFrequencies: number[];
}

const PianoKeyboard: Component<PianoKeyboardProps> = (props) => {
  const activeMidis = createMemo(() =>
    new Set(props.highlightedFrequencies.map(frequencyToMidi))
  );

  // Range driven only by rangeFrequencies — never by highlighted
  const range = createMemo(() =>
    computeMidiRange(props.rangeFrequencies.map(frequencyToMidi))
  );

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
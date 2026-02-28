import { For } from "solid-js";

const STAFF_W = 100;
const STAFF_H = 44;
const LINE_SPACING = 7;
const STAFF_TOP = 8;

const CLEF_FONT_SIZE = 22;
const CLEF_X = 10;
const CLEF_Y = STAFF_TOP + 22;

const ACCIDENTAL_X_START = 32;
const ACCIDENTAL_X_STEP = 9;

const KEY_SIGS: Record<string, { type: "sharp" | "flat"; notes: string[] }> = {
  "C":  { type: "sharp", notes: [] },
  "G":  { type: "sharp", notes: ["F"] },
  "D":  { type: "sharp", notes: ["F", "C"] },
  "A":  { type: "sharp", notes: ["F", "C", "G"] },
  "E":  { type: "sharp", notes: ["F", "C", "G", "D"] },
  "B":  { type: "sharp", notes: ["F", "C", "G", "D", "A"] },
  "F#": { type: "sharp", notes: ["F", "C", "G", "D", "A", "E"] },
  "C#": { type: "sharp", notes: ["F", "C", "G", "D", "A", "E", "B"] },
  "F":  { type: "flat",  notes: ["Bb"] },
  "Bb": { type: "flat",  notes: ["Bb", "Eb"] },
  "Eb": { type: "flat",  notes: ["Bb", "Eb", "Ab"] },
  "Ab": { type: "flat",  notes: ["Bb", "Eb", "Ab", "Db"] },
  "Db": { type: "flat",  notes: ["Bb", "Eb", "Ab", "Db", "Gb"] },
  "Gb": { type: "flat",  notes: ["Bb", "Eb", "Ab", "Db", "Gb", "Cb"] },
  "Cb": { type: "flat",  notes: ["Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb"] },
  // Add enharmonic equivalents:
  "D#": { type: "sharp", notes: ["F", "C", "G", "D", "A", "E", "B"] }, // same as C#
  "G#": { type: "sharp", notes: ["F", "C", "G", "D", "A", "E"] }, // same as F#
  "A#": { type: "sharp", notes: ["F", "C", "G", "D", "A"] }, // same as B
  "E#": { type: "sharp", notes: ["F", "C", "G", "D"] }, // same as E
  "B#": { type: "sharp", notes: ["F", "C", "G"] }, // same as A
  "Fb": { type: "flat", notes: ["Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb"] }, // same as Cb
};

const SHARP_POSITIONS_TREBLE: Record<NoteName, number | undefined> = {
  F: 3, C: 0, G: 4, D: 1, A: 5, E: 2, B: 6,
  Bb: undefined, Eb: undefined, Ab: undefined, Db: undefined, Gb: undefined, Cb: undefined, Fb: undefined
};
const FLAT_POSITIONS_TREBLE: Record<NoteName, number | undefined> = {
  Bb: 6, Eb: 2, Ab: 5, Db: 1, Gb: 4, Cb: 0, Fb: 3,
  F: undefined, C: undefined, G: undefined, D: undefined, A: undefined, E: undefined, B: undefined
};

type NoteName =
  | "F" | "C" | "G" | "D" | "A" | "E" | "B"
  | "Bb" | "Eb" | "Ab" | "Db" | "Gb" | "Cb" | "Fb";

function accidentalY(note: NoteName, type: "sharp" | "flat", clef: "treble" | "bass") {
  const pos = type === "sharp"
    ? SHARP_POSITIONS_TREBLE[note]
    : FLAT_POSITIONS_TREBLE[note];
  // Fallback to STAFF_TOP if pos is undefined
  return STAFF_TOP + (typeof pos === "number" ? pos : 0);
}

interface StaffSVGProps {
  keySignature: string; // e.g. "G", "F", "Bb"
  clef?: "treble" | "bass";
  width?: number;
  height?: number;
  style?: any;
}

export default function StaffSVG(props: Readonly<StaffSVGProps>) {
  const keySig = KEY_SIGS[props.keySignature] ?? KEY_SIGS["C"];
  const clef = props.clef ?? "treble";
  const width = props.width ?? STAFF_W;
  const height = props.height ?? STAFF_H;
  const lines = [0, 1, 2, 3, 4].map(i => STAFF_TOP + i * LINE_SPACING);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={props.style}
      aria-label={`${props.keySignature} key signature staff`}
    >
      {/* Staff lines */}
      <For each={lines}>
        {(y) => (
          <line
            x1={6}
            y1={y}
            x2={width - 6}
            y2={y}
            stroke="var(--border)"
            stroke-width="1"
          />
        )}
      </For>
      {/* Clef */}
      <text
        x={CLEF_X}
        y={CLEF_Y}
        font-size={`${CLEF_FONT_SIZE}`}
        fill="var(--text)"
        dominant-baseline="central"
      >
        {clef === "treble" ? "𝄞" : "𝄢"}
      </text>
      {/* Key signature accidentals */}
      <For each={keySig.notes}>
        {(note, i) => (
          <text
            x={ACCIDENTAL_X_START + i() * ACCIDENTAL_X_STEP}
            y={accidentalY(note as NoteName, keySig.type, clef) + 6}
            font-size="16"
            fill="var(--accent)"
            dominant-baseline="middle"
          >
            {keySig.type === "sharp" ? "♯" : "♭"}
          </text>
        )}
      </For>
    </svg>
  );
}
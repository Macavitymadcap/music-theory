// src/components/molecules/note-reading/NoteReading.tsx
//
// Colours unified with the notation dark theme:
//   Staff lines  → var(--border)        (#2a2a30)
//   Note heads   → var(--text)          (#d4d4d8)
//   Highlighted  → var(--accent)        (#4a6)
//   Background   → var(--surface)       (#161619)
//   Labels       → var(--text-muted)    (#71717a)

import { createSignal, For, Show } from "solid-js";
import {
  TREBLE_LINES,
  TREBLE_SPACES,
  BASS_LINES,
  BASS_SPACES,
  type StaffNote,
} from "../../../lib/cheat-sheets";
import Field from "../../atoms/field/Field";
import Label from "../../atoms/label/Label";
import RadioGroup from "../../atoms/radio-group/RadioGroup";
import "./NoteReading.css";

// ── SVG staff constants ────────────────────────────────────────────────────

const STAFF_W = 300;
const STAFF_H = 110;
const LINE_SPACING = 12;
const STAFF_TOP = 24;
const NOTE_R = 7;

// Colour tokens (mirroring tokens.css values — SVG can't use CSS variables
// in attribute values, only in style properties on supported elements)
const C_INK    = "var(--text)";       // noteheads, stems, clef
const C_STAFF  = "var(--border)";     // staff lines
const C_ACCENT = "var(--accent)";     // highlighted note
const C_MUTED  = "var(--text-muted)"; // note name labels below staff

// ── Staff SVG component ────────────────────────────────────────────────────

interface StaffProps {
  notes: StaffNote[];
  clef: "treble" | "bass";
  highlighted: StaffNote | null;
}

function Staff(props: Readonly<StaffProps>) {
  const lines = [0, 1, 2, 3, 4].map((i) => STAFF_TOP + i * LINE_SPACING);
  const bottomLine = lines[4];

  function noteY(pos: number, onLine: boolean): number {
    const step = LINE_SPACING / 2;
    const halfSteps = onLine ? (pos - 1) * 2 : (pos - 1) * 2 + 1;
    return bottomLine - halfSteps * step;
  }

  return (
    <svg
      viewBox={`0 0 ${STAFF_W} ${STAFF_H}`}
      width={STAFF_W}
      height={STAFF_H}
      class="note-reading__staff"
      aria-label={`${props.clef} clef staff`}
    >
      {/* Staff lines */}
      <For each={lines}>
        {(y) => (
          <line
            x1="20" y1={y} x2={STAFF_W - 20} y2={y}
            stroke={C_STAFF}
            stroke-width="1"
          />
        )}
      </For>

      {/* Clef glyph */}
      <text
        x="28"
        y={props.clef === "treble" ? STAFF_TOP + 36 : STAFF_TOP + 24}
        font-size={props.clef === "treble" ? "44" : "28"}
        fill={C_INK}
        dominant-baseline="central"
      >
        {props.clef === "treble" ? "𝄞" : "𝄢"}
      </text>

      {/* Note markers */}
      <For each={props.notes}>
        {(note, i) => {
          const x = 80 + i() * 32;
          const y = noteY(note.position, note.onLine);
          const active = () => props.highlighted?.note === note.note;
          const colour = () => active() ? C_ACCENT : C_INK;

          return (
            <g>
              <ellipse
                cx={x} cy={y}
                rx={NOTE_R} ry={NOTE_R * 0.75}
                fill={colour()}
                stroke={colour()}
                stroke-width="0"
                style={{ transition: "fill 0.15s ease" }}
              />
              {/* Stem */}
              <line
                x1={x + NOTE_R} y1={y}
                x2={x + NOTE_R} y2={y - LINE_SPACING * 2.5}
                stroke={colour()}
                stroke-width="1.5"
              />
              {/* Note name label below staff */}
              <text
                x={x} y={STAFF_H - 4}
                text-anchor="middle"
                font-size="9"
                fill={active() ? C_ACCENT : C_MUTED}
              >
                {note.label}
              </text>
            </g>
          );
        }}
      </For>
    </svg>
  );
}

// ── Note list ──────────────────────────────────────────────────────────────

interface NoteListProps {
  notes: StaffNote[];
  onHover: (n: StaffNote | null) => void;
  hovered: StaffNote | null;
}

function NoteList(props: Readonly<NoteListProps>) {
  return (
    <ul class="note-reading__list">
      <For each={props.notes}>
        {(note) => (
          <li>
            <button
              type="button"
              class={`note-reading__item${
                props.hovered?.note === note.note ? " note-reading__item--active" : ""
              }`}
              onMouseEnter={() => props.onHover(note)}
              onMouseLeave={() => props.onHover(null)}
              onFocus={() => props.onHover(note)}
              onBlur={() => props.onHover(null)}
              aria-label={note.label + (note.mnemonic ? " — " + note.mnemonic : "")}
            >
              <span class="note-reading__note-label">{note.label}</span>
              <Show when={note.mnemonic}>
                <span class="note-reading__mnemonic">{note.mnemonic}</span>
              </Show>
            </button>
          </li>
        )}
      </For>
    </ul>
  );
}

// ── Clef section ───────────────────────────────────────────────────────────

interface ClefSectionProps {
  label: string;
  lines: StaffNote[];
  spaces: StaffNote[];
  clef: "treble" | "bass";
}

function ClefSection(props: Readonly<ClefSectionProps>) {
  const [view, setView] = createSignal<"lines" | "spaces">("lines");
  const [hovered, setHovered] = createSignal<StaffNote | null>(null);

  const notes = () => (view() === "lines" ? props.lines : props.spaces);

  const mnemonicHint = () => {
    if (view() === "lines") {
      return props.clef === "treble"
        ? "Every Good Boy Does Fine"
        : "Good Boys Do Fine Always";
    }
    return props.clef === "treble" ? "Spaces spell FACE" : "All Cows Eat Grass";
  };

  return (
    <section class="note-reading__section" aria-label={props.label}>
      <Field>
        <Label>{props.label}</Label>
        <RadioGroup
          name={`${props.clef}-lines-spaces`}
          options={[
            { value: "lines", label: "Lines" },
            { value: "spaces", label: "Spaces" },
          ]}
          value={view()}
          onChange={(v) => setView(v as "lines" | "spaces")}
        />
      </Field>

      <Staff notes={notes()} clef={props.clef} highlighted={hovered()} />
      <NoteList notes={notes()} onHover={setHovered} hovered={hovered()} />

      <p class="note-reading__mnemonic-hint">{mnemonicHint()}</p>
    </section>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────

export default function NoteReading() {
  return (
    <div class="note-reading">
      <ClefSection
        label="Treble Clef"
        lines={TREBLE_LINES}
        spaces={TREBLE_SPACES}
        clef="treble"
      />
      <ClefSection
        label="Bass Clef"
        lines={BASS_LINES}
        spaces={BASS_SPACES}
        clef="bass"
      />
    </div>
  );
}
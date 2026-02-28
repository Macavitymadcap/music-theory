import { createSignal, createMemo } from "solid-js";
import { CIRCLE_OF_FIFTHS, KeyInfo } from "../../../lib/cheat-sheets";
import Field from "../../atoms/field/Field";
import Label from "../../atoms/label/Label";
import "./CircleOfFifths.css"

const SVG_SIZE = 320;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;

const R_OUTER = 140;
const R_MAJOR = 108;
const R_MINOR = 72;
const R_CENTER = 40;

const DEG_TO_RAD = Math.PI / 180;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * DEG_TO_RAD;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(
  cx: number, cy: number,
  innerR: number, outerR: number,
  startAngle: number, endAngle: number
): string {
  const p1 = polarToCartesian(cx, cy, outerR, startAngle);
  const p2 = polarToCartesian(cx, cy, outerR, endAngle);
  const p3 = polarToCartesian(cx, cy, innerR, endAngle);
  const p4 = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

function accidentalLabel(key: KeyInfo): string {
  if (key.accidentals === 0) return "No accidentals";
  const sym = key.accidentalType === "sharp" ? "♯" : "♭";
  return `${key.accidentals} ${sym}${key.accidentals > 1 ? "s" : ""}`;
}

function normalizeKeyName(key: string) {
  return key.replace("♭", "b").replace("♯", "#");
}

export default function CircleOfFifths() {
  const [selected, setSelected] = createSignal<string>("C");
  const [hovered, setHovered] = createSignal<string | null>(null);

  const displayedKey = createMemo(() =>
    CIRCLE_OF_FIFTHS.find((k) => normalizeKeyName(k.name) === (hovered() || selected())) ?? CIRCLE_OF_FIFTHS[0]
  );

  hovered();
  selected();
  return (
    <div class="circle-of-fifths">
      <svg
        class="circle-of-fifths__svg"
        width={SVG_SIZE}
        height={SVG_SIZE}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        aria-label="Circle of fifths"
      >
        {/* Major wedges */}
        {CIRCLE_OF_FIFTHS.map((key, i) => {
          const startAngle = key.angle;
          const endAngle = key.angle + 30;
          const normalizedName = normalizeKeyName(key.name);
          const isSelected = selected() === normalizedName;
          const isHovered = hovered() === normalizedName;
          return (
            <path
              class={`circle-of-fifths__wedge${isSelected ? " circle-of-fifths__wedge--selected" : ""}${isHovered ? " circle-of-fifths__wedge--hovered" : ""}`}
              d={wedgePath(CX, CY, R_MAJOR, R_OUTER, startAngle, endAngle)}
              tabIndex={0}
              aria-label={key.major}
              onClick={() => setSelected(normalizeKeyName(key.name))}
              onMouseEnter={() => setHovered(normalizeKeyName(key.name))}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        {/* Major key labels */}
        {CIRCLE_OF_FIFTHS.map((key) => {
          const angle = key.angle + 15;
          const pos = polarToCartesian(CX, CY, (R_MAJOR + R_OUTER) / 2, angle);
          return (
            <text
              x={pos.x}
              y={pos.y}
              class="circle-of-fifths__key-name"
              text-anchor="middle"
              alignment-baseline="middle"
            >
              {key.major}
            </text>
          );
        })}
        {/* Minor key labels */}
        {CIRCLE_OF_FIFTHS.map((key) => {
          const angle = key.angle + 15;
          const pos = polarToCartesian(CX, CY, (R_MINOR + R_MAJOR) / 2, angle);
          return (
            <text
              x={pos.x}
              y={pos.y}
              class="circle-of-fifths__minor-name"
              text-anchor="middle"
              alignment-baseline="middle"
            >
              {key.minor}
            </text>
          );
        })}
        {/* Center circle */}
        <circle cx={CX} cy={CY} r={R_CENTER} class="circle-of-fifths__center" />
      </svg>

      <Field>
        <Label>Selected Key</Label>
        <div class="circle-of-fifths__info">
          <span class="circle-of-fifths__key-name">{displayedKey().major}</span>
          <span class="circle-of-fifths__sep">/</span>
          <span class="circle-of-fifths__minor-name">{displayedKey().minor}</span>
          <span class="circle-of-fifths__accidentals">{accidentalLabel(displayedKey())}</span>
        </div>
      </Field>
    </div>
  );
}
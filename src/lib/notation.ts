import { Stave, StaveNote, Voice, Formatter, Renderer, Accidental } from "vexflow";

const SEMITONE_TO_VEX: Record<number, { key: string; accidental?: string }> = {
  0:  { key: "c" },
  1:  { key: "c", accidental: "#" },
  2:  { key: "d" },
  3:  { key: "d", accidental: "#" },
  4:  { key: "e" },
  5:  { key: "f" },
  6:  { key: "f", accidental: "#" },
  7:  { key: "g" },
  8:  { key: "g", accidental: "#" },
  9:  { key: "a" },
  10: { key: "a", accidental: "#" },
  11: { key: "b" },
};

export interface VexNote {
  key: string;
  accidental?: string;
  duration: string;
}

export function frequencyToVexKey(freq: number): VexNote {
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const semitone = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  const entry = SEMITONE_TO_VEX[semitone] ?? { key: "c" };
  const key = `${entry.key}${entry.accidental ?? ""}/${octave}`;
  return { key, accidental: entry.accidental, duration: "q" };
}

export function frequenciesToStaveNote(
  frequencies: number[],
  duration = "q"
): StaveNote {
  const vexNotes = frequencies.map(frequencyToVexKey);
  const keys = vexNotes.map((n) => n.key);
  const note = new StaveNote({ keys, duration });
  vexNotes.forEach((vn, i) => {
    if (vn.accidental) {
      note.addModifier(new Accidental(vn.accidental), i);
    }
  });
  return note;
}

export interface NotationBar {
  chords: number[][];
  timeSignature?: string;
  keySignature?: string;
  label?: string;
  /** How many musical bars this step spans */
  bars?: number;
  /** Override note count for duration calculation (e.g. scale with 7 notes) */
  noteCount?: number;
  /** Explicit VexFlow duration string — overrides getDuration calculation */
  forceDuration?: string;
}

export interface RenderNotationOptions {
  width?: number;
  /** CSS colour string for notation ink. Defaults to "#d4d4d8" (tokens --text). */
  inkColour?: string;
  /** CSS colour string for staff lines. Defaults to "#2a2a30" (tokens --border). */
  staffColour?: string;
}

// Layout constants
const MIN_BAR_PX = 120;
const CLEF_PX = 40;
const TIME_SIG_PX = 30;
const KEY_SIG_PX = 20; // approximate width per accidental in key signature
const NOTE_AREA_MARGIN = 15;
const ROW_HEIGHT = 110;
const STAVE_Y_OFFSET = 25;
const LABEL_Y_OFFSET = 90;
const H_PADDING = 10;

/**
 * Apply dark-theme colours to a VexFlow SVG element.
 */
function applyDarkTheme(
  svg: SVGSVGElement,
  inkColour: string,
  staffColour: string
): void {
  svg.style.background = "transparent";

  // Set root-level inherited defaults → all ink (noteheads, stems, clef, etc.)
  svg.setAttribute("fill",   inkColour);
  svg.setAttribute("stroke", inkColour);

  // Override stave lines to use the subtler staff colour
  svg.querySelectorAll<SVGGElement>("g.vf-stave").forEach((g) => {
    // Each child path is a staff line — stroke comes from parent/root inheritance,
    // so we set stroke directly on the <g> to override the root value
    g.setAttribute("stroke", staffColour);
  });

  // Barlines use the stave colour too
  svg.querySelectorAll<SVGGElement>("g.vf-stavebarline").forEach((g) => {
    g.setAttribute("fill", staffColour);
  });

  // Ledger lines have an explicit stroke="#444" that overrides the root value
  // — replace that with inkColour so they're fully visible
  svg.querySelectorAll<SVGPathElement>("g.vf-stavenote > path[stroke]").forEach((p) => {
    p.setAttribute("stroke", inkColour);
  });
}

/**
 * Render notation into a container using VexFlow.
 * Bars wrap into rows like text — as many bars per row as fit, then a new row.
 * The SVG grows vertically to fit all rows. Container should be overflow-y: auto.
 * Returns a cleanup function.
 */
export function renderNotation(
  container: HTMLDivElement,
  bars: NotationBar[],
  options: RenderNotationOptions = {}
): () => void {
  while (container.firstChild) container.firstChild.remove();
  if (!bars.length) return () => {};

  const {
    inkColour  = "#d4d4d8",   // --text
    staffColour = "#71717a",  // --text-muted — visible against --surface (#161619)
  } = options;

  const containerWidth = options.width ?? container.clientWidth ?? 600;
  const usableWidth = containerWidth - H_PADDING * 2;

  const slots = createBarSlots(bars);
  const idealBarWidth = calculateIdealBarWidth(bars, slots.length, usableWidth);
  const rows = packSlotsIntoRows(slots, idealBarWidth, containerWidth);

  const totalHeight = rows.length * ROW_HEIGHT + 20;
  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(containerWidth, totalHeight);
  const context = renderer.getContext();
  context.setFont("Arial", 10);

  renderRows(rows, context, idealBarWidth);

  // Apply dark theme to the rendered SVG
  const svg = container.querySelector("svg");
  if (svg) {
    applyDarkTheme(svg, inkColour, staffColour);
  }

  return cleanupContainer(container);
}

// ── Internal types ──────────────────────────────────────────────────────────

interface BarSlot {
  notationBar: NotationBar;
  barIndex: number;
  barSpan: number;
  isFirst: boolean;
  isFirstInRow: boolean;
  timeSignature: string;
}

function createBarSlots(bars: NotationBar[]): BarSlot[] {
  const slots: BarSlot[] = [];
  for (const nb of bars) {
    const span = nb.bars ?? 1;
    for (let b = 0; b < span; b++) {
      slots.push({
        notationBar: nb,
        barIndex: b,
        barSpan: span,
        isFirst: b === 0,
        isFirstInRow: false,
        timeSignature: nb.timeSignature ?? "4/4",
      });
    }
  }
  return slots;
}

function calculateIdealBarWidth(
  bars: NotationBar[],
  slotCount: number,
  usableWidth: number
): number {
  const maxNoteCount = Math.max(...bars.map(b => b.noteCount ?? b.chords.length));
  const effectiveMinBarPx = maxNoteCount > 4
    ? Math.max(MIN_BAR_PX, CLEF_PX + TIME_SIG_PX + maxNoteCount * 35)
    : MIN_BAR_PX;
  return Math.max(
    effectiveMinBarPx,
    Math.floor((usableWidth - CLEF_PX) / slotCount)
  );
}

interface Row { slots: BarSlot[]; }

function packSlotsIntoRows(
  slots: BarSlot[],
  idealBarWidth: number,
  containerWidth: number
): Row[] {
  const rows: Row[] = [];
  let currentRow: BarSlot[] = [];
  let currentRowWidth = CLEF_PX + H_PADDING;

  for (const slot of slots) {
    if (currentRow.length > 0 && currentRowWidth + idealBarWidth > containerWidth) {
      rows.push({ slots: currentRow });
      currentRow = [];
      currentRowWidth = CLEF_PX + H_PADDING;
    }
    if (currentRow.length === 0) slot.isFirstInRow = true;
    currentRow.push(slot);
    currentRowWidth += idealBarWidth;
  }
  if (currentRow.length > 0) rows.push({ slots: currentRow });
  return rows;
}

function renderRows(rows: Row[], context: any, idealBarWidth: number) {
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const rowY = rowIdx * ROW_HEIGHT;
    let xOffset = H_PADDING;
    for (let slotIdx = 0; slotIdx < row.slots.length; slotIdx++) {
      renderSlot(row.slots[slotIdx], slotIdx, xOffset, rowY, context, idealBarWidth);
      xOffset += idealBarWidth + (slotIdx === 0 ? CLEF_PX : 0);
    }
  }
}

function renderSlot(
  slot: BarSlot,
  slotIdx: number,
  xOffset: number,
  rowY: number,
  context: any,
  idealBarWidth: number
) {
  const isFirstInRow = slotIdx === 0;
  const staveWidth = idealBarWidth + (isFirstInRow ? CLEF_PX : 0);
  const stave = new Stave(xOffset, rowY + STAVE_Y_OFFSET, staveWidth);

  if (isFirstInRow) stave.addClef("treble");
  if (slot.isFirst && slot.notationBar.keySignature) {
    stave.addKeySignature(slot.notationBar.keySignature);
  }
  if (slot.isFirst && slot.notationBar.timeSignature) {
    stave.addTimeSignature(slot.notationBar.timeSignature);
  }

  stave.setContext(context).draw();

  if (slot.isFirst && slot.notationBar.label) {
    context.save();
    context.setFont("Arial", 11);
    const labelX = xOffset + staveWidth / 2 - (slot.notationBar.label.length * 3);
    context.fillText(slot.notationBar.label, labelX, rowY + LABEL_Y_OFFSET);
    context.restore();
  }

  if (slot.notationBar.chords.length > 0) {
    renderNotes(slot, isFirstInRow, staveWidth, context, stave);
  }
}

function renderNotes(
  slot: BarSlot,
  isFirstInRow: boolean,
  staveWidth: number,
  context: any,
  stave: any
) {
  const [beatsNum] = slot.timeSignature.split("/").map(Number);
  const duration = slot.notationBar.forceDuration ?? getDuration(
    slot.notationBar.noteCount ?? slot.notationBar.chords.length,
    beatsNum
  );
  const staveNotes = slot.notationBar.chords.map((freqs) =>
    frequenciesToStaveNote(freqs, duration)
  );
  const voice = new Voice({ numBeats: beatsNum, beatValue: 4 }).setStrict(false);
  voice.addTickables(staveNotes);

  const keyExtraWidth = slot.notationBar.keySignature
    ? KEY_SIG_PX * getKeyAccidentalCount(slot.notationBar.keySignature)
    : 0;
  const noteAreaWidth = staveWidth
    - (isFirstInRow ? CLEF_PX : 0)
    - (slot.isFirst && slot.notationBar.timeSignature ? TIME_SIG_PX : 0)
    - (slot.isFirst ? keyExtraWidth : 0)
    - NOTE_AREA_MARGIN;

  new Formatter()
    .joinVoices([voice])
    .format([voice], Math.max(50, noteAreaWidth));
  voice.draw(context, stave);
}

function cleanupContainer(container: HTMLDivElement): () => void {
  return () => {
    while (container.firstChild) container.firstChild.remove();
  };
}

function getDuration(chordCount: number, beatsPerBar: number): string {
  if (chordCount > 4 && beatsPerBar === 4) return "8";
  const beatsPerChord = beatsPerBar / chordCount;
  if (beatsPerChord >= 4) return "w";
  if (beatsPerChord >= 3) return "hd";
  if (beatsPerChord >= 2) return "h";
  if (beatsPerChord >= 1.5) return "qd";
  if (beatsPerChord >= 1) return "q";
  if (beatsPerChord >= 0.5) return "8";
  return "16";
}

// ── Key signature helpers ───────────────────────────────────────────────────

/** VexFlow key signature string for each key (major). e.g. "G" = 1 sharp */
export const KEY_SIGNATURES: Record<string, string> = {
  "C":  "C",
  "G":  "G",
  "D":  "D",
  "A":  "A",
  "E":  "E",
  "B":  "B",
  "F#": "F#",
  "C#": "C#",
  "F":  "F",
  "Bb": "Bb",
  "Eb": "Eb",
  "Ab": "Ab",
  "Db": "Db",
  "Gb": "Gb",
  "Cb": "Cb",
};

/** Return number of sharps or flats in a key (for layout width calculation) */
function getKeyAccidentalCount(keySig: string): number {
  const counts: Record<string, number> = {
    C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7,
    F: 1, Bb: 2, Eb: 3, Ab: 4, Db: 5, Gb: 6, Cb: 7,
  };
  return counts[keySig] ?? 0;
}

/** Human-readable label for a key signature */
export const KEY_SIGNATURE_LABELS: Record<string, string> = {
  "C":  "C major / A minor",
  "G":  "G major / E minor (1♯)",
  "D":  "D major / B minor (2♯)",
  "A":  "A major / F♯ minor (3♯)",
  "E":  "E major / C♯ minor (4♯)",
  "B":  "B major / G♯ minor (5♯)",
  "F#": "F♯ major / D♯ minor (6♯)",
  "C#": "C♯ major / A♯ minor (7♯)",
  "F":  "F major / D minor (1♭)",
  "Bb": "B♭ major / G minor (2♭)",
  "Eb": "E♭ major / C minor (3♭)",
  "Ab": "A♭ major / F minor (4♭)",
  "Db": "D♭ major / B♭ minor (5♭)",
  "Gb": "G♭ major / E♭ minor (6♭)",
  "Cb": "C♭ major / A♭ minor (7♭)",
};
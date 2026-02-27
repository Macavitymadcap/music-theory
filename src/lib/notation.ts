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
  label?: string;
  /** How many musical bars this step spans */
  bars?: number;
}

// Layout constants
const MIN_BAR_PX = 120;   // minimum width per musical bar
const CLEF_PX = 40;       // extra width for clef on first bar of each row
const ROW_HEIGHT = 110;   // px per row (stave + label clearance)
const STAVE_Y_OFFSET = 25; // stave top within each row
const LABEL_Y_OFFSET = 90; // label baseline within each row
const H_PADDING = 10;     // left margin

/**
 * Render notation into a container using VexFlow.
 * Bars wrap into rows like text — as many bars per row as fit, then a new row.
 * The SVG grows vertically to fit all rows. Container should be overflow-y: auto.
 * Returns a cleanup function.
 */
export function renderNotation(
  container: HTMLDivElement,
  bars: NotationBar[],
  options: { width?: number } = {}
): () => void {
  while (container.firstChild) container.firstChild.remove();
  if (!bars.length) return () => {};

  const containerWidth = options.width ?? container.clientWidth ?? 600;
  const usableWidth = containerWidth - H_PADDING * 2;

  const slots = expandNotationBars(bars);
  const idealBarWidth = getIdealBarWidth(usableWidth, slots.length);
  const rows = packSlotsIntoRows(slots, idealBarWidth, containerWidth);

  const totalHeight = rows.length * ROW_HEIGHT + 20;

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(containerWidth, totalHeight);
  const context = renderer.getContext();
  context.setFont("Arial", 10);

  renderRows(rows, context, idealBarWidth);

  return () => {
    while (container.firstChild) container.firstChild.remove();
  };
}

interface BarSlot {
  notationBar: NotationBar;
  barIndex: number;
  barSpan: number;
  isFirst: boolean;
  isFirstInRow: boolean;
  timeSignature: string;
}

interface Row { slots: BarSlot[]; }

function expandNotationBars(bars: NotationBar[]): BarSlot[] {
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

function getIdealBarWidth(usableWidth: number, slotCount: number): number {
  return Math.max(
    MIN_BAR_PX,
    Math.floor((usableWidth - CLEF_PX) / slotCount)
  );
}

function packSlotsIntoRows(slots: BarSlot[], idealBarWidth: number, containerWidth: number): Row[] {
  const rows: Row[] = [];
  let currentRow: BarSlot[] = [];
  let currentRowWidth = CLEF_PX + H_PADDING;

  for (const slot of slots) {
    const slotWidth = idealBarWidth;

    if (currentRow.length > 0 && currentRowWidth + slotWidth > containerWidth) {
      rows.push({ slots: currentRow });
      currentRow = [];
      currentRowWidth = CLEF_PX + H_PADDING;
    }

    if (currentRow.length === 0) {
      slot.isFirstInRow = true;
    }

    currentRow.push(slot);
    currentRowWidth += slotWidth;
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
      const slot = row.slots[slotIdx];
      renderBar(slot, slotIdx, xOffset, rowY, context, idealBarWidth);
      xOffset += idealBarWidth + (slotIdx === 0 ? CLEF_PX : 0);
    }
  }
}

function renderBar(
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
    const [beatsNum] = slot.timeSignature.split("/").map(Number);
    const duration = getDuration(slot.notationBar.chords.length, beatsNum);

    const staveNotes = slot.notationBar.chords.map((freqs) =>
      frequenciesToStaveNote(freqs, duration)
    );

    const voice = new Voice({ numBeats: beatsNum, beatValue: 4 }).setStrict(false);
    voice.addTickables(staveNotes);

    new Formatter()
      .joinVoices([voice])
      .format([voice], staveWidth - 25);
    voice.draw(context, stave);
  }
}

/** Pick note duration to fill the available beats in a single bar */
function getDuration(chordCount: number, beatsPerBar: number): string {
  const beatsPerChord = beatsPerBar / chordCount;
  if (beatsPerChord >= 4) return "w";
  if (beatsPerChord >= 3) return "hd";
  if (beatsPerChord >= 2) return "h";
  if (beatsPerChord >= 1.5) return "qd";
  if (beatsPerChord >= 1) return "q";
  if (beatsPerChord >= 0.5) return "8";
  return "16";
}
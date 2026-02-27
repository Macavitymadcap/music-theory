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

  // --- Layout pass: assign each bar to a row ---

  // Expand each NotationBar entry into individual musical bars with metadata
  interface BarSlot {
    notationBar: NotationBar;
    barIndex: number;      // which musical bar within the step (0-based)
    barSpan: number;       // total bars for this step (for width calculation)
    isFirst: boolean;      // first musical bar of this step (show time sig)
    isFirstInRow: boolean; // will be set in layout pass (show clef)
    timeSignature: string; // resolved time sig (inherited from step, always set)
  }

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

  // Determine bar width — try to fit nicely, but honour minimum
  // Use the wider of: (usableWidth - clef) / totalSlots, or MIN_BAR_PX
  const idealBarWidth = Math.max(
    MIN_BAR_PX,
    Math.floor((usableWidth - CLEF_PX) / slots.length)
  );

  // Pack slots into rows
  interface Row { slots: BarSlot[]; }
  const rows: Row[] = [];
  let currentRow: BarSlot[] = [];
  let currentRowWidth = CLEF_PX + H_PADDING; // first row always has clef

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const slotWidth = idealBarWidth;

    if (currentRow.length > 0 && currentRowWidth + slotWidth > containerWidth) {
      // Start a new row
      rows.push({ slots: currentRow });
      currentRow = [];
      currentRowWidth = CLEF_PX + H_PADDING; // each row starts with a clef
    }

    if (currentRow.length === 0) {
      slot.isFirstInRow = true;
    }

    currentRow.push(slot);
    currentRowWidth += slotWidth;
  }
  if (currentRow.length > 0) rows.push({ slots: currentRow });

  // --- Render pass ---

  const totalHeight = rows.length * ROW_HEIGHT + 20;

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(containerWidth, totalHeight);
  const context = renderer.getContext();
  context.setFont("Arial", 10);

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const rowY = rowIdx * ROW_HEIGHT;
    let xOffset = H_PADDING;

    for (let slotIdx = 0; slotIdx < row.slots.length; slotIdx++) {
      const slot = row.slots[slotIdx];
      const isFirstInRow = slotIdx === 0;
      const staveWidth = idealBarWidth + (isFirstInRow ? CLEF_PX : 0);

      const stave = new Stave(xOffset, rowY + STAVE_Y_OFFSET, staveWidth);
      if (isFirstInRow) stave.addClef("treble");
      // Show time signature on first bar of a step that's also first in its row,
      // or on the very first bar of the whole notation
      if (slot.isFirst && slot.notationBar.timeSignature) {
        stave.addTimeSignature(slot.notationBar.timeSignature);
      }
      stave.setContext(context).draw();

      // Label: show on first musical bar of each step
      if (slot.isFirst && slot.notationBar.label) {
        context.save();
        context.setFont("Arial", 11);
        const labelX = xOffset + staveWidth / 2 - (slot.notationBar.label.length * 3);
        context.fillText(slot.notationBar.label, labelX, rowY + LABEL_Y_OFFSET);
        context.restore();
      }

      // Draw notes in every bar of a step — repeated chord shows in each bar
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

      xOffset += staveWidth;
    }
  }

  return () => {
    while (container.firstChild) container.firstChild.remove();
  };
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
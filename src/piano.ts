/**
 * Piano keyboard display.
 * Renders a keyboard spanning the relevant octaves,
 * highlighting active notes. During scale playback, highlights
 * animate sequentially. Keys show note names on hover via
 * popover="hint" with title attribute fallback.
 */

// ── Note naming with ♭ and ♯ ──

const WHITE_DISPLAY: Record<number, string> = {
  0: "C", 2: "D", 4: "E", 5: "F", 7: "G", 9: "A", 11: "B",
};

const BLACK_DISPLAY: Record<number, string> = {
  1:  "D♭ / C♯",
  3:  "E♭ / D♯",
  6:  "G♭ / F♯",
  8:  "A♭ / G♯",
  10: "B♭ / A♯",
};

function midiToDisplayName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = midi % 12;
  const base = BLACK_DISPLAY[semitone] ?? WHITE_DISPLAY[semitone] ?? "?";
  return `${base}${octave}`;
}

// ── Layout constants ──

const BLACK_INDICES = new Set([1, 3, 6, 8, 10]);

const BLACK_KEY_OFFSETS: Record<number, number> = {
  1: 0.6,
  3: 1.75,
  6: 3.6,
  8: 4.7,
  10: 5.8,
};

function frequencyToMidi(freq: number): number {
  return Math.round(12 * Math.log2(freq / 440) + 69);
}

function isBlack(midi: number): boolean {
  return BLACK_INDICES.has(midi % 12);
}

// ── Popover hint support detection ──

const supportsPopoverHint = (() => {
  try {
    const el = document.createElement("div");
    el.popover = "hint";
    return el.popover === "hint";
  } catch {
    return false;
  }
})();

// ── Public interface ──

export interface PianoKeyboard {
  element: HTMLElement;
  highlight(frequencies: number[]): void;
  clear(): void;
  highlightSequence(frequencies: number[], intervalMs: number): void;
  stopSequence(): void;
}

export function createPianoKeyboard(): PianoKeyboard {
  const container = document.createElement("div");
  container.className = "piano-container";

  const label = document.createElement("div");
  label.className = "piano-label";
  label.textContent = "keyboard";

  const keyboard = document.createElement("div");
  keyboard.className = "piano";

  // Single shared tooltip element
  const tooltip = document.createElement("div");
  tooltip.className = "piano-tooltip";
  tooltip.id = `piano-tip-${Math.random().toString(36).slice(2, 8)}`;
  if (supportsPopoverHint) {
    tooltip.popover = "hint";
  } else {
    // Hidden unless popover is supported; title attr handles fallback
    tooltip.style.display = "none";
  }

  container.appendChild(label);
  container.appendChild(keyboard);
  container.appendChild(tooltip);

  let keyElements = new Map<number, HTMLElement>();
  let sequenceTimer: number | null = null;
  let currentHoverKey: HTMLElement | null = null;

  // ── Tooltip show/hide ──

  function showTooltip(keyEl: HTMLElement) {
    if (!supportsPopoverHint) return;

    const midi = Number(keyEl.dataset.midi);
    tooltip.textContent = midiToDisplayName(midi);

    // Position relative to container
    const keyRect = keyEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    tooltip.style.left = `${keyRect.left - containerRect.left + keyRect.width / 2}px`;
    tooltip.style.top = `${keyRect.top - containerRect.top - 4}px`;

    try { tooltip.showPopover(); } catch { /* already open */ }
    currentHoverKey = keyEl;
  }

  function hideTooltip() {
    if (!supportsPopoverHint) return;
    try { tooltip.hidePopover(); } catch { /* already hidden */ }
    currentHoverKey = null;
  }

  function attachTooltipEvents(keyEl: HTMLElement) {
    const midi = Number(keyEl.dataset.midi);
    const displayName = midiToDisplayName(midi);

    // Always set title as baseline / fallback
    keyEl.title = displayName;

    if (supportsPopoverHint) {
      keyEl.addEventListener("mouseenter", () => showTooltip(keyEl));
      keyEl.addEventListener("mouseleave", () => {
        setTimeout(() => {
          if (currentHoverKey === keyEl) hideTooltip();
        }, 50);
      });
      keyEl.addEventListener("focus", () => showTooltip(keyEl));
      keyEl.addEventListener("blur", () => hideTooltip());
    }
  }

  // ── Render ──

  function renderRange(lowMidi: number, highMidi: number) {
    const start = lowMidi - (lowMidi % 12);
    const end = highMidi + ((12 - (highMidi % 12)) % 12);

    keyboard.innerHTML = "";
    keyElements.clear();

    const whiteKeys: number[] = [];
    const blackKeys: number[] = [];

    for (let midi = start; midi <= end; midi++) {
      (isBlack(midi) ? blackKeys : whiteKeys).push(midi);
    }

    const totalWhite = whiteKeys.length;
    keyboard.style.setProperty("--white-count", String(totalWhite));

    for (const midi of whiteKeys) {
      const key = document.createElement("div");
      key.className = "piano-key white";
      key.dataset.midi = String(midi);
      key.tabIndex = -1;

      if (midi % 12 === 0) {
        const marker = document.createElement("span");
        marker.className = "octave-marker";
        marker.textContent = `C${Math.floor(midi / 12) - 1}`;
        key.appendChild(marker);
      }

      attachTooltipEvents(key);
      keyboard.appendChild(key);
      keyElements.set(midi, key);
    }

    for (const midi of blackKeys) {
      const key = document.createElement("div");
      key.className = "piano-key black";
      key.dataset.midi = String(midi);
      key.tabIndex = -1;

      const octaveStart = midi - (midi % 12);
      const whitesBefore = whiteKeys.filter(
        (w) => w >= start && w < octaveStart
      ).length;
      const semitone = midi % 12;
      const offsetInOctave = BLACK_KEY_OFFSETS[semitone] ?? 0;
      const leftPos = ((whitesBefore + offsetInOctave) / totalWhite) * 100;
      key.style.left = `${leftPos}%`;

      attachTooltipEvents(key);
      keyboard.appendChild(key);
      keyElements.set(midi, key);
    }
  }

  // ── Highlight API ──

  function highlight(frequencies: number[]) {
    keyElements.forEach((el) => el.classList.remove("active"));

    const midis = frequencies.map(frequencyToMidi);
    if (midis.length === 0) return;

    const minMidi = Math.min(...midis);
    const maxMidi = Math.max(...midis);
    const padLow = Math.max(0, minMidi - 5);
    const padHigh = Math.min(127, maxMidi + 5);

    // Enforce minimum 3-octave (36 semitone) display range
    const MIN_RANGE = 36;
    let rangeSize = padHigh - padLow;
    let finalLow = padLow;
    let finalHigh = padHigh;

    if (rangeSize < MIN_RANGE) {
      const expand = MIN_RANGE - rangeSize;
      finalLow = Math.max(0, padLow - Math.floor(expand / 2));
      finalHigh = Math.min(127, padHigh + Math.ceil(expand / 2));
      // Re-balance if we hit a boundary
      rangeSize = finalHigh - finalLow;
      if (rangeSize < MIN_RANGE) {
        if (finalLow === 0) finalHigh = Math.min(127, MIN_RANGE);
        else finalLow = Math.max(0, finalHigh - MIN_RANGE);
      }
    }

    renderRange(Math.floor(finalLow), Math.ceil(finalHigh));

    for (const midi of midis) {
      keyElements.get(midi)?.classList.add("active");
    }
  }

  function clear() {
    keyElements.forEach((el) => el.classList.remove("active"));
  }

  function stopSequence() {
    if (sequenceTimer !== null) {
      clearInterval(sequenceTimer);
      sequenceTimer = null;
    }
  }

  function highlightSequence(frequencies: number[], intervalMs: number) {
    stopSequence();
    if (frequencies.length === 0) return;

    const allMidis = frequencies.map(frequencyToMidi);
    const minMidi = Math.min(...allMidis);
    const maxMidi = Math.max(...allMidis);
    renderRange(Math.max(0, minMidi - 3), Math.min(127, maxMidi + 3));

    let idx = 0;
    function step() {
      keyElements.forEach((el) => el.classList.remove("active"));
      if (idx < allMidis.length) {
        keyElements.get(allMidis[idx])?.classList.add("active");
        idx++;
      } else {
        stopSequence();
      }
    }

    step();
    sequenceTimer = window.setInterval(step, intervalMs);
  }

  renderRange(48, 72);

  return { element: container, highlight, clear, highlightSequence, stopSequence };
}
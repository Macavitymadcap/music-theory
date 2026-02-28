# music-theory — Architecture & Agent Context

> **Stack:** SolidJS · TypeScript · Vite · Vitest · Bun  
> **Target:** Static client-side SPA, deployed to GitHub Pages at `/music-theory/`

---

## Overview

A browser-based music theory learning tool with four interactive modes:

- **Note** — play a single pitch
- **Scale** — play a scale sequentially, with per-note piano highlight
- **Chord** — play all chord notes simultaneously
- **Progression** — play multi-chord sequences with per-chord piano highlight
- **Cheat Sheets** Interactive tables, graphs and music notation for music theory concepts

Each mode renders:
1. A control panel (pitch/type selectors, waveform, duration, BPM)
2. VexFlow musical notation
3. A reactive piano keyboard that highlights the currently-playing note(s)

---

## Project Layout

```
src/
  components/
    atoms/          # Stateless, single-responsibility UI primitives
    molecules/      # Composed atoms; some minor logic (e.g. PianoKeyboard)
    organisms/      # Feature-level components with domain logic
      chord/
      custom-progression-builder/
      mode-shell/
      note/
      preset-progression/
      progression/
      scale/
    panels/         # (future) TunerPanel, CheatSheetPanel
  context/
    AudioContext.tsx      # Singleton Web Audio API context
    PlaybackContext.tsx   # Playback state machine (isPlaying, currentFrequencies)
    test-utils.tsx        # Shared test helpers & AudioContext stub
  lib/              # Pure business logic — no UI imports
    chords.ts
    duration.ts
    index.ts        # Re-exports everything for consumers
    midi.ts
    notation.ts     # VexFlow rendering helpers
    notes.ts
    progressions.ts
    scales.ts
    web-audio.ts
  styles/
    tokens.css      # All CSS custom properties (:root)
  App.tsx
  main.tsx
  setup-tests.ts
```

---

## Core Principles

1. **`src/lib/` is stable, pure, and well-tested.** Never import SolidJS or DOM APIs there. All UI lives in `src/components/` and `src/context/`.

2. **No module-level mutable state in components.** All state lives in SolidJS signals via `createSignal` / `createEffect`. Components receive data via props or context.

3. **Atomic design hierarchy:** atoms ← molecules ← organisms. An organism may use context; an atom must not.

4. **CSS tokens only.** All colour and spacing values come from `tokens.css` custom properties. No hardcoded values in component CSS files.

5. **Separation of range vs. highlight in `PianoKeyboard`.** `rangeFrequencies` (stable set) drives the key range; `highlightedFrequencies` (changes during playback) drives active key styling. This prevents the keyboard from re-measuring during playback.

---

## Context Layer

### `AudioContext` (`src/context/AudioContext.tsx`)

Provides a singleton `AudioContext` with lazy creation and auto-resume.

```ts
const { getAudioContext, suspend, resume } = useAudio();
```

- `getAudioContext()` — creates on first call; resumes if suspended; never recreates a closed context.
- `suspend()` — suspends the running context (called by `PlaybackContext.stop()`).
- `resume()` — resumes a suspended context.
- Context is closed on component cleanup (`onCleanup`).

### `PlaybackContext` (`src/context/PlaybackContext.tsx`)

Manages the playback state machine. Consumed by all panel organisms and `ModeShell`.

```ts
const { isPlaying, currentFrequencies, start, updateFrequencies, stop } = usePlayback();
```

| Method | Description |
|--------|-------------|
| `start(sequence)` | Begins playback; clears previous timers; sets `isPlaying = true`. |
| `stop()` | Clears timers; suspends audio context; resets `isPlaying` and `currentFrequencies`. |
| `updateFrequencies(freqs)` | Updates the highlighted keys **without** stopping playback. Used by `Progression` for per-chord animation. |

**Sequence types:**

```ts
type PlaybackSequence =
  | { type: "instant"; frequencies: number[] }          // Note / Chord
  | { type: "sequential"; frequencies: number[]; intervalMs: number }  // Scale
```

Progression uses `start()` once then calls `updateFrequencies()` on a `setTimeout` chain.

---

## Library Layer (`src/lib/`)

### `notes.ts`
- `NOTE_FREQUENCIES` — lookup map of `"c4"` → Hz for all 12 notes across octaves 0–8, generated from A4=440Hz.
- `getFrequencyFromName(name)` — throws on unknown note.
- `getFrequencyFromTonicAndInterval(tonic, semitones)` — returns `tonic * 2^(semitones/12)`.
- `createNote(frequency, value)` — returns `{ frequency, value }`.

### `duration.ts`
- `DURATIONS` — named constants: `BREVE=2`, `SEMIBREVE=1`, `MINIM=0.5`, `CROTCHET=0.25`, `QUAVER=0.125`, `SEMIQUAVER=0.0625`.
- `TIME_SIGNATURES` — `TWO_FOUR=0.5`, `THREE_FOUR=0.75`, `FOUR_FOUR=1`, `SIX_EIGHT=0.75`, `TWELVE_EIGHT=1.5`.

### `scales.ts`
- `SCALES` — 40+ named scales, each with `name`, `length`, `intervals[]` (semitone offsets from tonic including octave endpoint).
- `SCALE_GROUPS` — grouped for `<optgroup>` rendering.
- `createScale(scaleName, tonicHz)` → `Note[]`.

### `chords.ts`
- `CHORD_INTERVALS` — 60+ chord types as semitone interval arrays.
- `CHORD_GROUPS` — grouped for `<optgroup>` rendering.
- `CHORD_DISPLAY_NAMES` — human-readable labels.
- `createChord(chordType, tonicHz, duration?)` → `{ notes, length }`.

### `progressions.ts`
- `PROGRESSION_PRESETS` — 12 named progressions (pop, jazz, blues, modal, etc.).
- `DEGREE_OPTIONS` — 12 Roman numeral degrees (I–VII + flats) with semitone offsets.
- `resolveProgression(steps, tonicHz)` → `ResolvedStep[]` — maps semitone offsets to concrete frequencies.
- `ProgressionStep` — `{ label, semitones, chordType, bars, hitsPerBar, beatsPerBar }`.

### `web-audio.ts`
- `durationToSeconds(value, bpm, timeSignature)` — converts a note duration fraction to wall-clock seconds.
- `applyEnvelope(gainNode, startTime, duration)` — simple ADSR envelope (attack 25%, decay 25%, sustain 0.2, release 50%).
- `scheduleNote(note, startTime, options)` — schedules a single oscillator note.
- `scheduleChord(chord, startTime, options)` — schedules all notes simultaneously; divides gain by note count.
- `scheduleChordAtTime(frequencies[], startTime, durationSeconds, options)` — lower-level scheduling for progression playback.
- `playScale(notes, options)` / `playChord(chord, options)` — convenience wrappers.
- `chainNodes(ctx, ...nodes)` — wires nodes in series to `context.destination`.

### `midi.ts`
- `frequencyToMidi(hz)` — `Math.round(12 * log2(hz/440) + 69)`.
- `isBlackKey(midi)` — checks against `{1,3,6,8,10}`.
- `midiToDisplayName(midi)` — e.g. `"A4"`, `"D♭ / C♯4"`.
- `computeMidiRange(midis[])` — adds ±5 padding; enforces minimum 36-semitone span.
- `buildKeyDescriptors(low, high)` — snaps to octave boundaries; returns `{ whiteKeys, blackKeys }` with `leftPercent` for black key CSS positioning.

### `notation.ts`
- `frequencyToVexKey(freq)` → `{ key, accidental, duration }` — converts Hz to VexFlow key string (e.g. `"f#/4"`).
- `frequenciesToStaveNote(frequencies[], duration)` → `StaveNote` — creates a single VexFlow note (chord if multiple freqs).
- `renderNotation(container, bars, options)` — full layout engine:
  - Calculates ideal bar width based on note count.
  - Packs bars into rows (wraps like text when row is full).
  - Renders clef on first bar of each row; time signature on first bar of each `NotationBar`.
  - Returns a cleanup function.
- `NotationBar` — `{ chords: number[][], timeSignature?, label?, bars?, noteCount?, forceDuration? }`.

---

## Component Reference

### Atoms

| Component | Props | Notes |
|-----------|-------|-------|
| `Button` | `variant`, `onClick`, `disabled`, `type` | variant: `"primary"` \| `"danger"` \| `"ghost"` |
| `Field` | `children` | Flex column wrapper with 0.35rem gap |
| `Label` | `for`, `children` | Mono uppercase, `<label>` element |
| `NumberInput` | `id`, `value`, `onChange`, `min`, `max`, `step` | Fires only on valid integer parse |
| `PianoKey` | `midi`, `isBlack`, `isActive`, `leftPercent?` | Shows octave marker on C keys |
| `RadioGroup` | `name`, `options`, `value`, `onChange` | Button-strip pattern |
| `Select` | `id`, `value`, `onChange`, `options?`, `groups?` | Supports `<optgroup>` via `groups` prop |
| `StepBadge` | `label`, `chord`, `bars`, `onRemove?` | Inline progression step display |

### Molecules

| Component | Notes |
|-----------|-------|
| `BpmInput` | `Field` + `Label` + `NumberInput` (1–300 BPM) |
| `DurationSelect` | Maps `Duration` values to `1/16`–`2` labels |
| `Notation` | VexFlow renderer; `createEffect` → `requestAnimationFrame` for layout safety |
| `PianoKeyboard` | Derives range from `rangeFrequencies`; highlights from `highlightedFrequencies` |
| `PitchSelect` | All 12 notes × octaves 0–8 |
| `ProgressionControls` | Pitch, waveform, BPM, repeats |
| `Row` | Flex row with `gap: 0.75rem`, children `flex: 1` |
| `WaveformSelect` | sine / sawtooth / square / triangle |

### Organisms

**`ModeShell`** — top-level layout; owns `selectionFrequencies` and `notationBars` signals; routes to panels via `<Switch><Match>`.

**`Note`** — single note playback; `createEffect` syncs `onSelectionChange` and `onNotationChange` on pitch/duration change.

**`Scale`** — scale playback with sequential highlight via `PlaybackContext` sequential sequence.

**`Chord`** — chord playback; all frequencies highlighted simultaneously.

**`Progression`** — most complex panel:
  - Sub-mode toggle: preset vs. custom.
  - Builds `sequence[]` of `{ freqs, durationMs }` entries.
  - Schedules all audio upfront using `scheduleChordAtTime`.
  - Drives visual highlight via `updateFrequencies()` + `setTimeout` chain.
  - Uses a `{ cancelled: boolean }` token to safely abort in-flight sequences.

**`PresetProgression`** — preset select + `StepBadge` display.

**`CustomProgressionBuilder`** — degree + chord type + bars/beats/hits controls; manages local builder state; emits to parent via `onStepsChange`.

---

## Data Flow

```
ModeShell
  ├─ [mode signal] ──► Panel (Note | Scale | Chord | Progression)
  │     ├─ [selection] ──► onSelectionChange ──► selectionFrequencies (ModeShell)
  │     └─ [notation] ──► onNotationChange ──► notationBars (ModeShell)
  │
  ├─ PlaybackContext.currentFrequencies ──► PianoKeyboard.highlightedFrequencies
  └─ selectionFrequencies ──► PianoKeyboard.rangeFrequencies
```

Panels call `playback.start()` or `playback.updateFrequencies()` directly; `ModeShell` reads `currentFrequencies` from context to pass to `PianoKeyboard`.

---

## Testing Conventions

- **Test runner:** Vitest with jsdom environment.
- **Component tests:** `@solidjs/testing-library` (`render`, `fireEvent`, `cleanup`).
- **AudioContext stubbing:** always call `stubAudioContext()` from `src/context/test-utils.tsx` in `beforeEach`. This installs a class-based mock that works with `new AudioContext()`.
- **Fake timers:** `vi.useFakeTimers()` in `beforeEach`, `vi.useRealTimers()` in `afterEach` for any test involving `setTimeout` / `setInterval`.
- **Mock pattern for lib functions:**
  ```ts
  vi.mock("../../../lib", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../../lib")>();
    return { ...actual, playChord: vi.fn() };
  });
  ```
- **`TestProviders`** — wraps `AudioProvider` + `PlaybackProvider`; use for any organism test.
- All test files use `afterEach(cleanup)`.

---

## CSS Architecture

- **`src/styles/tokens.css`** — single source of truth for all design tokens; imported once in `main.tsx`.
- **Component-scoped CSS files** (e.g. `Button.css`) — imported in the component file; class names use BEM-like conventions (`btn`, `btn--primary`, `piano-key--active`).
- **`--white-count`** CSS custom property — set as inline style on `.piano-keyboard__keys` to enable black key `width` calculation relative to the total white key count.

---

## Build & Deploy

- `bun run dev` — Vite dev server.
- `bun run build` — outputs to `dist/`.
- `bun run test` — Vitest single-run.
- `bun run test:watch` — Vitest watch mode.
- GitHub Actions workflow (`.github/workflows/deploy-github-pages.yml`) builds on push to `main` and deploys `dist/` to GitHub Pages. A `.nojekyll` file is added post-build to prevent Jekyll interference with Vite's asset paths.
- `vite.config.ts` sets `base: "/music-theory/"` for correct asset URLs on GitHub Pages.

---

## Remaining Roadmap (Phases 6–8)

### Phase 6 — Instrument Tuner
- `src/lib/tuner.ts` — `startTuner(onResult)` using `AnalyserNode` + autocorrelation (YIN or McLeod).
- `src/components/panels/TunerPanel.tsx` — start/stop mic, note + cents display, visual meter.
- Add `"tuner"` to `ModeShell` options.

### Phase 7 — Cheat Sheets
- `src/components/panels/CheatSheetPanel.tsx` — tab/accordion container.
- Subcomponents: `CircleOfFifths.tsx` (interactive SVG), `KeySignatures.tsx`, `NoteReading.tsx`, `IntervalReference.tsx`, `ScaleDegrees.tsx`.
- Add `"cheat sheets"` to `ModeShell` options.

### Phase 8 — Polish & Accessibility
- Keyboard navigation audit (focus rings, tabIndex).
- ARIA labels on piano keys, mode selectors, play button.
- `prefers-reduced-motion` disables piano key transitions.
- Responsive layout (single-column mobile).
- Lighthouse / axe audit.
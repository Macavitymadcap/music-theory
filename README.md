# music-theory

An interactive browser-based music theory tool. Explore notes, scales, chords and chord progressions — with live audio playback, VexFlow notation rendering and a reactive piano keyboard.

**Live demo:** https://[your-username].github.io/music-theory/

---

## Features

- **Note mode** — select any pitch, waveform, duration and BPM; play a single note with live piano key highlight.
- **Scale mode** — choose from 40+ scales (major modes, pentatonic, blues, jazz, Eastern and more); plays each note sequentially with a travelling highlight on the keyboard.
- **Chord mode** — 60+ chord voicings (triads, sevenths, extended, altered, inversions, quartal); all notes highlight simultaneously.
- **Progression mode** — 12 curated presets (pop, blues, jazz, modal) plus a custom builder; each chord highlights as it plays.
- **VexFlow notation** — live staff notation for all four modes; progressions display one bar per chord.
- **Reactive piano keyboard** — range adjusts to the selection; highlights track playback in real time.
- **Interactive Cheat Sheets** - the Circle of Fifths, reading sheet music, intervals and other concepts explained with interactive elements.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Bun](https://bun.sh) |
| Build | [Vite](https://vitejs.dev) |
| UI framework | [SolidJS](https://solidjs.com) |
| Language | TypeScript |
| Notation | [VexFlow 5](https://vexflow.com) |
| Tests | [Vitest](https://vitest.dev) + [@solidjs/testing-library](https://github.com/solidjs/solid-testing-library) |
| Deploy | GitHub Pages via GitHub Actions |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0

### Install

```bash
bun install
```

### Development

```bash
bun run dev
```

Opens at `http://localhost:5173/music-theory/`.

### Build

```bash
bun run build
```

Output goes to `dist/`. The Vite base path is set to `/music-theory/` for GitHub Pages compatibility.

### Preview Production Build

```bash
bun run preview
```

### Run Tests

```bash
bun run test          # single run
bun run test:watch    # watch mode
```

---

## Project Structure

```
src/
  components/
    atoms/            # Stateless UI primitives
      button/
      field/
      label/
      number-input/
      piano-key/
      radio-group/
      select/
      step-badge/
    molecules/        # Composed atoms
      BpmInput.tsx
      DurationSelect.tsx
      Notation.tsx
      PianoKeyboard.tsx
      PitchSelect.tsx
      ProgressionControls.tsx
      Row.tsx
      WaveformSelect.tsx
    organisms/        # Feature-level panels with domain logic
      chord/
      custom-progression-builder/
      mode-shell/
      note/
      preset-progression/
      progression/
      scale/
  context/
    AudioContext.tsx      # Web Audio API singleton
    PlaybackContext.tsx   # Playback state machine
    test-utils.tsx        # Shared stubs and test providers
  lib/                    # Pure business logic, no UI imports
    chords.ts
    duration.ts
    index.ts
    midi.ts
    notation.ts
    notes.ts
    progressions.ts
    scales.ts
    web-audio.ts
  styles/
    tokens.css            # All CSS custom properties
  App.tsx
  main.tsx
  setup-tests.ts
```

---

## Architecture Notes

### Separation of concerns

- `src/lib/` contains only pure functions and data. No SolidJS, no DOM. Everything is independently unit-testable.
- `src/context/` provides two SolidJS contexts:
  - `AudioContext` — manages a single `AudioContext` instance (lazy init, auto-resume, closes on cleanup).
  - `PlaybackContext` — drives `isPlaying` and `currentFrequencies` signals consumed by `ModeShell` and `PianoKeyboard`.
- `src/components/` is split into atoms → molecules → organisms following atomic design. Organisms use contexts; atoms must not.

### Piano keyboard range vs. highlight

`PianoKeyboard` accepts two separate props:

- `rangeFrequencies` — determines which keys to render (stable set, changes only on selection change).
- `highlightedFrequencies` — drives which keys are active (changes every step during playback).

This prevents the keyboard layout from recalculating on every playback tick.

### Progression playback

All audio is scheduled upfront using `scheduleChordAtTime`. Visual highlight is driven by a `setTimeout` chain that calls `playback.updateFrequencies()` for each chord, without triggering a stop/start cycle. A cancellation token (`{ cancelled: boolean }`) ensures in-flight sequences abort cleanly when stopped.

### Notation rendering

`Notation.tsx` defers VexFlow rendering to the next animation frame via `requestAnimationFrame`. This ensures the container has its final dimensions before `clientWidth` is read for layout calculations.

---

## Scales Reference

Includes modes (Ionian–Locrian), natural/harmonic/melodic minor, pentatonic and blues variants, jazz scales (bebop, whole-tone, diminished, altered), and Eastern/exotic scales (Hirajoshi, Phrygian Dominant, Raga Bhairav, and more).

## Chords Reference

Triads, suspended, add chords, sixth chords, seventh chords (and all inversions), extended dominants, altered dominants, and special voicings (quartal, quintal, So What).

## Progression Presets

Four Chords, 12 Bar Blues, ii–V–I, Andalusian Cadence, Pachelbel's Canon, 50s Doo-Wop, Minor ii–V–i, Grunge Power, Rhythm Changes, Coltrane Changes, So What (modal).

---

## Testing

Tests are co-located with their source files (e.g. `Button.test.tsx` next to `Button.tsx`).

Each organism test:
1. Wraps the component in `<TestProviders>` (provides `AudioProvider` + `PlaybackProvider`).
2. Calls `stubAudioContext()` in `beforeEach` to install a class-based `AudioContext` mock compatible with `new AudioContext()`.
3. Uses `vi.useFakeTimers()` where `setTimeout`/`setInterval` is involved.
4. Calls `cleanup()` in `afterEach`.

```bash
bun run test
```

---

## Deployment

Push to `main` → GitHub Actions builds and deploys to GitHub Pages automatically.

The workflow (`.github/workflows/deploy-github-pages.yml`) runs `bun install` + `bun run build`, adds a `.nojekyll` file to prevent Jekyll processing Vite's `_` prefixed assets, then uploads the `dist/` directory.

---

## License

MIT
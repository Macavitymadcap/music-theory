# Music Theory App — Redesign Roadmap

> **Stack:** SolidJS · TypeScript · Vite · Vitest · Bun  
> **Target:** Static client-side app, deployable to GitHub Pages  
> **Design principle:** Atomic component architecture, minimal CSS with CSS custom properties

---

## Guiding Principles for AI Agents

- The existing `src/lib/` modules (`notes.ts`, `scales.ts`, `chords.ts`, `progressions.ts`, `web-audio.ts`, `duration.ts`) are **stable and well-tested business logic**. Do not rewrite them unless a phase explicitly requires it.
- All new UI is SolidJS. No vanilla DOM manipulation outside of the Web Audio API.
- CSS lives in component-scoped files or a single `tokens.css`. No inline styles except dynamic values via `style={{}}`.
- Every component receives its data via props or context — no module-level mutable state in components.
- Tests use Vitest. Prefer unit tests for lib functions and component logic; integration tests for playback flows.
- Commit after each phase is green.

---

## Phase 0 — Project Scaffolding

**Goal:** Replace the current `main.ts` + raw DOM approach with a working SolidJS + Vitest skeleton. The app should render "hello world" and the CI pipeline should pass.

### Tasks

- [X] Install dependencies:
  ```
  bun add solid-js
  bun add -d vite-plugin-solid @solidjs/testing-library vitest jsdom @testing-library/jest-dom
  ```
- [X] Update `vite.config.ts` to add `solidPlugin()` and Vitest config block:
  ```ts
  import solid from "vite-plugin-solid";
  // test: { environment: "jsdom", globals: true, setupFiles: [...] }
  ```
- [x] Update `tsconfig.json`: set `"jsx": "preserve"`, `"jsxImportSource": "solid-js"`.
- [x] Create `src/main.tsx` — mounts `<App />` to `#app`.
- [x] Create `src/App.tsx` — stub component, renders app shell.
- [x] Delete `src/main.ts` and `src/piano.ts` (will be rebuilt as components).
- [x] Write first Vitest test: smoke test that `createScale` returns the correct number of notes.
- [x] Verify `bun run dev`, `bun run build`, and `bun run test` all pass.

### Acceptance Criteria
- App renders in browser without console errors.
- `bun run test` exits 0 with at least one passing test.

---

## Phase 1 — Design Tokens & Atomic Base Components

**Goal:** Establish the visual foundation and lowest-level reusable components before any feature work.

### Tasks

**Tokens**
- [x] Create `src/styles/tokens.css` — move all `:root` CSS variables from `style.css` here. Variables must cover: colours, spacing scale, typography (font families, sizes), border radius, transition durations.
- [x] Import `tokens.css` in `src/main.tsx` (global, once).

**Atom components** — each in `src/components/atoms/`
- [x] `Select.tsx` — wraps `<select>`, accepts `options: {value, label}[]`, optional `groups: {label, options[]}[]` for `<optgroup>`, and standard `value`/`onChange` props.
- [x] `NumberInput.tsx` — wraps `<input type="number">` with `min`, `max`, `value`, `onChange`.
- [x] `Button.tsx` — accepts `variant: "primary" | "danger" | "ghost"`, `onClick`, `disabled`.
- [x] `RadioGroup.tsx` — renders a set of radio inputs as a button-strip (replaces `.mode-group`). Accepts `options: {value, label}[]`, `value`, `onChange`.
- [x] `Label.tsx` — styled mono-uppercase label, accepts `for` attribute.
- [x] `Field.tsx` — wraps a Label + any child input in the standard `.field` layout.

**Tests**
- [x] Unit test each atom: renders without error, responds to controlled value changes, applies correct ARIA attributes.

### Acceptance Criteria
- All atoms render in browser (create a temporary `src/dev/Sandbox.tsx` page if needed).
- All atom tests pass.
- No hardcoded colour or spacing values inside component files.

---

## Phase 2 — Piano Keyboard Component

**Goal:** Port `src/piano.ts` to a fully reactive SolidJS component.

### Tasks

- [x] Create `src/components/molecules/PianoKeyboard.tsx`.
  - Props: `highlightedFrequencies: number[]`, `sequenceIndex?: number` (for scale playback highlighting).
  - Derives MIDI range reactively from `highlightedFrequencies` (with minimum 3-octave display range).
  - Renders white and black keys using `<For>`.
  - Active keys determined by `props.highlightedFrequencies` — no internal highlight state. This fixes the chord progression highlight bug by design: the parent controls exactly which frequencies are active at any moment.
  - Tooltip on hover (CSS-only `:hover` + `::after` pseudo-element preferred over JS; fall back to `title` attribute).
- [x] Create `src/components/atoms/PianoKey.tsx` — single key, accepts `midi`, `isBlack`, `isActive`, `leftPercent?` (for black key positioning).
- [x] Write tests:
  - Correct number of white/black keys rendered for a given MIDI range.
  - Active class applied to keys matching `highlightedFrequencies`.
  - No active class on keys not in `highlightedFrequencies`.

### Acceptance Criteria
- Piano renders and highlights notes correctly for note, chord, scale, and progression modes.
- Sequential highlighting during scale playback works (parent passes `sequenceIndex` which updates on a timer).
- The old progression bug (all notes lit at once) is impossible by construction.

---

## Phase 3 — Mode Panels (Note, Scale, Chord)

**Goal:** Implement the three simpler playback modes as isolated panel components.

### Tasks

**Shared**
- [x] Create `src/context/AudioContext.tsx` — SolidJS context providing `getAudioContext()` and `stopPlayback()`. Manages the single `AudioContext` instance.
- [x] Create `src/context/PlaybackContext.tsx` — provides `isPlaying`, `currentFrequencies`, `startPlayback(fn)`, `stop()`. `currentFrequencies` drives the piano highlight.

**Panels** — each in `src/components/panels/`
- [x] `NotePanel.tsx` — pitch select, waveform select, duration select, BPM. On play: schedules single note, sets `currentFrequencies` for piano.
- [x] `ScalePanel.tsx` — pitch select, scale grouped-select, waveform, duration, BPM. On play: schedules scale, steps `currentFrequencies` through notes sequentially on a timer (this is the correct fix for scale highlight).
- [x] `ChordPanel.tsx` — pitch select, chord grouped-select, waveform, duration, BPM. On play: schedules chord, sets all note frequencies at once.

**Mode shell**
- [x] Create `src/components/organisms/ModeShell.tsx` — renders the `RadioGroup` mode selector, conditionally renders the active panel via `<Switch>/<Match>`, and renders `<PianoKeyboard>` below with `currentFrequencies` from context.

**Tests**
- [x] Test that each panel calls the correct `lib` function with the correct arguments (mock `web-audio.ts`).
- [x] Test that `currentFrequencies` is set correctly for each mode.
- [x] Test that scale panel steps through frequencies correctly.

### Acceptance Criteria
- All three modes play back correctly.
- Piano updates in sync with playback for all modes.
- No regression: stop button halts playback and clears highlights.

---

## Phase 4 — Progression Mode

**Goal:** Implement the chord progression panel with preset and custom builder sub-modes.

### Tasks

- [ ] `ProgressionPanel.tsx` — houses preset/custom radio toggle.
- [ ] `PresetProgression.tsx` — preset select with description and step badges display.
- [ ] `CustomProgressionBuilder.tsx` — degree select, chord type grouped-select, bars input, hits/bar input, add button. Renders editable step list.
- [ ] `StepBadge.tsx` (atom) — displays a single progression step; optional remove button.
- [ ] `ProgressionControls.tsx` (molecule) — key select, octave input, repeats, global hits/bar, waveform, BPM.
- [ ] Playback: resolve progression → schedule all chords → drive `currentFrequencies` through chord sequence on a timer, updating one chord at a time. This is the correct fix for the progression highlight bug.
- [ ] Expand `TIME_SIGNATURES` in `src/lib/duration.ts` to include: `2/4`, `3/4`, `4/4`, `6/8`, `12/8` (update the type and all consumers).

**Tests**
- [ ] Custom builder: add step, remove step, reorder.
- [ ] Preset display: correct steps shown for selected preset.
- [ ] Playback timer: `currentFrequencies` matches expected chord at each step.
- [ ] Time signature expansion: `durationToSeconds` correct for `6/8` and `12/8`.

### Acceptance Criteria
- Progression mode is fully functional, feature-equivalent to the original.
- Keyboard highlights exactly the chord currently playing, not all chords.
- Custom progressions persist across mode switches within the session.

---

## Phase 5 — VexFlow Notation

**Goal:** Render musical notation for the current note/scale/chord/progression using VexFlow.

### Tasks

- [ ] `bun add vexflow`
- [ ] Create `src/components/molecules/Notation.tsx`.
  - Accepts `mode`, `notes: Note[]`, `timeSignature`, `bars?` (for progressions).
  - Uses a `ref` + `onMount`/`onCleanup` to manage the VexFlow renderer lifecycle.
  - For note mode: single note on a stave.
  - For scale/chord mode: notes on a single bar stave.
  - For progression mode: one bar per progression step, wrapping into multiple lines if needed.
- [ ] Helper `src/lib/notation.ts` — converts `Note[]` and intervals to VexFlow `StaveNote` definitions. Keep VexFlow imports isolated here.
- [ ] Integrate `<Notation>` into each panel and the progression panel.

**Tests**
- [ ] `notation.ts` unit tests: correct VexFlow note names generated from frequencies.
- [ ] Component renders an SVG element without throwing.

### Acceptance Criteria
- Notation renders for all four modes.
- Progression renders all bars.
- Notation updates reactively when selections change.

---

## Phase 6 — Instrument Tuner

**Goal:** Add a microphone-based instrument tuner using the Web Audio API and autocorrelation pitch detection.

### Tasks

- [ ] Create `src/lib/tuner.ts`:
  - `startTuner(onResult: (note: string, cents: number, freq: number) => void): () => void`
  - Requests microphone via `navigator.mediaDevices.getUserMedia`.
  - Uses `AnalyserNode` + autocorrelation (YIN or McLeod Pitch Method) for pitch detection.
  - Returns a cleanup/stop function.
- [ ] Create `src/components/panels/TunerPanel.tsx`:
  - Start/stop mic button.
  - Large display: detected note name, octave.
  - Cents deviation meter (−50 to +50 range, visual indicator).
  - Target frequency display.
- [ ] Add "tuner" to the mode list in `ModeShell`.

**Tests**
- [ ] `tuner.ts` unit tests: autocorrelation function returns correct frequency for synthetic sine wave data arrays.
- [ ] Component renders correctly in stopped state; shows permission prompt state.

### Acceptance Criteria
- Tuner detects pitch in real time with < 200ms latency.
- Cents display updates smoothly.
- Stopping the tuner releases the microphone stream.

---

## Phase 7 — Cheat Sheets

**Goal:** Add reference pages for common music theory topics.

### Tasks

- [ ] Create `src/components/panels/CheatSheetPanel.tsx` — tab or accordion container.
- [ ] `CircleOfFifths.tsx` — interactive SVG circle of fifths. Clicking a key highlights related scales/chords (stretch goal: links to setting that key in playback modes).
- [ ] `KeySignatures.tsx` — table of major/minor keys with their sharps/flats.
- [ ] `NoteReading.tsx` — treble and bass clef note positions, ledger lines.
- [ ] `IntervalReference.tsx` — interval names, semitone counts, characteristic sound descriptions.
- [ ] `ScaleDegrees.tsx` — table of scale degree names (tonic, supertonic, etc.) and their roles.
- [ ] Add "cheat sheets" to the mode list.

**Tests**
- [ ] Each cheat sheet component renders without error.
- [ ] Circle of fifths SVG contains expected number of segments (12).

### Acceptance Criteria
- All cheat sheet tabs render and are readable on mobile.
- Circle of fifths is visually clear and correctly labelled.

---

## Phase 8 — Polish & Accessibility

**Goal:** Responsive layout, keyboard navigation, ARIA, and final CSS cleanup.

### Tasks

- [ ] Audit all interactive elements for keyboard accessibility (focusable, visible focus ring).
- [ ] Add ARIA labels to piano keys, mode selectors, playback button.
- [ ] Ensure `prefers-reduced-motion` disables piano key transition animations.
- [ ] Responsive breakpoints: single-column on mobile, wider layout on desktop (progression builder benefits from more space).
- [ ] Audit CSS — remove any remaining hardcoded values, ensure everything uses tokens.
- [ ] Add `<meta>` description, Open Graph tags to `index.html`.
- [ ] Verify GitHub Pages deployment end-to-end with the new build.

### Acceptance Criteria
- Passes basic axe / Lighthouse accessibility audit (no critical violations).
- Usable on a 375px wide mobile screen.
- CI/CD pipeline deploys successfully.

---

## Appendix A — File Structure (Target)

```
src/
  components/
    atoms/
      Button.tsx
      Field.tsx
      Label.tsx
      NumberInput.tsx
      PianoKey.tsx
      RadioGroup.tsx
      Select.tsx
      StepBadge.tsx
    molecules/
      Notation.tsx
      PianoKeyboard.tsx
      ProgressionControls.tsx
    organisms/
      ModeShell.tsx
    panels/
      ChordPanel.tsx
      CheatSheetPanel.tsx
      NotePanel.tsx
      ProgressionPanel.tsx
      ScalePanel.tsx
      TunerPanel.tsx
    cheatsheets/
      CircleOfFifths.tsx
      IntervalReference.tsx
      KeySignatures.tsx
      NoteReading.tsx
      ScaleDegrees.tsx
  context/
    AudioContext.tsx
    PlaybackContext.tsx
  lib/                        ← existing, largely unchanged
    chords.ts
    duration.ts
    index.ts
    notation.ts               ← new
    notes.ts
    progressions.ts
    scales.ts
    tuner.ts                  ← new
    web-audio.ts
  styles/
    tokens.css
  App.tsx
  main.tsx
```

---

## Appendix B — Key Bugs Being Fixed

| Bug | Root Cause | Fix in Phase |
|-----|-----------|--------------|
| Chord progression highlights all notes at once | `currentFrequencies` set to all notes across all steps before playback | Phase 4 — timer-driven per-chord update |
| Scale playback highlights all notes at once | Same root cause in scale mode | Phase 3 — sequential timer |

---

## Appendix C — Dependencies Summary

| Package | Purpose | Phase |
|---------|---------|-------|
| `solid-js` | UI framework | 0 |
| `vite-plugin-solid` | Vite transform | 0 |
| `@solidjs/testing-library` | Component testing | 0 |
| `vitest` | Test runner | 0 |
| `jsdom` | DOM environment for tests | 0 |
| `vexflow` | Music notation rendering | 5 |
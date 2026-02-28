# Music Theory App — Tickets

## MT-0004 — Instrument Tuner

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

## MT-0005 — Polish & Accessibility

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


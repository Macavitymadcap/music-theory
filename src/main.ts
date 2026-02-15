import "./style.css";
import {
  NOTE_NAMES,
  SCALES,
  SCALE_GROUPS,
  CHORD_INTERVALS,
  CHORD_GROUPS,
  CHORD_DISPLAY_NAMES,
  DURATIONS, 
  TIME_SIGNATURES,
  type ScaleName,
  type ChordType,
  type Chord,
  type Duration,
  type WaveformType,
  getFrequencyFromName,
  getFrequencyFromTonicAndInterval,
  createScale,
  createChordFromIntervals,
  playScale,
  playChord,
  scheduleChord,
  scheduleNote,
  createNote,
} from "./lib";
import { createPianoKeyboard } from "./piano";
import {
  PROGRESSION_PRESETS,
  DEGREE_OPTIONS,
  resolveProgression,
  type ProgressionStep,
} from "./progressions";

// ── Audio context ──

let ctx: AudioContext | null = null;
let playbackTimer: ReturnType<typeof setTimeout> | null = null;
let isPlaying = false;

function getAudioContext(): AudioContext {
  if (!ctx || ctx.state === "closed") ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// ── Shared data ──

const OCTAVES = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const WAVEFORMS: WaveformType[] = ["sine", "square", "sawtooth", "triangle"];
const MODES = ["note", "scale", "chord", "progression"] as const;
type Mode = (typeof MODES)[number];

const NOTE_DISPLAY: Record<string, string> = {
  c: "C", db: "D♭ / C♯", d: "D", eb: "E♭ / D♯", e: "E",
  f: "F", gb: "G♭ / F♯", g: "G", ab: "A♭ / G♯", a: "A",
  bb: "B♭ / A♯", b: "B",
};

function noteDisplayLabel(noteName: string): string {
  const match = noteName.match(/^([a-g]b?)(\d)$/);
  if (!match) return noteName;
  const [, base, octave] = match;
  return `${NOTE_DISPLAY[base] ?? base.toUpperCase()}${octave}`;
}

function keyDisplayLabel(keyName: string): string {
  return NOTE_DISPLAY[keyName] ?? keyName.toUpperCase();
}

function noteOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];
  for (const oct of OCTAVES) {
    for (const name of NOTE_NAMES) {
      const full = `${name}${oct}`;
      try { getFrequencyFromName(full); opts.push({ value: full, label: noteDisplayLabel(full) }); } catch { /* skip */ }
    }
  }
  return opts;
}

const DURATIONS_MAP: { label: string; value: Duration }[] = [
  { label: "1/16", value: DURATIONS.SEMIQUAVER },
  { label: "1/8", value: 0.125 },
  { label: "1/4", value: 0.25 },
  { label: "1/2", value: 0.5 },
  { label: "1", value: 1.0 },
  { label: "2", value: 2.0 },
];

// ── Custom progression state ──

let customSteps: ProgressionStep[] = [];

// ── Build HTML ──

function buildSelect(id: string, options: { value: string; label: string }[]): string {
  return `<select id="${id}">${options.map((o) => `<option value="${o.value}">${o.label}</option>`).join("")}</select>`;
}

/** Build a <select> with <optgroup> elements */
function buildGroupedSelect(id: string, groups: { label: string; options: { value: string; label: string }[] }[]): string {
  const inner = groups.map((g) => {
    const opts = g.options.map((o) => `<option value="${o.value}">${o.label}</option>`).join("");
    return `<optgroup label="${g.label}">${opts}</optgroup>`;
  }).join("");
  return `<select id="${id}">${inner}</select>`;
}

function render(): string {
  const noteOpts = noteOptions();
  const waveOpts = WAVEFORMS.map((w) => ({ value: w, label: w }));
  const durOpts = DURATIONS_MAP.map((d) => ({ value: String(d.value), label: d.label }));
  const presetOpts = PROGRESSION_PRESETS.map((p, i) => ({ value: String(i), label: p.name }));
  const keyOpts = [...NOTE_NAMES].map((k) => ({ value: k, label: keyDisplayLabel(k) }));
  const degreeOpts = DEGREE_OPTIONS.map((d) => ({ value: String(d.semitones), label: d.label }));

  // Grouped scale select
  const scaleGroups = SCALE_GROUPS.map((g) => ({
    label: g.label,
    options: g.scales.map((s) => ({ value: s, label: SCALES[s].name })),
  }));

  // Grouped chord select (for chord mode)
  const chordGroups = CHORD_GROUPS.map((g) => ({
    label: g.label,
    options: g.chords.map((c) => ({ value: c, label: CHORD_DISPLAY_NAMES[c] })),
  }));

  // Grouped chord select for progression builder (same data)
  const builderChordGroups = chordGroups;

  const modeRadios = MODES.map(
    (m, i) => `<input type="radio" name="mode" id="mode-${m}" value="${m}" ${i === 0 ? "checked" : ""} /><label for="mode-${m}">${m}</label>`
  ).join("");

  return `
    <header>
      <h1>web theory</h1>
      <p>notes, scales, chords &amp; progressions</p>
    </header>

    <div class="controls">
      <div class="field">
        <label>mode</label>
        <div class="mode-group">${modeRadios}</div>
      </div>

      <!-- pitch row (note/scale/chord modes) -->
      <div class="row" id="pitch-row">
        <div class="field">
          <label for="pitch">pitch</label>
          ${buildSelect("pitch", noteOpts)}
        </div>
        <div class="field">
          <label for="waveform">waveform</label>
          ${buildSelect("waveform", waveOpts)}
        </div>
      </div>

      <!-- key row (progression mode) -->
      <div class="row" id="key-row">
        <div class="field">
          <label for="prog-key">key</label>
          ${buildSelect("prog-key", keyOpts)}
        </div>
        <div class="field">
          <label for="prog-octave">octave</label>
          <input type="number" id="prog-octave" value="3" min="1" max="6" />
        </div>
        <div class="field">
          <label for="waveform-prog">waveform</label>
          ${buildSelect("waveform-prog", waveOpts)}
        </div>
      </div>

      <div class="row">
        <div class="field" id="duration-field">
          <label for="duration">duration (beats)</label>
          ${buildSelect("duration", durOpts)}
        </div>
        <div class="field">
          <label for="bpm">bpm</label>
          <input type="number" id="bpm" value="120" min="1" max="300" />
        </div>
      </div>

      <div class="field" id="scale-field">
        <label for="scale-type">scale</label>
        ${buildGroupedSelect("scale-type", scaleGroups)}
      </div>

      <div class="field" id="chord-field">
        <label for="chord-type">chord</label>
        ${buildGroupedSelect("chord-type", chordGroups)}
      </div>

      <!-- Progression panel -->
      <div id="prog-field">
        <div class="field">
          <label>source</label>
          <div class="mode-group">
            <input type="radio" name="prog-source" id="prog-src-preset" value="preset" checked /><label for="prog-src-preset">preset</label>
            <input type="radio" name="prog-source" id="prog-src-custom" value="custom" /><label for="prog-src-custom">custom</label>
          </div>
        </div>

        <div class="field" id="preset-field">
          <label for="prog-preset">progression</label>
          ${buildSelect("prog-preset", presetOpts)}
          <div class="prog-description" id="preset-description"></div>
          <div class="prog-steps-display" id="preset-steps"></div>
        </div>

        <div id="custom-field">
          <div class="field">
            <label>add step</label>
            <div class="row">
              <div class="field">
                ${buildSelect("add-degree", degreeOpts)}
              </div>
              <div class="field">
                ${buildGroupedSelect("add-chord-type", builderChordGroups)}
              </div>
              <div class="field">
                <input type="number" id="add-bars" value="1" min="1" max="8" title="bars" />
              </div>
              <div class="field">
                <input type="number" id="add-hits" value="1" min="1" max="8" title="hits per bar" />
              </div>
              <div class="field" style="flex:0">
                <button class="add-step-btn" id="add-step-btn">+</button>
              </div>
            </div>
            <div class="field-hint">degree · chord · bars · hits/bar</div>
          </div>
          <div class="prog-steps-display" id="custom-steps"></div>
        </div>

        <div class="row">
          <div class="field">
            <label for="prog-repeats">repeats</label>
            <input type="number" id="prog-repeats" value="1" min="1" max="16" />
          </div>
          <div class="field">
            <label for="prog-hits-global">hits / bar</label>
            <input type="number" id="prog-hits-global" value="1" min="1" max="8" />
          </div>
        </div>
      </div>

      <div id="piano-slot"></div>

      <button class="play-btn" id="play-btn">▶ play</button>
      <div class="status" id="status"></div>
    </div>
  `;
}

// ── Wire up ──

const app = document.getElementById("app")!;
app.innerHTML = render();

const piano = createPianoKeyboard();
document.getElementById("piano-slot")!.appendChild(piano.element);

const modeInputs = document.querySelectorAll<HTMLInputElement>('input[name="mode"]');
const pitchSelect = document.getElementById("pitch") as HTMLSelectElement;
const waveformSelect = document.getElementById("waveform") as HTMLSelectElement;
const durationSelect = document.getElementById("duration") as HTMLSelectElement;
const bpmInput = document.getElementById("bpm") as HTMLInputElement;
const chordTypeSelect = document.getElementById("chord-type") as HTMLSelectElement;
const scaleTypeSelect = document.getElementById("scale-type") as HTMLSelectElement;
const chordField = document.getElementById("chord-field")!;
const scaleField = document.getElementById("scale-field")!;
const pitchRow = document.getElementById("pitch-row")!;
const keyRow = document.getElementById("key-row")!;
const durationField = document.getElementById("duration-field")!;
const progField = document.getElementById("prog-field")!;
const presetField = document.getElementById("preset-field")!;
const customField = document.getElementById("custom-field")!;
const progPresetSelect = document.getElementById("prog-preset") as HTMLSelectElement;
const presetDescription = document.getElementById("preset-description")!;
const presetStepsEl = document.getElementById("preset-steps")!;
const customStepsEl = document.getElementById("custom-steps")!;
const progSourceInputs = document.querySelectorAll<HTMLInputElement>('input[name="prog-source"]');
const progKeySelect = document.getElementById("prog-key") as HTMLSelectElement;
const progOctaveInput = document.getElementById("prog-octave") as HTMLInputElement;
const waveformProgSelect = document.getElementById("waveform-prog") as HTMLSelectElement;
const addDegreeSelect = document.getElementById("add-degree") as HTMLSelectElement;
const addChordTypeSelect = document.getElementById("add-chord-type") as HTMLSelectElement;
const addBarsInput = document.getElementById("add-bars") as HTMLInputElement;
const addHitsInput = document.getElementById("add-hits") as HTMLInputElement;
const addStepBtn = document.getElementById("add-step-btn") as HTMLButtonElement;
const progRepeatsInput = document.getElementById("prog-repeats") as HTMLInputElement;
const progHitsGlobalInput = document.getElementById("prog-hits-global") as HTMLInputElement;
const playBtn = document.getElementById("play-btn") as HTMLButtonElement;
const statusEl = document.getElementById("status")!;

pitchSelect.value = "c4";
durationSelect.value = "0.25";

function getMode(): Mode {
  const checked = document.querySelector<HTMLInputElement>('input[name="mode"]:checked');
  return (checked?.value as Mode) ?? "note";
}

function getProgSource(): "preset" | "custom" {
  const checked = document.querySelector<HTMLInputElement>('input[name="prog-source"]:checked');
  return (checked?.value as "preset" | "custom") ?? "preset";
}

// ── Progression display helpers ──

function chordShortLabel(chordType: ChordType): string {
  return CHORD_DISPLAY_NAMES[chordType] ?? chordType;
}

function renderStepBadges(steps: ProgressionStep[]): string {
  return steps.map((s, i) => {
    const qualityLabel = chordShortLabel(s.chordType);
    const barsLabel = s.bars > 1 ? ` ×${s.bars}` : "";
    const hitsLabel = s.hitsPerBar > 1 ? ` ♩${s.hitsPerBar}` : "";
    return `<span class="step-badge" data-index="${i}">
      <span class="step-label">${s.label}</span>
      <span class="step-quality">${qualityLabel}${barsLabel}${hitsLabel}</span>
    </span>`;
  }).join("");
}

function renderCustomSteps() {
  if (customSteps.length === 0) {
    customStepsEl.innerHTML = `<span class="prog-empty">no steps added yet</span>`;
    return;
  }
  customStepsEl.innerHTML = customSteps.map((s, i) => {
    const qualityLabel = chordShortLabel(s.chordType);
    const barsLabel = s.bars > 1 ? ` ×${s.bars}` : "";
    const hitsLabel = s.hitsPerBar > 1 ? ` ♩${s.hitsPerBar}` : "";
    return `<span class="step-badge removable" data-index="${i}">
      <span class="step-label">${s.label}</span>
      <span class="step-quality">${qualityLabel}${barsLabel}${hitsLabel}</span>
      <button class="step-remove" data-index="${i}" title="Remove">×</button>
    </span>`;
  }).join("");

  customStepsEl.querySelectorAll<HTMLButtonElement>(".step-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.index);
      customSteps.splice(idx, 1);
      renderCustomSteps();
      updateKeyboard();
    });
  });
}

function updatePresetDisplay() {
  const preset = PROGRESSION_PRESETS[Number(progPresetSelect.value)];
  if (!preset) return;
  presetDescription.textContent = preset.description;
  presetStepsEl.innerHTML = renderStepBadges(preset.steps);
}

// ── Visibility ──

function updateVisibility() {
  const mode = getMode();
  const isProg = mode === "progression";

  scaleField.classList.toggle("hidden", mode !== "scale");
  chordField.classList.toggle("hidden", mode !== "chord");
  progField.classList.toggle("hidden", !isProg);
  pitchRow.classList.toggle("hidden", isProg);
  keyRow.classList.toggle("hidden", !isProg);
  durationField.classList.toggle("hidden", isProg);

  if (isProg) updateProgSourceVisibility();
  updateKeyboard();
}

function updateProgSourceVisibility() {
  const src = getProgSource();
  presetField.classList.toggle("hidden", src !== "preset");
  customField.classList.toggle("hidden", src !== "custom");
}

// ── Keyboard preview ──

function getProgTonic(): number {
  const key = progKeySelect.value;
  const oct = parseInt(progOctaveInput.value, 10) || 3;
  return getFrequencyFromName(`${key}${oct}`);
}

function getCurrentSteps(): ProgressionStep[] {
  if (getProgSource() === "preset") {
    return PROGRESSION_PRESETS[Number(progPresetSelect.value)]?.steps ?? [];
  }
  return customSteps;
}

function getCurrentFrequencies(): number[] {
  const mode = getMode();

  if (mode === "progression") {
    const tonic = getProgTonic();
    const steps = getCurrentSteps();
    if (steps.length === 0) return [tonic];
    const freqs = new Set<number>();
    const resolved = resolveProgression(steps, tonic);
    for (const r of resolved) {
      for (const iv of r.intervals) {
        freqs.add(Math.round(getFrequencyFromTonicAndInterval(r.tonicFreq, iv) * 100) / 100);
      }
    }
    return [...freqs];
  }

  const pitchName = pitchSelect.value;
  const tonic = getFrequencyFromName(pitchName);

  switch (mode) {
    case "note":
      return [tonic];
    case "chord": {
      const intervals = CHORD_INTERVALS[chordTypeSelect.value as ChordType];
      return [...intervals].map((iv) => getFrequencyFromTonicAndInterval(tonic, iv));
    }
    case "scale": {
      const scaleData = SCALES[scaleTypeSelect.value as ScaleName];
      return scaleData.intervals.map((iv) => getFrequencyFromTonicAndInterval(tonic, iv));
    }
  }
}

function updateKeyboard() {
  piano.stopSequence();
  piano.highlight(getCurrentFrequencies());
}

// ── Event listeners ──

modeInputs.forEach((input) => input.addEventListener("change", updateVisibility));
progSourceInputs.forEach((input) => input.addEventListener("change", () => {
  updateProgSourceVisibility();
  updateKeyboard();
}));
pitchSelect.addEventListener("change", updateKeyboard);
chordTypeSelect.addEventListener("change", updateKeyboard);
scaleTypeSelect.addEventListener("change", updateKeyboard);
progPresetSelect.addEventListener("change", () => { updatePresetDisplay(); updateKeyboard(); });
progKeySelect.addEventListener("change", updateKeyboard);
progOctaveInput.addEventListener("change", updateKeyboard);

addStepBtn.addEventListener("click", () => {
  const degreeOpt = DEGREE_OPTIONS[addDegreeSelect.selectedIndex];
  const chordType = addChordTypeSelect.value as ChordType;
  const bars = parseInt(addBarsInput.value, 10) || 1;
  const hitsPerBar = parseInt(addHitsInput.value, 10) || 1;

  customSteps.push({
    label: degreeOpt.label,
    semitones: degreeOpt.semitones,
    chordType,
    bars,
    hitsPerBar,
  });

  renderCustomSteps();
  updateKeyboard();
});

// Init
updatePresetDisplay();
renderCustomSteps();
updateVisibility();

// ── Playback ──

function showStatus(msg: string, playing = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle("playing", playing);
}

function stopPlayback() {
  if (playbackTimer !== null) {
    clearTimeout(playbackTimer);
    playbackTimer = null;
  }
  if (ctx && ctx.state !== "closed") {
    ctx.close();
    ctx = null;
  }
  piano.stopSequence();
  isPlaying = false;
  playBtn.classList.remove("stopping");
  playBtn.textContent = "▶ play";
  showStatus("");
  updateKeyboard();
}

function enterPlayingState() {
  isPlaying = true;
  playBtn.classList.add("stopping");
  playBtn.textContent = "■ stop";
}

function scheduleEnd(totalSeconds: number) {
  playbackTimer = setTimeout(() => {
    playbackTimer = null;
    stopPlayback();
  }, totalSeconds * 1000 + 150);
}

function noteValueToSeconds(value: number, bpm: number): number {
  return value * 4 * (60 / bpm);
}

function beatsToSeconds(beats: number, bpm: number): number {
  return beats * (60 / bpm);
}

function handlePlay() {
  // Toggle: if playing, stop
  if (isPlaying) {
    stopPlayback();
    return;
  }

  const audioCtx = getAudioContext();
  const mode = getMode();
  const bpm = parseInt(bpmInput.value, 10) || 120;

  let totalSeconds = 0;

  try {
    if (mode === "progression") {
      const tonic = getProgTonic();
      const waveform = waveformProgSelect.value as WaveformType;
      const steps = getCurrentSteps();
      const repeats = parseInt(progRepeatsInput.value, 10) || 1;

      if (steps.length === 0) {
        showStatus("add some steps first");
        return;
      }

      const resolved = resolveProgression(steps, tonic);
      const beatsPerBar = TIME_SIGNATURES.FOUR_FOUR;
      const globalHits = parseInt(progHitsGlobalInput.value, 10) || 1;
      const isPreset = getProgSource() === "preset";

      const options = { context: audioCtx, waveform, bpm, gain: 0.35, timeSignature: beatsPerBar };

      let currentTime = audioCtx.currentTime;
      const allChords: { chord: Chord; startTime: number; durationSec: number }[] = [];

      for (let rep = 0; rep < repeats; rep++) {
        for (const step of resolved) {
          const hitsPerBar = isPreset ? globalHits : step.hitsPerBar;
          const hitBeats = beatsPerBar / hitsPerBar;
          const hitNoteValue = hitBeats / beatsPerBar as Duration;

          for (let bar = 0; bar < step.bars; bar++) {
            for (let hit = 0; hit < hitsPerBar; hit++) {
              const hitDuration = beatsToSeconds(hitBeats, bpm);
              const chord = createChordFromIntervals(step.tonicFreq, step.intervals, hitNoteValue);
              chord.notes.forEach((n) => (n.value = hitNoteValue));
              scheduleChord(chord, currentTime, options);
              allChords.push({ chord, startTime: currentTime, durationSec: hitDuration });
              currentTime += hitDuration;
            }
          }
        }
      }

      totalSeconds = currentTime - audioCtx.currentTime;

      const chordFreqs = allChords.map((c) => c.chord.notes.map((n) => n.frequency));
      const chordDurations = allChords.map((c) => c.durationSec);
      animateChordSequence(chordFreqs, chordDurations);

      const presetName = isPreset
        ? PROGRESSION_PRESETS[Number(progPresetSelect.value)]?.name ?? "progression"
        : "custom progression";
      showStatus(`playing ${presetName} in ${keyDisplayLabel(progKeySelect.value)}...`, true);

    } else {
      const pitchName = pitchSelect.value;
      const pitchLabel = noteDisplayLabel(pitchName);
      const waveform = waveformSelect.value as WaveformType;
      const noteValue = parseFloat(durationSelect.value) as Duration;
      const tonic = getFrequencyFromName(pitchName);
      const options = { context: audioCtx, waveform, bpm, gain: 0.35, timeSignature: TIME_SIGNATURES.FOUR_FOUR };

      switch (mode) {
        case "note": {
          const note = createNote(tonic, noteValue);
          scheduleNote(note, audioCtx.currentTime, options);
          totalSeconds = noteValueToSeconds(noteValue, bpm);
          piano.highlight([tonic]);
          showStatus(`playing ${pitchLabel}...`, true);
          break;
        }
        case "chord": {
          const chordType = chordTypeSelect.value as ChordType;
          const intervals = CHORD_INTERVALS[chordType];
          const chord = createChordFromIntervals(tonic, intervals, noteValue);
          totalSeconds = playChord(chord, options);
          piano.highlight(chord.notes.map((n) => n.frequency));
          showStatus(`playing ${chordShortLabel(chordType)} on ${pitchLabel}...`, true);
          break;
        }
        case "scale": {
          const scaleName = scaleTypeSelect.value as ScaleName;
          const notes = createScale(scaleName, tonic);
          notes.forEach((n) => (n.value = noteValue));
          totalSeconds = playScale(notes, options);
          const intervalMs = noteValueToSeconds(noteValue, bpm) * 1000;
          piano.highlightSequence(notes.map((n) => n.frequency), intervalMs);
          showStatus(`playing ${SCALES[scaleName].name} from ${pitchLabel}...`, true);
          break;
        }
      }
    }

    enterPlayingState();
    scheduleEnd(totalSeconds);
  } catch (e) {
    console.error(e);
    showStatus(`error: ${(e as Error).message}`);
    stopPlayback();
  }
}

function animateChordSequence(chordFreqs: number[][], durationsMs: number[]) {
  let idx = 0;
  function step() {
    if (!isPlaying || idx >= chordFreqs.length) return;
    piano.highlight(chordFreqs[idx]);
    const dur = (durationsMs[idx] ?? 1) * 1000;
    idx++;
    setTimeout(step, dur);
  }
  step();
}

playBtn.addEventListener("click", handlePlay);
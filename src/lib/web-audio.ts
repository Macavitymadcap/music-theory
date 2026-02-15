import type { Note } from "./notes";
import type { Chord } from "./chords";

export type WaveformType = "sine" | "sawtooth" | "square" | "triangle";

interface PlayOptions {
  /** Web Audio API AudioContext */
  context: AudioContext;
  /** Destination node (defaults to context.destination) */
  destination?: AudioNode;
  /** Waveform type for oscillators */
  waveform?: WaveformType;
  /** BPM for timing note durations (default: 120) */
  bpm?: number;
  /** Master gain 0-1 (default: 0.3) */
  gain?: number;
  /** Time signature - beats per measure (default: 4) */
  timeSignature?: number;
}

/**
 * Convert a note's `value` (fraction of a whole note) to seconds at a given BPM.
 * In 4/4 time, a whole note = 4 beats. At 120 BPM, one beat = 0.5s.
 */
function noteValueToSeconds(value: number, bpm: number, timeSignature: number): number {
  const secondsPerBeat = 60 / bpm;
  const beatsForNote = value * timeSignature;
  return beatsForNote * secondsPerBeat;
}

/**
 * Create a simple ADSR envelope matching the C version's amplitude multiplier.
 * Attack: first 25% ramps up to 1.0
 * Decay: 25-50% decays to ~0.2
 * Release: 50-100% fades to 0
 */
function applyEnvelope(
  gainNode: GainNode,
  startTime: number,
  duration: number
): void {
  const attack = duration * 0.25;
  const decay = duration * 0.25;
  const releaseStart = duration * 0.5;

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(1.0, startTime + attack);
  gainNode.gain.linearRampToValueAtTime(0.2, startTime + attack + decay);
  gainNode.gain.linearRampToValueAtTime(0, startTime + releaseStart + (duration - releaseStart));
}

/**
 * Schedule a single note to play via the Web Audio API.
 * Returns the oscillator node for further chaining if needed.
 */
export function scheduleNote(
  note: Note,
  startTime: number,
  options: PlayOptions
): OscillatorNode {
  const {
    context,
    destination = context.destination,
    waveform = "sine",
    bpm = 120,
    gain = 0.3,
    timeSignature = 4,
  } = options;

  const duration = noteValueToSeconds(note.value, bpm, timeSignature);

  const oscillator = context.createOscillator();
  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(note.frequency, startTime);

  const gainNode = context.createGain();
  gainNode.gain.setValueAtTime(0, startTime);
  applyEnvelope(gainNode, startTime, duration);

  // Scale by master gain
  const masterGain = context.createGain();
  masterGain.gain.setValueAtTime(gain, startTime);

  oscillator.connect(gainNode);
  gainNode.connect(masterGain);
  masterGain.connect(destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);

  return oscillator;
}

/**
 * Schedule a chord (all notes simultaneously) at a given start time.
 */
export function scheduleChord(
  chord: Chord,
  startTime: number,
  options: PlayOptions
): OscillatorNode[] {
  // Reduce per-note gain to avoid clipping when stacking notes
  const perNoteGain = (options.gain ?? 0.3) / chord.length;
  const adjustedOptions = { ...options, gain: perNoteGain };

  return chord.notes.map((note) =>
    scheduleNote(note, startTime, adjustedOptions)
  );
}

/**
 * Play a scale sequentially. Returns total duration in seconds.
 */
export function playScale(notes: Note[], options: PlayOptions): number {
  const { bpm = 120, timeSignature = 4 } = options;
  let currentTime = options.context.currentTime;

  for (const note of notes) {
    scheduleNote(note, currentTime, options);
    currentTime += noteValueToSeconds(note.value, bpm, timeSignature);
  }

  return currentTime - options.context.currentTime;
}

/**
 * Play a chord (all notes at once). Returns the chord's duration in seconds.
 */
export function playChord(chord: Chord, options: PlayOptions): number {
  const startTime = options.context.currentTime;
  const { bpm = 120, timeSignature = 4 } = options;

  scheduleChord(chord, startTime, options);

  // Duration is determined by the first note's value
  return noteValueToSeconds(chord.notes[0].value, bpm, timeSignature);
}

/**
 * Play a sequence of chords. Each chord plays for its note duration then advances.
 * Returns total duration in seconds.
 */
export function playChordProgression(
  chords: Chord[],
  options: PlayOptions
): number {
  const { bpm = 120, timeSignature = 4 } = options;
  let currentTime = options.context.currentTime;

  for (const chord of chords) {
    scheduleChord(chord, currentTime, options);
    const duration = noteValueToSeconds(chord.notes[0].value, bpm, timeSignature);
    currentTime += duration;
  }

  return currentTime - options.context.currentTime;
}

/**
 * Connect the output to a chain of AudioNodes before reaching the destination.
 * Returns the final node in the chain (to use as `destination` in PlayOptions).
 *
 * Example:
 *   const delay = ctx.createDelay();
 *   const reverb = ctx.createConvolver();
 *   const output = chainNodes(ctx, delay, reverb);
 *   playScale(notes, { context: ctx, destination: output });
 */
export function chainNodes(
  context: AudioContext,
  ...nodes: AudioNode[]
): AudioNode {
  for (let i = 0; i < nodes.length - 1; i++) {
    nodes[i].connect(nodes[i + 1]);
  }
  if (nodes.length > 0) {
    nodes[nodes.length - 1].connect(context.destination);
  }
  return nodes[0] ?? context.destination;
}
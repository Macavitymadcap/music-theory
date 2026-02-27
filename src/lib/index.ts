export {
  type Note,
  type NoteName,
  NOTE_NAMES,
  NOTE_FREQUENCIES,
  TOTAL_SEMITONES,
  getFrequencyFromName,
  getFrequencyFromTonicAndInterval,
  createNote,
} from "./notes";

export {
  type Duration,
  type TimeSignature,
  DURATIONS,
  TIME_SIGNATURES
} from "./duration";

export {
  type Scale,
  type ScaleName,
  type ScaleGroup,
  SCALES,
  SCALE_GROUPS,
  createScale,
  createScaleNotes,
  createScaleFromNoteName,
} from "./scales";

export {
  type Chord,
  type ChordType,
  type ChordGroup,
  CHORD_INTERVALS,
  CHORD_GROUPS,
  CHORD_DISPLAY_NAMES,
  createChord,
  createChordFromIntervals,
  createChordFromNoteName,
} from "./chords";

export {
  type WaveformType,
  scheduleNote,
  scheduleChord,
  playScale,
  playChord,
  playChordProgression,
  chainNodes,
  durationToSeconds,
  applyEnvelope
} from "./web-audio";

export {
  PROGRESSION_PRESETS,
  DEGREE_OPTIONS,
  resolveProgression,
  type ProgressionStep,
} from "./progressions";